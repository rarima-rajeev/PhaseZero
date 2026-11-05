import Image from "next/image";
import DrugSearch from "@/components/DrugSearch";

export default function Home() {
  return (
    <div>
      <section className="relative -mx-5 overflow-hidden rounded-none sm:-mx-6 sm:rounded-2xl">
        <Image
          src="/img/hero.webp"
          alt=""
          width={1376}
          height={768}
          priority
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        {/* Keeps the headline readable wherever the illustration happens to be busy, while
            letting the molecule art actually show on the right.
            Narrow screens get a flat wash too, since there is no empty side to put text on. */}
        <div className="absolute inset-0 bg-[#fbfaf7]/65 sm:bg-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fbfaf7] via-[#fbfaf7]/75 to-transparent" />
        <div className="relative px-5 py-16 sm:px-8 sm:py-24">
          <h1 className="max-w-xl font-display text-[2rem] leading-[1.1] tracking-tight sm:text-6xl">
            A trial before the trial.
          </h1>
          <div className="mt-5 h-0.5 w-14 bg-accent" />
          <p className="mt-5 max-w-md text-lg text-stone-600">
            Spot warning signs before the big money, $1B, is spent.
          </p>
        </div>
      </section>

      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-stone-700">
        Most new medicines fail, often late, after years of work. Two of the most common reasons are
        harm to the liver and harm to the heart. Type a well-known drug below to see its warning
        signs — each one with a link to where it came from.
      </p>

      <div className="mt-8">
        <DrugSearch />
      </div>
    </div>
  );
}
