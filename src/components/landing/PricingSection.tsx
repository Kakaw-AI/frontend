import Link from "next/link"

const valuePoints = [
  "Always free",
  "Bring your own API key",
  "No locked core features",
]

const providers = ["Anthropic", "OpenAI", "Gemini", "Ollama", "LM Studio"]

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-32 bg-surface py-24 border-t border-outline-variant/15"
    >
      <div className="max-w-4xl mx-auto px-8">
        <div className="bg-surface-container-low rounded-[2rem] p-8 md:p-12 relative overflow-hidden border border-outline-variant/10 shadow-[0_24px_80px_-48px_rgba(120,82,55,0.35)]">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-l from-primary/8 to-transparent" />
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl -translate-y-1/3 translate-x-1/3" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)] lg:items-center">
            <div className="text-left">
              <span className="font-label text-xs uppercase tracking-[0.2em] text-primary font-bold">
                Simple pricing
              </span>

              <h2 className="font-headline text-4xl md:text-5xl italic mt-3 text-on-surface leading-tight">
                Free forever. Bring your own model.
              </h2>

              <p className="mt-5 max-w-2xl text-base md:text-lg text-on-surface-variant leading-relaxed">
                Kakaw keeps billing simple: connect your data, use your own
                key, and start asking questions right away.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {providers.map((provider) => (
                  <span
                    key={provider}
                    className="rounded-full border border-outline-variant/15 bg-white/60 px-4 py-2 text-sm text-on-surface-variant backdrop-blur"
                  >
                    {provider}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-surface-container-lowest p-6 md:p-8 text-left ring-1 ring-outline-variant/10">
              <p className="font-label text-xs uppercase tracking-[0.2em] text-primary font-bold">
                One simple plan
              </p>
              <div className="mt-4">
                <p className="font-headline text-5xl italic text-on-surface">
                  $0
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Bring your own provider and keep full control over how you run
                  each conversation.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {valuePoints.map((point) => (
                  <div key={point} className="flex items-center gap-3 text-sm text-on-surface">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      ✓
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/login"
                className="primary-gradient mt-8 inline-flex w-full items-center justify-center rounded-xl px-6 py-4 text-base font-bold text-on-primary shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
