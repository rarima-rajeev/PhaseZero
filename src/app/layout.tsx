import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Analytics from "@/components/Analytics";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Phase Zero — A trial before the trial",
  description: "Spot warning signs before the big money, $1B, is spent.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <Analytics />
        <div className="mx-auto max-w-3xl px-5 py-7 sm:px-6">
          <Nav />
          <main className="py-10">{children}</main>
          <footer className="border-t border-stone-200 pt-6 text-xs leading-relaxed text-stone-500">
            Phase Zero is a learning project built by an AI product manager, not a drug expert. It
            uses free public data. It is not medical advice, and the scores can be wrong.
          </footer>
        </div>
      </body>
    </html>
  );
}
