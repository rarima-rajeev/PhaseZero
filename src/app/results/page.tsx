import Image from "next/image";
import results from "@/data/results.json";

type OrganKey = "liver" | "heart";

const ORGAN_LABEL: Record<OrganKey, string> = { liver: "Liver", heart: "Heart" };

const back = results.backtest.organs as Record<
  OrganKey,
  {
    withdrawn: number;
    caught: number;
    clean_drugs: number;
    clean_flagged: number;
    results: { id: string; name: string; score: number; caught: boolean }[];
  }
>;
const train = results.train as Record<
  OrganKey,
  { training_rows: number; positives: number; test_rows: number; test_auc: number; cv_auc: number }
>;

type ExpOrgan = {
  n: number;
  ml_auc: number;
  gemini_auc: number;
  ml_accuracy: number;
  gemini_accuracy: number;
  repeat_n: number;
  gemini_same_flag_on_repeat: number;
  gemini_mean_abs_change: number;
};

const exp = (results as Record<string, unknown>).experiment as null | {
  model: string;
  liver?: ExpOrgan;
  heart?: ExpOrgan;
};

const ft = (results as Record<string, unknown>).finetune as null | {
  model_id: string;
  epochs: number;
  train_rows: number;
  test_rows: number;
  finetuned_auc: number;
  finetuned_accuracy: number;
  random_forest_auc: number;
  random_forest_accuracy: number;
};

const cost = (results as Record<string, unknown>).gemini_cost as null | {
  cards: { calls: number; inr: number };
  experiment: { calls: number; inr: number };
  total_inr: number;
};

const ORGANS: OrganKey[] = ["liver", "heart"];

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-14 text-xl font-semibold tracking-tight">{children}</h2>;
}

/** A short plain-English line above a section, in the same voice as How it works. */
function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">{children}</p>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-stone-300 bg-white p-4">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs leading-snug text-stone-500">{label}</div>
    </div>
  );
}

export default function Results() {
  const missed = ORGANS.flatMap((o) =>
    back[o].results.filter((r) => !r.caught).map((r) => ({ ...r, organ: o })),
  ).sort((a, b) => a.score - b.score);

  const caught = ORGANS.reduce((n, o) => n + back[o].caught, 0);
  const total = ORGANS.reduce((n, o) => n + back[o].withdrawn, 0);

  return (
    <div>
      <Image
        src="/img/lab.webp"
        alt="A desk seen from above with laboratory glassware, an open notebook and molecule diagrams."
        width={1200}
        height={655}
        priority
        className="mb-8 h-40 w-full rounded-xl border border-stone-200 object-cover object-center sm:h-52"
      />
      <h1 className="text-3xl font-semibold tracking-tight">Results &amp; decisions</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Three tests, what they showed, and what I decided because of them. The misses are here too,
        along with the one that did not work.
      </p>

      {/* ---------------------------------------------------------------- Test 1 */}
      <H>Test 1 — would it have spotted the bad ones?</H>
      <Lead>
        Some drugs reached the market and were later pulled off it because they harmed people. Those
        are the cases that matter. So I gave the model a proper exam: those drugs were kept out of
        its training entirely, then it was asked to score them cold.
      </Lead>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat value={`${caught} of ${total}`} label="drugs later pulled from the market that it flagged" />
        <Stat value={`${total - caught}`} label="it missed — every one is named below" />
        <Stat
          value={`${back.liver.clean_flagged + back.heart.clean_flagged}`}
          label="false alarms on drugs with no known problems"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[26rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="py-2 pr-4 font-semibold">&nbsp;</th>
              <th className="py-2 pr-4 font-semibold">Spotted</th>
              <th className="py-2 pr-4 font-semibold">Missed</th>
              <th className="py-2 font-semibold">False alarms</th>
            </tr>
          </thead>
          <tbody>
            {ORGANS.map((o) => (
              <tr key={o} className="border-b border-stone-200">
                <td className="py-2 pr-4">{ORGAN_LABEL[o]}</td>
                <td className="py-2 pr-4">
                  {back[o].caught} of {back[o].withdrawn}
                </td>
                <td className="py-2 pr-4">{back[o].withdrawn - back[o].caught}</td>
                <td className="py-2">
                  {back[o].clean_flagged} of {back[o].clean_drugs}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Lead>
        <span className="font-medium">Read that honestly.</span> It catches a good share of the real
        problems — and it cries wolf a lot, especially about the liver. That is the trade-off I chose.
        Early on, a cheap false alarm just means someone looks twice. A miss means a drug that hurts
        people sails through. I would never choose that trade-off for a decision about a patient.
      </Lead>

      <details className="mt-5 rounded-lg border border-stone-300 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium">
          The {missed.length} it missed — and why
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          The model only sees a drug&apos;s shape, and it was taught one kind of harm per organ. So it
          misses anything that does not show up in the shape.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          Rofecoxib is the clearest case. It was pulled off the market worldwide in 2004 for heart
          harm, and our heart model gives it 13 out of 100. Not a bug — it was trained on drugs that
          upset the heart&apos;s rhythm, and rofecoxib damaged hearts a completely different way.
          Paracetamol is the other one: safe at the normal dose, dangerous at a high one, and nothing
          in its shape says so.
        </p>
        <ul className="mt-4 grid gap-1 text-sm text-stone-600 sm:grid-cols-2">
          {missed.map((m) => (
            <li key={`${m.organ}-${m.id}`}>
              {m.name} — {ORGAN_LABEL[m.organ as OrganKey].toLowerCase()}, scored{" "}
              {Math.round(m.score * 100)}
            </li>
          ))}
        </ul>
      </details>

      {/* ---------------------------------------------------------------- Test 2 */}
      <H>Test 2 — my own model, or just ask a chatbot?</H>
      <Lead>
        This is the question behind every AI project, so I tested it instead of guessing. Both were
        given the same chemicals, which neither had seen before, and the same question.
      </Lead>

      {exp ? (
        <>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="py-2 pr-4 font-semibold">&nbsp;</th>
                  <th className="py-2 pr-4 font-semibold">My model</th>
                  <th className="py-2 pr-4 font-semibold">Gemini AI</th>
                  <th className="py-2 font-semibold">Examples it learned from</th>
                </tr>
              </thead>
              <tbody>
                {ORGANS.filter((o) => exp[o]).map((o) => {
                  const e = exp[o]!;
                  const mlWins = e.ml_auc > e.gemini_auc;
                  return (
                    <tr key={o} className="border-b border-stone-200">
                      <td className="py-2 pr-4">
                        {ORGAN_LABEL[o]}
                        <span className="block text-xs text-stone-500">{e.n} chemicals</span>
                      </td>
                      <td className={`py-2 pr-4 ${mlWins ? "font-semibold" : ""}`}>
                        {Math.round(e.ml_auc * 100)}
                        <span className="block text-xs font-normal text-stone-500">
                          {pct(e.ml_accuracy)} right
                        </span>
                      </td>
                      <td className={`py-2 pr-4 ${mlWins ? "" : "font-semibold"}`}>
                        {Math.round(e.gemini_auc * 100)}
                        <span className="block text-xs font-normal text-stone-500">
                          {pct(e.gemini_accuracy)} right
                        </span>
                      </td>
                      <td className="py-2 text-stone-600">
                        {train[o].training_rows.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            Scores are out of 100, where 50 is a coin flip. The winner of each row is in bold.
            Chatbot tested: {exp.model}.
          </p>

          <div className="mt-6 rounded-xl border border-stone-300 bg-white p-5">
            <h3 className="font-semibold">They won one each, and that is the useful part</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-700">
              Look at the last column. Where I had only a few hundred examples, the chatbot won. Where
              I had eleven thousand, my own model won easily. Same code, same method — the only thing
              that changed was how much data there was.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">
              So the rule I would actually use:{" "}
              <span className="font-medium">
                use a chatbot while your data is thin, and train your own model once the data arrives.
              </span>{" "}
              If I had tested only one of the two organs, I would have walked away confident and
              wrong.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">
              <span className="font-medium">One caveat I cannot rule out.</span> These are famous
              drugs. The chatbot has almost certainly read about them, so on the liver it may be
              remembering rather than working anything out. My model had no such help — every drug it
              was tested on was kept out of its training. To settle it, I would re-run this on
              chemicals too new for any chatbot to have read about. Until then I would call the
              chatbot&apos;s win promising, not proven.
            </p>
          </div>
        </>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-600">
          Numbers coming — this test is still running.
        </p>
      )}

      {/* ---------------------------------------------------------------- Test 3 */}
      {ft && (
        <>
          <H>Test 3 — would a fancier model do better?</H>
          <Lead>
            My liver model is the weak one: it only had a few hundred examples to learn from. The
            usual advice is to start from a model someone else already trained on millions of
            molecules, and teach it your specific job. That is called fine-tuning. So I tried it.
          </Lead>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="py-2 pr-4 font-semibold">Liver, {ft.test_rows} held-out chemicals</th>
                  <th className="py-2 pr-4 font-semibold">My simple model</th>
                  <th className="py-2 font-semibold">Fine-tuned model</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-stone-200">
                  <td className="py-2 pr-4">Sorting risky from safe</td>
                  <td className="py-2 pr-4 font-semibold">
                    {Math.round(ft.random_forest_auc * 100)}
                  </td>
                  <td className="py-2">{Math.round(ft.finetuned_auc * 100)}</td>
                </tr>
                <tr className="border-b border-stone-200">
                  <td className="py-2 pr-4">Right answers</td>
                  <td className="py-2 pr-4">{pct(ft.random_forest_accuracy)}</td>
                  <td className="py-2 font-semibold">{pct(ft.finetuned_accuracy)}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Time and setup</td>
                  <td className="py-2 pr-4">3 minutes, nothing to install</td>
                  <td className="py-2">8 minutes, 2.5 GB to install</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Lead>
            <span className="font-medium">Neither one won.</span> The fine-tuned model sorts slightly
            worse and guesses slightly better, and on {ft.test_rows} chemicals that gap is noise, not
            a finding. I gave it a fair run — by the end it had all but memorised its {ft.train_rows}{" "}
            training examples and still had not pulled ahead, so more training would only have made
            it worse.
          </Lead>

          <Lead>
            It makes sense. The borrowed model knows a great deal about molecules in general, but it
            has millions of internal settings and only {ft.train_rows} examples to adjust them with.
            My simple model has far less to get wrong. On thin data, simple is hard to beat.
          </Lead>

          <Lead>
            <span className="font-medium">So I kept the simple one</span> — same answer, three
            minutes, nothing to install. I am keeping the negative result on this page because it is
            the more useful half of the story: the fashionable method was tested, and it lost.
          </Lead>

          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-stone-500">
            One thing worth flagging: the borrowed model&apos;s weights carry no stated licence, which
            is common in this field and a real risk if you ship something built on them. Since this
            was a negative result, nothing derived from it is used anywhere on this site. Model
            tested: {ft.model_id.split("/")[1]}, {ft.epochs} rounds of training.
          </p>
        </>
      )}

      {/* ---------------------------------------------------------------- Cost */}
      {cost && (
        <>
          <H>What the whole thing cost</H>
          <Lead>
            All the AI work happens once, on a laptop, before anyone visits. So this is the entire
            bill — not a monthly one, and not one that grows as more people come.
          </Lead>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat value={`₹${cost.cards.inr}`} label="writing the 500 plain-English summaries" />
            <Stat value={`₹${cost.experiment.inr}`} label="running the chatbot test above" />
            <Stat value="₹0" label="per visitor, because nothing is worked out live" />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            ₹{cost.total_inr} in total. Training the two models cost nothing but a few minutes of
            laptop time.
          </p>
        </>
      )}

      {/* ---------------------------------------------------------------- Takeaways */}
      <H>What I took away</H>
      <ul className="mt-4 space-y-4 text-sm leading-relaxed text-stone-700">
        <li>
          <span className="font-semibold">
            &ldquo;Train a model or use a chatbot?&rdquo; has no fixed answer.
          </span>{" "}
          It depends on how much data you have, and the only honest way to know is to try both. That
          test cost ₹{cost ? cost.experiment.inr : 77} and an afternoon — nothing, next to choosing
          wrong and finding out in six months.
        </li>
        <li>
          <span className="font-semibold">A number you cannot explain is not a result.</span> The
          chatbot has probably read about every drug I tested it on, so part of its score may be
          memory rather than skill. I would rather say that out loud than quote a figure I do not
          trust.
        </li>
        <li>
          <span className="font-semibold">Know what your model cannot see.</span> Ours scores
          rofecoxib 13 out of 100 — a famous drug pulled for heart harm. It is right about what it was
          taught and wrong about the drug, and that gap is the whole job.
        </li>
        <li>
          <span className="font-semibold">Fixed steps, and the AI kept away from the facts.</span>{" "}
          Every drug takes the same route, so the whole thing can be tested. Gemini AI only writes,
          using facts it is handed, and a summary that cites a source which does not exist is thrown
          away automatically.
        </li>
      </ul>

      {/* ---------------------------------------------------------------- Limits */}
      <H>What this cannot do</H>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
        <li>It is a nudge to look closer, not an answer. It gets things wrong both ways.</li>
        <li>
          It knows 500 well-known drugs and two kinds of harm. Drugs fail for many other reasons —
          most often, they simply do not work.
        </li>
        <li>
          It only reads a drug&apos;s shape. The dose, how a body handles it, and who is taking it
          matter enormously and are nowhere in here.
        </li>
        <li>
          Very few drugs are ever pulled from the market, so Test 1 rests on a small number of
          examples.
        </li>
        <li>No patient data of any kind. Everything comes from free public databases.</li>
        <li>
          I am an AI product manager, not a drug expert. This shows how I build, measure and decide —
          a real scientist would judge the chemistry far better than I can.
        </li>
      </ul>
      <p className="mt-4 text-sm font-medium">
        Decision support for researchers. Not medical advice.
      </p>

      {/* ---------------------------------------------------------------- Next */}
      <H>What I would build next</H>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
        <li>More kinds of harm. Kidney and blood are the obvious ones to add.</li>
        <li>
          Let a researcher paste in a brand-new chemical that has never been approved — the case where
          this would really earn its keep.
        </li>
        <li>Show how sure the model is, so a 51 does not read like a 95.</li>
      </ul>

      <details className="mt-10 rounded-lg border border-stone-300 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium">
          The technical details, for anyone who wants them
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="py-2 pr-4 font-semibold">Model</th>
                <th className="py-2 pr-4 font-semibold">Learned from</th>
                <th className="py-2 pr-4 font-semibold">Of those, risky</th>
                <th className="py-2 font-semibold">Score on unseen chemicals</th>
              </tr>
            </thead>
            <tbody>
              {ORGANS.map((o) => (
                <tr key={o} className="border-b border-stone-200">
                  <td className="py-2 pr-4">{ORGAN_LABEL[o]}</td>
                  <td className="py-2 pr-4">{train[o].training_rows.toLocaleString()}</td>
                  <td className="py-2 pr-4">{train[o].positives.toLocaleString()}</td>
                  <td className="py-2">{Math.round(train[o].test_auc * 100)} out of 100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Two Random Forest classifiers, 500 trees each, built with scikit-learn on 2,048-bit Morgan
          fingerprints from RDKit. In plain words: each drug&apos;s shape becomes a long row of yes/no
          answers, and 500 simple flowcharts vote on it. A score of 50 or more counts as flagged.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Nothing shown on this site was scored by a model that had seen that drug. Withdrawn drugs
          were removed from training outright; the rest were scored by a model trained without them.
        </p>
      </details>
    </div>
  );
}
