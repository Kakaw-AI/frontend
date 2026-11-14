import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function OnboardingSuccessPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      {/* Background decorative elements */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-dvh bg-surface-container-low/50 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-12">
        <div className="flex justify-center">
          <div className="pod-shadow flex h-28 w-28 items-center justify-center rounded-full border-2 border-primary bg-accent text-primary">
            <Check size={56} strokeWidth={3} aria-hidden="true" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-primary tracking-tight">
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
            className="group relative px-10 py-4 bg-primary pod-shadow border-2 border-primary text-on-primary font-body font-bold rounded-full hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2"
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
        <div className="mt-24 text-left pod-card pod-shadow rounded-3xl p-8 max-w-md mx-auto">
          <h4 className="font-headline text-lg text-primary mb-2">
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
          </div>
        </div>
      </div>

      {/* Footer branding */}
      <footer className="mt-auto py-8">
        <Logo className="text-lg" />
      </footer>
    </main>
  );
}
