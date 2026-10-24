import type { Source } from "@/lib/types";

/** A small clickable [3] that links to the source it refers to. */
export default function Cite({ n, sources }: { n: number | null | undefined; sources: Source[] }) {
  if (!n || !sources[n - 1]) return null;
  const s = sources[n - 1];
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer"
      title={s.label}
      className="ml-1 align-super text-[0.65rem] font-medium text-stone-500 underline decoration-dotted hover:text-stone-900"
    >
      [{n}]
    </a>
  );
}
