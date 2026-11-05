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
            Phase Zero is a learning project built by an AI product manager, not a drug expert. It
            uses free public data and no patient records. It is not medical advice, and the scores
            can be wrong. Do not use it for clinical decisions.
          </footer>
        </div>
      </body>
    </html>
  );
}
