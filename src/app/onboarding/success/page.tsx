import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, CircleDot } from "lucide-react";

export default function OnboardingSuccessPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      {/* Background decorative elements */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-screen bg-surface-container-low/50 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-12">
        {/* Mascot */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary opacity-5 blur-3xl rounded-full scale-75 group-hover:scale-90 transition-transform duration-700" />
          <div className="relative flex justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 relative">
              <Image
                src="/mascot-success.png"
                alt="Kakaw mascot — you're all set!"
                fill
                className="object-contain filter drop-shadow-2xl"
                priority
              />
              <div className="absolute -top-4 -right-4 bg-primary-container text-on-primary-container p-3 rounded-full shadow-lg">
                <Sparkles size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary tracking-tight italic">
            You&apos;re All Set!
          </h1>
          <p className="text-xl md:text-2xl font-body text-on-surface-variant max-w-lg mx-auto leading-relaxed">
            Your database is connected. You&apos;re ready to start asking questions.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/dashboard"
            className="group relative px-10 py-4 bg-linear-to-br from-primary to-primary-container text-on-primary font-body font-semibold rounded-lg shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-300 flex items-center gap-2"
          >
            Go to Dashboard
            <ArrowRight size={18} />
          </Link>
          <a
            href="#"
            className="font-body text-sm font-medium text-primary hover:text-primary-container underline decoration-primary/30 underline-offset-4 transition-colors"
          >
            Upload Database DDL (Optional)
          </a>
        </div>

        {/* First Prompt Insight Card */}
        <div className="mt-24 text-left border-l-4 border-primary bg-surface-container-lowest p-8 shadow-sm max-w-md mx-auto translate-x-4">
          <h4 className="font-headline italic text-lg text-primary mb-2">
            First Prompt Idea
          </h4>
          <p className="font-body text-sm text-on-surface-variant mb-4">
            &ldquo;Show me the top 10 contributing artists from the last quarter by
            total revenue.&rdquo;
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase rounded tracking-wider">
              SQL Optimized
            </span>
            <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase rounded tracking-wider">
              Kakaw AI
            </span>
          </div>
        </div>
      </div>

      {/* Footer branding */}
      <footer className="mt-auto py-8 opacity-20 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 grayscale">
          <CircleDot size={20} className="text-primary" />
          <span className="font-headline italic text-lg text-primary font-bold">
            Kakaw DB
          </span>
        </div>
      </footer>
    </main>
  );
}
