import { Logo } from "@/components/Logo";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { OnboardingTopBarActions } from "@/components/onboarding/OnboardingTopBarActions";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <header className="border-b-2 border-primary/10">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 md:px-8">
          <Logo />
          <OnboardingTopBarActions />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 md:px-8 md:py-12">
        <OnboardingStepper />
        {children}
      </main>
    </div>
  );
}
