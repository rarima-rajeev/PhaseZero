import Image from "next/image";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-14 text-xl font-semibold tracking-tight">{children}</h2>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-stone-300 bg-white p-4">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs leading-snug text-stone-500">{label}</div>
    </div>
  );
}

/** One test: the question it answers, and the number it produced. */
function Test({
  n,
  question,
  children,
}: {
  n: number;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-stone-200 pt-5">
      <h3 className="text-sm font-semibold">
        Test {n}: <span className="font-normal text-stone-700">{question}</span>
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function Results() {
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
      <h1 className="text-3xl font-semibold tracking-tight">
        Offline Evals: Results &amp; decisions
      </h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Three tests, and what I decided because of them.
      </p>

      <div className="mt-10 space-y-8">
        <Test n={1} question="evaluates the accuracy of the ML model — Random Forest.">
          <p className="text-sm text-stone-700">How accurate is this?</p>
          <div className="mt-3">
            <Stat value="63%" label="accurate" />
          </div>
        </Test>

        <Test
          n={2}
          question="was training a model even necessary — or could I have just asked Gemini AI?"
        >
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <Stat value="80%" label="accuracy of trained ML model" />
            <Stat value="69%" label="accuracy of Gemini AI" />
          </div>
        </Test>

        <Test n={3} question="would a fancier AI model beat my simple ML one?">
          <p className="text-sm text-stone-700">
            <span className="font-semibold">Answer: no.</span> On this exam, my simple model scored
            53%, the fine-tuned model 47%.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
            <Stat value="53%" label="my simple ML model" />
            <Stat value="47%" label="the fine-tuned model" />
          </div>
        </Test>
      </div>

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-stone-500">
        Ran real tests to arrive at the above numbers on all 3 tests.
        <br />
        Test 3 — the fancier AI model, ChemBERTa, is pre-trained on chemical structures.
      </p>

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
        <li>
          The written summaries are checked for invented sources, but their wording has not been
          evaluated.
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

    </div>
  );
}
