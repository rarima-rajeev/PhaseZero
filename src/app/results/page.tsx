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
const exp = (results as Record<string, unknown>).experiment as null | {
  model: string;
  liver?: ExpOrgan;
  heart?: ExpOrgan;
};

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
  return <h2 className="mt-12 text-xl font-semibold tracking-tight">{children}</h2>;
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
        What the model actually got right and wrong, in numbers — including the misses.
      </p>

      <H>Test 1: would it have caught drugs that were later pulled?</H>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">
        Some drugs reached the market and were later pulled off it because they harmed people&apos;s
        livers or hearts. I removed every one of those drugs from the training data, so the model had
        never seen them, then asked it to score them. A score of 50 or more counts as &ldquo;flagged&rdquo;.
      </p>

      <div className="mt-5 space-y-6">
        {ORGANS.map((o) => {
          const b = back[o];
          return (
            <div key={o}>
              <h3 className="text-sm font-semibold">{ORGAN_LABEL[o]} harm</h3>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat
                  value={`${b.caught} of ${b.withdrawn}`}
                  label={`pulled-from-market drugs that the model flagged (${pct(b.caught / b.withdrawn)})`}
                />
                <Stat
                  value={`${b.withdrawn - b.caught}`}
                  label="it missed — these are listed below"
                />
                <Stat
                  value={`${b.clean_flagged} of ${b.clean_drugs}`}
                  label="drugs with no known warnings that it flagged anyway (false alarms)"
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-700">
        Read this honestly: the model catches a good share of the real problems, but it also raises a
        lot of false alarms, especially for the liver. That is the trade-off it was tuned for. In
        early research, a cheap warning that sends someone to look again costs far less than missing
        a drug that harms people. It would be the wrong trade-off for any decision about a patient.
      </p>

      <details className="mt-5 rounded-lg border border-stone-300 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium">
          The {missed.length} drugs it missed
        </summary>
        <ul className="mt-3 grid gap-1 text-sm text-stone-600 sm:grid-cols-2">
          {missed.map((m) => (
            <li key={`${m.organ}-${m.id}`}>
              {m.name} — {ORGAN_LABEL[m.organ as OrganKey].toLowerCase()}, scored{" "}
              {Math.round(m.score * 100)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Why it misses: the model only looks at a drug&apos;s chemical shape, and it was taught one
          specific kind of harm per organ. Rofecoxib is the clearest example. It was pulled off the
          market worldwide in 2004 for heart harm, and our heart model scores it 13 out of 100 — because
          it was trained on drugs that upset the heart&apos;s rhythm, and rofecoxib damaged hearts a
          completely different way. Paracetamol is the other classic: safe at the normal dose, damaging
          to the liver at a high one, and nothing in its shape says so.
        </p>
      </details>

      <H>Test 2: train a small model, or just ask an AI chatbot?</H>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">
        This is the question I actually wanted to answer, because it comes up on every AI project.
        Both got the exact same chemicals that neither had seen before, and the same question. The
        trained model was built on a laptop in minutes.
      </p>

      {exp ? (
        <div className="mt-5 space-y-6">
          {ORGANS.filter((o) => exp[o]).map((o) => {
            const e = exp[o]!;
            return (
              <div key={o}>
                <h3 className="text-sm font-semibold">
                  {ORGAN_LABEL[o]} harm — {e.n} chemicals
                </h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[26rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
                        <th className="py-2 pr-4 font-semibold">&nbsp;</th>
                        <th className="py-2 pr-4 font-semibold">My trained model</th>
                        <th className="py-2 font-semibold">Asking Gemini directly</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-stone-200">
                        <td className="py-2 pr-4">
                          How well it sorts risky from safe
                          <span className="block text-xs text-stone-500">
                            100 = perfect, 50 = coin flip
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-medium">{Math.round(e.ml_auc * 100)}</td>
                        <td className="py-2 font-medium">{Math.round(e.gemini_auc * 100)}</td>
                      </tr>
                      <tr className="border-b border-stone-200">
                        <td className="py-2 pr-4">Right answers</td>
                        <td className="py-2 pr-4">{pct(e.ml_accuracy)}</td>
                        <td className="py-2">{pct(e.gemini_accuracy)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">
                          Same answer when asked twice
                          <span className="block text-xs text-stone-500">
                            {e.repeat_n} chemicals asked again
                          </span>
                        </td>
                        <td className="py-2 pr-4">Always</td>
                        <td className="py-2">
                          {e.gemini_same_flag_on_repeat} of {e.repeat_n}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-stone-500">Chatbot tested: {exp.model}.</p>

          <div className="rounded-xl border border-stone-300 bg-white p-5">
            <h3 className="font-semibold">They won one each — and that is the useful part</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-700">
              I expected one of them to win. Instead the answer flipped depending on how much data I
              had. For the liver, where I only had a few hundred examples to train on, the chatbot
              beat my model clearly. For the heart, where I had about eleven thousand, my model beat
              the chatbot by a wide margin.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">
              That is a rule I can actually use on a real product:{" "}
              <span className="font-medium">
                prompt a chatbot while your data is thin, and train your own model once the data
                arrives.
              </span>{" "}
              Had I only tested the liver, I would have concluded &ldquo;just use the chatbot&rdquo;
              and been wrong. Had I only tested the heart, I would have concluded the opposite and
              been equally wrong.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">
              <span className="font-medium">One honest caveat I cannot rule out.</span> These are
              real, approved drugs. The chatbot has almost certainly read about them before, so on
              the liver test it may be remembering rather than working anything out. My model has
              no such advantage — I removed every drug it would be tested on. If I were shipping
              this, my next step would be to re-run the comparison on chemicals that are too new or
              too obscure for any chatbot to have read about. Until then, I would treat the
              chatbot&apos;s liver win as promising, not proven.
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-600">
          Numbers coming — this test is still running.
        </p>
      )}

      {cost && (
        <>
          <H>What the whole thing cost to run</H>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">
            All the AI work happens once, on a laptop, before anyone visits. That is the entire bill
            for the project — not a monthly bill, and not a bill that grows with visitors.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat
              value={`₹${cost.cards.inr}`}
              label={`writing the 500 plain-English summaries (${cost.cards.calls} calls)`}
            />
            <Stat
              value={`₹${cost.experiment.inr}`}
              label={`running the chatbot comparison above (${cost.experiment.calls} calls)`}
            />
            <Stat value="₹0" label="cost per visitor, because nothing is computed live" />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            ₹{cost.total_inr} in total. Training the two models cost nothing but a few minutes of
            laptop time.
          </p>
        </>
      )}

      <H>How the models were trained</H>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="py-2 pr-4 font-semibold">Model</th>
              <th className="py-2 pr-4 font-semibold">Examples it learned from</th>
              <th className="py-2 pr-4 font-semibold">Of those, risky</th>
              <th className="py-2 font-semibold">Score on unseen chemicals</th>
            </tr>
          </thead>
          <tbody>
            {ORGANS.map((o) => (
              <tr key={o} className="border-b border-stone-200">
                <td className="py-2 pr-4">{ORGAN_LABEL[o]} harm</td>
                <td className="py-2 pr-4">{train[o].training_rows.toLocaleString()}</td>
                <td className="py-2 pr-4">{train[o].positives.toLocaleString()}</td>
                <td className="py-2">{Math.round(train[o].test_auc * 100)} out of 100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-stone-500">
        A random forest on 2,048-bit Morgan fingerprints, built with scikit-learn and RDKit. In plain
        words: each drug&apos;s shape is turned into a long row of yes/no answers, and a few hundred
        simple decision trees vote on it. The liver model learned from far fewer examples than the
        heart one, which is exactly why it is the weaker of the two.
      </p>

      <H>What I took away from this</H>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700">
        <li>
          <span className="font-semibold">
            &ldquo;Train a model or prompt a chatbot?&rdquo; has no fixed answer.
          </span>{" "}
          It depends on how much data you have, and the only way to know is to test both. That test
          cost me ₹77 and an afternoon, which is nothing next to picking wrong and finding out in six
          months.
        </li>
        <li>
          <span className="font-semibold">Check whether your test is really a test.</span> The
          chatbot has probably read about every drug I tested it on, so part of its score may be
          memory rather than skill. A number you cannot explain is not yet a result.
        </li>
        <li>
          <span className="font-semibold">A fixed pipeline, not an agent — on purpose.</span> Every
          drug goes through the same three steps, so I can test the whole thing and nothing surprises
          me in production. I would reach for an agent when the steps genuinely differ each time.
        </li>
        <li>
          <span className="font-semibold">The AI writes, it does not decide.</span> Gemini never sees
          a question it could answer from memory. It gets the facts and has to cite them, and a
          summary citing a source that does not exist is thrown away automatically.
        </li>
        <li>
          <span className="font-semibold">Work it out ahead of time where you can.</span> All 500
          cards are built once, offline. The live site runs no AI at all, which makes it fast, free
          to serve, and identical for everyone.
        </li>
      </ul>

      <H>What this cannot do</H>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
        <li>It is a signal to look closer, not an answer. It gets things wrong in both directions.</li>
        <li>
          It covers 500 well-known drugs and two kinds of harm. Drugs fail for many other reasons —
          most often, they simply do not work.
        </li>
        <li>
          It only reads a drug&apos;s chemical shape. Dose, how the body processes the drug, and who
          is taking it matter enormously and are not in here.
        </li>
        <li>
          Very few drugs are ever pulled from the market, so Test 1 rests on a small number of
          examples.
        </li>
        <li>
          No patient data of any kind was used. Everything here comes from free public databases.
        </li>
        <li>
          I am an AI product manager, not a drug expert. This project is about how I build, measure
          and make calls on an AI system — a real scientist would judge the chemistry far better than
          I can.
        </li>
      </ul>
      <p className="mt-4 text-sm font-medium">
        Decision support for researchers. Not medical advice.
      </p>

      <H>What I would build next</H>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
        <li>More kinds of harm — kidney and blood are the obvious ones to add.</li>
        <li>
          Let a researcher paste in a brand-new chemical that has never been approved, which is the
          case where this would really earn its keep.
        </li>
        <li>
          Show how confident the model is, not just the score, so a 51 does not read like a 95.
        </li>
      </ul>
    </div>
  );
}
