"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Card, IndexEntry } from "@/lib/types";
import { track } from "@/lib/analytics";
import RiskCard from "./RiskCard";

const EXAMPLES = ["Terfenadine", "Rosiglitazone", "Acetaminophen", "Rofecoxib"];

function matches(list: IndexEntry[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const scored = list
    .map((d) => {
      const names = [d.name.toLowerCase(), ...d.names];
      if (names.some((n) => n === s)) return { d, rank: 0 };
      if (names.some((n) => n.startsWith(s))) return { d, rank: 1 };
      if (names.some((n) => n.includes(s))) return { d, rank: 2 };
      return null;
    })
    .filter((x): x is { d: IndexEntry; rank: number } => x !== null);
  scored.sort((a, b) => a.rank - b.rank || a.d.name.localeCompare(b.d.name));
  return scored.map((x) => x.d).slice(0, 8);
}

export default function DrugSearch() {
  const [list, setList] = useState<IndexEntry[]>([]);
  const [q, setQ] = useState("");
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/index.json")
      .then((r) => r.json())
      .then(setList)
      .catch(() => setList([]));
  }, []);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const hits = useMemo(() => matches(list, q), [list, q]);

  async function show(d: IndexEntry) {
    setOpen(false);
    setQ(d.name);
    setLoading(true);
    track("drug_checked", { drug: d.name });
    try {
      const r = await fetch(`/data/drugs/${d.id}.json`);
      setCard(await r.json());
    } finally {
      setLoading(false);
    }
  }

  const exact = hits[0];
  const noMatch = q.trim().length > 1 && list.length > 0 && hits.length === 0;

  return (
    <div>
      <div ref={box} className="relative">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && exact) show(exact);
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder='Try "terfenadine" or "rosiglitazone"'
            aria-label="Drug name"
            className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none placeholder:text-stone-400 focus:border-stone-500"
          />
          <button
            onClick={() => exact && show(exact)}
            disabled={!exact}
            className="shrink-0 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white disabled:bg-stone-300"
          >
            Check
          </button>
        </div>

        {open && hits.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-stone-300 bg-white shadow-lg">
            {hits.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => show(d)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-stone-100"
                >
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-2 text-xs text-stone-500">
        {list.length > 0
          ? `Works for ${list.length} well-known drugs. Not medical advice.`
          : "Loading the drug list…"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-stone-500">Try:</span>
        {EXAMPLES.map((name) => {
          const d = list.find((x) => x.name.toLowerCase() === name.toLowerCase());
          return (
            <button
              key={name}
              onClick={() => d && show(d)}
              disabled={!d}
              className="rounded-full border border-stone-300 px-2.5 py-1 hover:bg-white disabled:opacity-40"
            >
              {name}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {loading && <p className="text-sm text-stone-500">Loading…</p>}
        {!loading && noMatch && (
          <p className="text-sm text-stone-600">
            We don&apos;t have that drug yet. Try another one — or pick an example above.
          </p>
        )}
        {!loading && card && <RiskCard card={card} />}
      </div>
    </div>
  );
}
