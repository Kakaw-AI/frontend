const steps = [
  {
    number: "01",
    title: "Connect Your Source",
    body: "Link your Postgres, MySQL, or Snowflake database in seconds with secure, encrypted tunneling.",
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
    body: "Ask follow-up questions to drill down deeper into the numbers. Save your best insights to a dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-8">
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        {/* Sticky left panel */}
        <div className="sticky top-32">
          <h2 className="font-headline text-5xl italic mb-6 leading-tight">
            From Database to
            <br />
            Insight in 4 Steps
          </h2>
          <div className="space-y-4 max-w-sm">
            <div className="p-6 insight-accent bg-surface-container-lowest">
              <p className="font-headline italic text-xl">
                &ldquo;It&rsquo;s like having a senior data analyst sitting right next to
                you at the desk.&rdquo;
              </p>
              <span className="block mt-4 font-label text-[10px] uppercase tracking-widest font-bold opacity-60">
                — Alex Rivers, Product Head
              </span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-8 group">
              <span className="font-headline text-6xl text-outline-variant/30 group-hover:text-primary/30 transition-colors select-none">
                {step.number}
              </span>
              <div>
                <h4 className="font-headline text-2xl italic mb-2">
                  {step.title}
                </h4>
                <p className="text-on-surface-variant leading-relaxed">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
