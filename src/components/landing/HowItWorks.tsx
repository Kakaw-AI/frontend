import { ScrollReveal } from "@/components/amicro/scroll-reveal";
const steps = [
  {
    number: "01",
    title: "Connect Your Source",
    body: "Paste a PostgreSQL or MongoDB connection URL, or upload a SQLite file. Connection strings are stored encrypted.",
  },
  {
    number: "02",
    title: "AI Schema Mapping",
    body: "Kakaw reads your tables or collections, their columns or fields and a few sample values, so you can use your own words.",
  },
  {
    number: "03",
    title: "Start the Dialogue",
    body: "Type any question in plain English. No need to remember table or field names.",
  },
  {
    number: "04",
    title: "Iterate and Refine",
    body: "Ask follow-up questions to drill down deeper into the numbers. Every answer shows its table, a chart and the query behind it.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-32 py-24 max-w-7xl mx-auto px-8"
    >
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        {/* Left panel: sticky beside the steps on wide screens, a plain heading above them on phones */}
        <div className="lg:sticky lg:top-32">
          <h2 className="font-headline text-4xl sm:text-5xl mb-6 leading-tight">
            From Database to
            <br />
            Insight in 4 Steps
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step) => (
            <ScrollReveal key={step.number} xOffset={24} yOffset={0} scale={1}>
              <div className="flex gap-6 border-t border-border pt-6">
                <span className="w-10 shrink-0 font-mono text-sm font-medium text-on-surface-variant">
                  {step.number}
                </span>
                <div>
                  <h4 className="font-headline text-2xl mb-2">{step.title}</h4>
                  <p className="text-on-surface-variant leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
