const features = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    title: "Natural Conversation",
    body: 'Ask complex questions like "Which regions had the highest churn last month?" and get instant answers.',
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    title: "Instant Visuals",
    body: "We don't just give you text; we generate beautifully curated charts and tables that are ready for your presentations.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Privacy First",
    body: "Your data never leaves your infrastructure. Kakaw AI only reads the schema to generate the logic, never the rows.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-surface-container-low py-24">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-16">
          <h2 className="font-headline text-4xl italic mb-4">
            Master your data without code
          </h2>
          <p className="text-on-surface-variant max-w-md">
            Our atelier provides the precision of a craftsman with the speed of
            an AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-surface-container-lowest p-10 rounded-2xl flex flex-col gap-6 group hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center text-primary">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-headline text-2xl italic mb-3">
                  {feature.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {feature.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
