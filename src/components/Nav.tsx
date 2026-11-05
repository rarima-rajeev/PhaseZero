"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Check a drug" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/results", label: "Results & decisions" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base">
      <Link href="/" className="mr-auto text-lg font-semibold tracking-tight">
        Phase Zero
      </Link>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            path === l.href ? "font-medium text-foreground" : "text-stone-500 hover:text-foreground"
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
