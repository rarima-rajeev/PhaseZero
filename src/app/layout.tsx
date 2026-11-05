import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Analytics from "@/components/Analytics";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// Display face, used only for the wordmark and the home headline.
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

// Same three links, same order, as the sibling portfolio projects. Deliberately
// labelled rather than named: the name is reachable by clicking, not printed here.
const PROFILE_LINKS = [
  { label: "Portfolio", href: "https://rarima-rajeev.my.canva.site/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/rarima-rajeev" },
  { label: "GitHub", href: "https://github.com/rarima-rajeev" },
];

export const metadata: Metadata = {
  title: "Phase Zero — A trial before the trial",
  description: "Spot warning signs before the big money, $1B, is spent.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${display.variable} font-sans antialiased`}>
        <Analytics />
        <div className="mx-auto max-w-3xl px-5 py-7 sm:px-6">
          <Header />
          <main className="py-10">{children}</main>
          <footer className="border-t border-stone-200 pt-6 text-xs leading-relaxed text-stone-500">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {PROFILE_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-stone-600 underline underline-offset-2 hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <p className="mt-4">
              Phase Zero is an independent project. It uses free public data and no patient records.
              It is not medical advice, and the scores can be wrong. Do not use it for clinical
              decisions.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
