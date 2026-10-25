import type { Band, Card } from "@/lib/types";
import Cite from "./Cite";

const BAND_STYLE: Record<Band, string> = {
  High: "bg-red-50 text-red-900 ring-red-200",
  Medium: "bg-amber-50 text-amber-900 ring-amber-200",
  Low: "bg-emerald-50 text-emerald-900 ring-emerald-200",
};

const EXPLAIN = {
  liver: {
    title: "Liver warning",
    help: "How much this drug looks like drugs that have harmed people's livers.",
  },
  heart: {
    title: "Heart warning",
    help: "How much this drug looks like drugs that upset the heart's rhythm (by blocking a channel called hERG).",
  },
} as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-stone-200 px-5 py-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
      {children}
    </section>
  );
}

function ScoreBox({ which, card }: { which: "liver" | "heart"; card: Card }) {
  const s = card.scores[which];
  const e = EXPLAIN[which];
  return (
    <div className="flex-1 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium">{e.title}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${BAND_STYLE[s.band]}`}>
          {s.band}
        </span>
      </div>
      <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-stone-700" style={{ width: `${s.score}%` }} />
      </div>
      <p className="text-xs text-stone-500">
        Model score {s.score} out of 100. {e.help}
      </p>
    </div>
  );
}

export default function RiskCard({ card }: { card: Card }) {
  const src = card.sources;
  return (
    <article className="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm">
      <header className="flex flex-wrap items-baseline gap-x-3 px-5 pt-5">
        <h2 className="text-xl font-semibold tracking-tight">{card.name}</h2>
        {card.info && (
          <a
            href={src[card.info - 1].url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-stone-500 underline hover:text-stone-900"
          >
            What is this drug?
          </a>
        )}
      </header>

      <div className="flex flex-col sm:flex-row sm:divide-x sm:divide-stone-200">
        <ScoreBox which="liver" card={card} />
        <ScoreBox which="heart" card={card} />
      </div>
      <p className="px-5 pb-4 text-xs leading-relaxed text-stone-500">
        Both scores come from a small model we trained on public lab data. They are a hint to look
        closer, not a test result. Each score covers one specific kind of harm — a drug can be hard
        on the heart in some other way and still score low here.
      </p>

      {card.own_problems.length > 0 && (
        <Section title="Already on the record">
          <ul className="space-y-1.5 text-sm">
            {card.own_problems.map((p) => (
              <li key={p.text}>
                {p.text}
                <Cite n={p.source} sources={src} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {card.similar.length > 0 && (
        <Section title="Similar drugs that ran into trouble">
          <ul className="space-y-2.5 text-sm">
            {card.similar.map((s) => (
              <li key={s.name}>
                <span className="font-medium">{s.name}</span>
                <span className="text-stone-500"> — {s.similarity}% similar in structure</span>
                <Cite n={s.source} sources={src} />
                {s.problems.length > 0 && (
                  <div className="text-stone-600">{s.problems.join(". ")}</div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {card.fda.length > 0 && (
        <Section title="What the FDA label says">
          <ul className="space-y-2.5 text-sm">
            {card.fda.map((f) => (
              <li key={f.kind}>
                <span className="font-medium">{f.kind}</span>
                <Cite n={f.source} sources={src} />
                <div className="text-stone-600">{f.text}</div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {card.trials && (
        <Section title="Clinical trials that were stopped early">
          <p className="text-sm">
            {card.trials.total} trial{card.trials.total === 1 ? "" : "s"} involving this drug were
            stopped before finishing.
            <Cite n={card.trials.search} sources={src} />
            {card.trials.examples.length > 0 && " Reasons given by the people running them:"}
          </p>
          {card.trials.examples.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-sm text-stone-600">
              {card.trials.examples.map((e) => (
                <li key={e.title}>
                  “{e.why}”
                  <Cite n={e.source} sources={src} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-stone-500">
            Trials stop for many reasons — not enough volunteers, no money, or the drug not working.
            Only some stop because of safety.
          </p>
        </Section>
      )}

      {card.summary && (
        <Section title="In plain words">
          <p className="whitespace-pre-line text-sm leading-relaxed">{card.summary}</p>
          <p className="mt-2 text-xs text-stone-500">
            Written by Gemini AI using only the facts above. The numbers in brackets are its
            sources.
          </p>
        </Section>
      )}

      <Section title="Sources">
        <ol className="space-y-1 text-xs text-stone-600">
          {src.map((s, i) => (
            <li key={s.url}>
              <span className="text-stone-400">[{i + 1}]</span>{" "}
              <a href={s.url} target="_blank" rel="noreferrer" className="underline hover:text-stone-900">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </Section>
    </article>
  );
}
