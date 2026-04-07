import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-8 py-20 grid lg:grid-cols-12 gap-12 items-center min-h-[819px]">
      {/* Left column */}
      <div className="lg:col-span-7 space-y-8">
        <div className="space-y-4">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-primary font-bold">
            The Intelligent Atelier
          </span>
          <h1 className="font-headline text-6xl md:text-7xl lg:text-8xl italic text-on-surface leading-[1.1]">
            Talk to Your Database Like You Talk to a Friend
          </h1>
        </div>

        <p className="text-on-surface-variant text-lg md:text-xl max-w-xl leading-relaxed">
          Kakaw AI helps non-technical users get insights from their databases
          in seconds. No SQL knowledge needed.
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            href="/login"
            className="primary-gradient text-on-primary px-8 py-4 rounded-xl font-medium shadow-2xl shadow-primary/10 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
          >
            Start Talking to Your Data
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
          <button className="bg-surface-container-high text-on-surface px-8 py-4 rounded-xl font-medium hover:bg-surface-container-highest transition-all flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch 30s Demo
          </button>
        </div>
      </div>

      {/* Right column */}
      <div className="lg:col-span-5 relative">
        <div className="absolute -inset-4 bg-primary-fixed/20 blur-3xl rounded-full" />
        <div className="relative z-10 aspect-square overflow-hidden rounded-3xl bg-surface-container-low p-8 border border-outline-variant/15 flex items-center justify-center">
          <Image
            src="/mascot.png"
            alt="Friendly Chihuahua Mascot — Kakaw"
            width={480}
            height={480}
            className="w-full h-full object-contain drop-shadow-2xl"
            priority
          />
        </div>

        {/* Floating glass card */}
        <div className="absolute -bottom-6 -left-12 z-20 glass-panel p-6 rounded-2xl border border-outline-variant/15 shadow-xl max-w-xs hidden sm:block">
          <div className="flex items-center gap-3 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
              Live Insight
            </span>
          </div>
          <p className="font-headline italic text-lg text-primary leading-tight">
            &ldquo;Your revenue in Q4 grew by 22% mainly driven by the &apos;Home
            Decor&apos; category.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
