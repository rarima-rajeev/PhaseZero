"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Check a drug" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/results", label: "Results & decisions" },
];

/** A benzene ring that also reads as the zero in the name. */
function Mark() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className="h-7 w-7 shrink-0 text-accent sm:h-8 sm:w-8"
    >
      <polygon
        points="16,4 26.4,10 26.4,22 16,28 5.6,22 5.6,10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {[
        [16, 4],
        [26.4, 10],
        [26.4, 22],
        [16, 28],
        [5.6, 22],
        [5.6, 10],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.1" fill="currentColor" />
      ))}
    </svg>
  );
}

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-base">
      <Link href="/" className="mr-auto flex items-center gap-2.5">
        <Mark />
        <span className="font-display text-3xl leading-none tracking-tight sm:text-4xl">
          Phase Zero
        </span>
      </Link>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            path === l.href
              ? "border-b-2 border-accent pb-0.5 font-medium text-foreground"
              : "border-b-2 border-transparent pb-0.5 text-stone-500 hover:text-foreground"
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
