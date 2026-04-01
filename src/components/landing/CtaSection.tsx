import Link from "next/link";

export function CtaSection() {
  return (
    <section
      id="pricing"
      className="bg-surface py-24 border-t border-outline-variant/15"
    >
      <div className="max-w-4xl mx-auto px-8 text-center">
        <div className="bg-surface-container-low rounded-3xl p-12 md:p-20 relative overflow-hidden">
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="font-headline text-4xl md:text-5xl italic mb-8">
              Ready to finally understand your data?
            </h2>
            <p className="text-on-surface-variant text-lg mb-12 max-w-xl mx-auto">
              Join 500+ teams who have stopped waiting for data requests and
              started getting answers instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="primary-gradient text-on-primary px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                Start Talking to Your Data
              </Link>
              <button className="bg-surface-container-lowest text-on-surface px-10 py-4 rounded-xl font-bold text-lg border border-outline-variant/15 hover:bg-surface-bright transition-all">
                View Pricing
              </button>
            </div>

            <p className="mt-8 text-on-surface-variant text-sm italic">
              Free 14-day trial. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
