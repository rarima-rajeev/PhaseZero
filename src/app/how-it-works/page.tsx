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
    body: "A small model was trained — by code running on my Mac, not by any AI service — on about 11,000 chemicals that scientists had already tested in the lab. 400 decision trees were grown. Each tree is a flowchart of yes/no questions. It learned to tell the risky ones from the safe ones. Given a drug's structure, it gives a score out of 100. It's a hint to look closer, never a verdict.",
    sources:
      "Random Forest, run with the free scikit-learn toolkit, on RDKit Morgan fingerprints of each drug's structure. Learned from Therapeutics Data Commons — Harvard's public lab data.\n\nNot a vendor model — this one was trained from scratch for this project, on my own Mac.",
  },
  {
    tag: "Gemini AI",
    title: "The writer",
    body: "Google's Gemini AI turns those facts into a short, plain-English summary. It is handed the facts and nothing else, and it has to point to a source for every sentence. If it points to a source that does not exist, we throw the summary away.",
    sources: "Gemini Flash, run once ahead of time",
  },
];

const SOURCES = [
  {
    name: "ChEMBL",
    who: "EMBL-EBI",
    url: "https://www.ebi.ac.uk/chembl/",
    gave: "Which drugs were pulled from the market or carry official warnings, and why",
    licence: "CC BY-SA 3.0",
  },
  {
    name: "Therapeutics Data Commons",
    who: "Harvard",
    url: "https://tdcommons.ai/",
    gave: "The lab measurements both models learned from",
    licence: "CC BY 4.0",
  },
  {
    name: "PubChem",
    who: "US NIH",
    url: "https://pubchem.ncbi.nlm.nih.gov/",
    gave: "Chemical structures and drug information",
    licence: "Public domain",
  },
  {
    name: "openFDA",
    who: "US FDA",
    url: "https://open.fda.gov/",
    gave: "Drug label warnings",
    licence: "Public domain",
  },
  {
    name: "ClinicalTrials.gov",
    who: "US NIH",
    url: "https://clinicaltrials.gov/",
    gave: "Trials that were stopped early, and the stated reason",
    licence: "Public domain",
  },
];

const DECISIONS = [
  {
    q: "Why not an AI agent?",
    a: "An AI agent is like a chef who decides what to cook as they go. A pipeline is like a recipe — the same steps, in the same order, every time.\n\nEvery drug here asks the same question, so just a single recipe is all you need. It's cheaper, it's faster, and I can check it actually works. A chef is worth paying for when you don't know what's for dinner.",
  },
  {
    q: "Why work everything out ahead of time?",
    a: "It's like cooking everything the night before instead of cooking to order. The food is made once, then brought to where it's served.\n\nAll 500 drug cards were worked out once on my Mac, saved as plain files, and uploaded to cloud. So when you look a drug up, nothing is being worked out — it is simply handed to you. That makes the site instant, almost free to run, and the same for everyone.",
  },
  {
    q: "Why keep the AI away from the facts?",
    a: "An AI chatbot is a wonderful writer that can be confidently wrong. Ask it for a fact and it may hand you a very convincing one that isn't true.\n\nSo here it is never asked for a fact. The code finds the facts, the model does the scoring, and the AI is given the finished list and told: write this up, and point to where each piece came from. It writes. It doesn't decide.",
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
          { k: "Code", v: "finds the facts in four public databases" },
          { k: "ML model", v: "scores the risk" },
          { k: "Gemini AI", v: "writes it up" },
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
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-stone-500">{p.sources}</p>
          </section>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">Choices I made</h2>
      <dl className="mt-4 space-y-5">
        {DECISIONS.map((d) => (
          <div key={d.q}>
            <dt className="text-sm font-semibold">{d.q}</dt>
            <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-700">{d.a}</dd>
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

      <h2 className="mt-12 text-xl font-semibold tracking-tight">Where the data comes from</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">
        Everything here is free, public data. No patient records of any kind were used.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="py-2 pr-4 font-semibold">Source</th>
              <th className="py-2 pr-4 font-semibold">What it gave us</th>
              <th className="py-2 font-semibold">Licence</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((s) => (
              <tr key={s.name} className="border-b border-stone-200 align-top">
                <td className="py-2 pr-4">
                  <a href={s.url} target="_blank" rel="noreferrer" className="font-medium underline hover:text-stone-900">
                    {s.name}
                  </a>
                  <span className="block text-xs text-stone-500">{s.who}</span>
                </td>
                <td className="py-2 pr-4 text-stone-700">{s.gave}</td>
                <td className="py-2 whitespace-nowrap text-stone-700">{s.licence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-700">
        ChEMBL asks that work built on it be shared on the same terms, so the drug data this site
        produces is published under the same CC BY-SA 3.0 licence. The code is MIT.
      </p>

      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-stone-500">
        <span className="font-medium">Citations.</span> ChEMBL: Zdrazil B. et al.,{" "}
        <em>Nucleic Acids Research</em> 52(D1), 2024. Liver data: Xu Y. et al.,{" "}
        <em>J. Chem. Inf. Model.</em> 55(10), 2015. Heart data: Karim A. et al.,{" "}
        <em>J. Cheminform.</em> 13:60, 2021.
      </p>

      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-stone-500">
        openFDA&apos;s own note applies here too: this data has not been checked for clinical use, and
        no one should rely on it for medical decisions.
      </p>
    </div>
  );
}
