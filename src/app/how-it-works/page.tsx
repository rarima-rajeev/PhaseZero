const PARTS = [
  {
    tag: "Code",
    title: "The fact finder",
    body: "Plain computer code looks up facts in free public databases: what the drug is, what its official label warns about, and which clinical trials were stopped early. Same question in, same facts out, every single time.",
    sources: "PubChem · openFDA · ClinicalTrials.gov · ChEMBL",
  },
  {
    tag: "Machine learning",
    title: "The pattern spotter",
    body: "I trained a small model on thousands of chemicals that scientists had already tested in the lab. It learned what the risky ones tend to look like. Given a new drug's structure, it gives a score out of 100. It is a hint to look closer, never a verdict.",
    sources: "Trained on public lab data (Therapeutics Data Commons)",
  },
  {
    tag: "Gemini",
    title: "The writer",
    body: "Google's Gemini turns those facts into a short, plain-English summary. It is handed the facts and nothing else, and it has to point to a source for every sentence. If it points to a source that does not exist, we throw the summary away.",
    sources: "Gemini Flash, run once ahead of time",
  },
];

const DECISIONS = [
  {
    q: "Why not an AI agent?",
    a: "An agent decides its own next step. Here the steps never change: look up the drug, score it, write it up. A fixed set of steps is cheaper, faster, and far easier to test. Agents earn their keep when the path is different every time.",
  },
  {
    q: "Why work everything out ahead of time?",
    a: "All 500 drug cards are built once on my laptop and saved as plain files. So the website needs no AI and no server to answer a visitor, costs almost nothing to run, and shows the same answer to everyone.",
  },
  {
    q: "Why keep the AI away from the facts?",
    a: "Chatbots are good with words and can be confidently wrong about facts. So the model does the scoring, code does the fact-finding, and the AI only does the writing — on a short leash, with sources.",
  },
];

import Image from "next/image";

export default function HowItWorks() {
  return (
    <div>
      <Image
        src="/img/pipeline.webp"
        alt="Three shapes in a row joined by a line: a grid, a branching cluster of dots, and an open book."
        width={1200}
        height={655}
        priority
        // The illustration sits in a band across the middle, so crop to that rather than
        // showing a tall box of empty background.
        className="mb-8 h-28 w-full rounded-xl border border-stone-200 object-cover object-center sm:h-36"
      />
      <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Three different tools do the work here. Each one is given the job it is actually good at.
      </p>

      <ol className="mt-8 grid gap-3 sm:grid-cols-5 sm:items-stretch">
        {[
          { k: "You type", v: "a drug name" },
          { k: "Code", v: "finds the facts" },
          { k: "ML model", v: "scores the risk" },
          { k: "Gemini", v: "writes it up" },
          { k: "You see", v: "one risk card" },
        ].map((s, i) => (
          <li
            key={s.k}
            className={`rounded-lg border p-3 text-center text-sm ${
              i === 0 || i === 4
                ? "border-stone-300 bg-stone-100 text-stone-600"
                : "border-stone-300 bg-white"
            }`}
          >
            <div className="font-semibold">{s.k}</div>
            <div className="text-xs text-stone-500">{s.v}</div>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-stone-500">
        The steps always run in this order, and they never change.
      </p>

      <div className="mt-10 space-y-5">
        {PARTS.map((p) => (
          <section key={p.tag} className="rounded-xl border border-stone-300 bg-white p-5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="rounded bg-stone-900 px-2 py-0.5 text-xs font-medium text-white">
                {p.tag}
              </span>
              <h2 className="font-semibold">{p.title}</h2>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-700">{p.body}</p>
            <p className="mt-2 text-xs text-stone-500">{p.sources}</p>
          </section>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">Choices I made</h2>
      <dl className="mt-4 space-y-5">
        {DECISIONS.map((d) => (
          <div key={d.q}>
            <dt className="text-sm font-semibold">{d.q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-stone-700">{d.a}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 text-sm text-stone-600">
        The numbers behind all of this — including a test of whether the model would have caught
        drugs that were later pulled from the market — are on{" "}
        <a href="/results" className="underline hover:text-stone-900">
          Results &amp; decisions
        </a>
        .
      </p>
    </div>
  );
}
