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
        <div className="bg-surface-container rounded-xl p-8 md:p-12 border border-border">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)] lg:items-center">
            <div className="text-left">
              <span className="font-label text-xs uppercase tracking-[0.2em] text-primary font-bold">
                Simple pricing
              </span>

              <h2 className="font-headline text-4xl md:text-5xl mt-3 text-on-surface leading-tight">
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
                    className="rounded-full border border-border bg-surface-container-lowest px-4 py-2 font-mono text-xs text-on-surface-variant"
                  >
                    {provider}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-surface-container-lowest p-6 md:p-8 text-left border border-border">
              <p className="font-label text-xs uppercase tracking-[0.2em] text-primary font-bold">
                One simple plan
              </p>
              <div className="mt-4">
                <p className="font-headline text-5xl text-on-surface">
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
                className="pod-btn mt-8 w-full py-4 text-base"
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
