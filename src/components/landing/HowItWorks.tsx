import { ScrollReveal } from "@/components/amicro/scroll-reveal";
const steps = [
  {
    number: "01",
    title: "Connect Your Source",
    body: "Paste a PostgreSQL connection URL or upload a SQLite file. Your credentials are stored encrypted.",
  },
  {
    number: "02",
    title: "AI Schema Mapping",
    body: "Kakaw automatically learns your table relationships and business logic, indexing it for human language.",
  },
  {
    number: "03",
    title: "Start the Dialogue",
    body: "Type any question in plain English. No need to remember table names or join conditions.",
  },
  {
    number: "04",
    title: "Iterate and Refine",
    body: "Ask follow-up questions to drill down deeper into the numbers. Every answer shows its table, a chart and the SQL behind it.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-32 py-24 max-w-7xl mx-auto px-8"
    >
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        {/* Sticky left panel */}
        <div className="sticky top-32">
          <h2 className="font-headline text-5xl mb-6 leading-tight">
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
