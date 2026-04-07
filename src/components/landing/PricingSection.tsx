import Link from "next/link"

const benefits = [
  {
    title: "BYOK",
    body: "Use your own API key from any supported provider",
  },
  {
    title: "All Features",
    body: "No feature gates or paywalls — ever",
  },
  {
    title: "Any Model",
    body: "Claude, GPT-4o, Gemini, Llama, and more",
  },
  {
    title: "Privacy First",
    body: "Your data never touches our servers",
  },
]

const providers = ["Anthropic", "OpenAI", "Gemini", "Ollama", "LM Studio"]

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-surface py-24 border-t border-outline-variant/15"
    >
      <div className="max-w-2xl mx-auto px-8 text-center">
        <div className="bg-surface-container-low rounded-3xl p-12 md:p-16 relative overflow-hidden">
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-primary font-bold">
              Pricing
            </span>

            <h2 className="font-headline text-4xl md:text-5xl italic mt-3 mb-10">
              One plan. Always Free.
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="bg-surface-container-lowest rounded-xl p-4"
                >
                  <div className="font-label text-xs uppercase tracking-widest font-bold text-primary mb-1">
                    ✓ {b.title}
                  </div>
                  <p className="text-on-surface-variant text-sm">{b.body}</p>
                </div>
              ))}
            </div>

            <p className="text-on-surface-variant text-sm mb-8">
              Works with{" "}
              {providers.map((p, i) => (
                <span key={p}>
                  <span className="text-on-surface font-medium">{p}</span>
                  {i < providers.length - 1 && (
                    <span className="text-outline-variant"> · </span>
                  )}
                </span>
              ))}
            </p>

            <Link
              href="/login"
              className="primary-gradient text-on-primary px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all inline-block"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
