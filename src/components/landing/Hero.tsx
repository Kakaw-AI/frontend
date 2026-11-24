import Link from "next/link";
import { FadeUp } from "@/components/amicro/fade-up";
import { BlurText } from "@/components/amicro/blur-text";
import { Magnetic } from "@/components/amicro/magnetic-button";
import { TiltCard } from "@/components/amicro/tilt-card";

const BARS = [
  { label: "Home Decor", value: 22, width: 205 },
  { label: "Kitchen", value: 14, width: 130 },
  { label: "Garden", value: 9, width: 84 },
  { label: "Toys", value: 4, width: 38 },
];

export function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-12 md:py-20 grid lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7 space-y-8">
        <FadeUp className="space-y-5">
          <span className="block font-mono text-xs tracking-[0.1em] text-on-surface-variant font-semibold uppercase">
            No SQL needed
          </span>
          {/* One phrase per line so the highlight never splits mid-phrase */}
          <h1 className="font-headline text-4xl sm:text-5xl xl:text-6xl text-on-surface leading-[1.15]">
            <BlurText text="Ask your database." className="block" />
            <span className="pod-mark mt-2 inline-block">Get the answer.</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.15}>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-xl leading-relaxed">
            Type a question about your PostgreSQL, MongoDB or SQLite database in plain
            words. Kakaw writes the SQL, runs it read-only, and shows you the
            result as a table or a chart.
          </p>
        </FadeUp>

        <FadeUp delay={0.3} className="flex flex-wrap gap-4 pt-4">
          <Magnetic>
            <Link href="/login" className="pod-btn px-8 py-4 text-base">
              Connect a database
            </Link>
          </Magnetic>
          <Link
            href="#how-it-works"
            className="pod-btn-ghost px-8 py-4 text-base"
          >
            See how it works
          </Link>
        </FadeUp>
      </div>

      {/* A sample question and its answer, in place of a product screenshot */}
      <FadeUp delay={0.2} yOffset={30} className="lg:col-span-5">
        <TiltCard className="pod-card rounded-lg p-6 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-on-surface-variant">
            You asked
          </p>
          <p className="font-bold text-on-surface mb-4">
            Which categories grew most in Q4?
          </p>
          <svg
            viewBox="0 0 330 124"
            role="img"
            aria-label="Bar chart of Q4 growth: Home Decor 22%, Kitchen 14%, Garden 9%, Toys 4%"
            className="w-full font-mono text-[11px]"
          >
            {BARS.map((bar, i) => (
              <g key={bar.label}>
                <text x="0" y={i * 32 + 17} className="fill-on-surface-variant">
                  {bar.label}
                </text>
                <rect
                  x="92"
                  y={i * 32 + 2}
                  width={bar.width}
                  height="22"
                  rx="3"

                  className={i === 0 ? "fill-chart-2" : "fill-chart-1"}
                />
                <text
                  x={92 + bar.width + 6}
                  y={i * 32 + 17}
                  className="fill-on-surface-variant"
                >
                  {bar.value}%
                </text>
              </g>
            ))}
          </svg>
          <p className="mt-3 text-sm text-on-surface-variant">
            Home Decor led with 22% growth over Q3.
          </p>
        </TiltCard>
      </FadeUp>
    </section>
  );
}
