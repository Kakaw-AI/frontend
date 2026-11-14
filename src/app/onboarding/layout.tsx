import { Logo } from "@/components/Logo";
import { OnboardingSidebar } from "@/components/onboarding/OnboardingSidebar";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { OnboardingTopBarActions } from "@/components/onboarding/OnboardingTopBarActions";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-on-background min-h-dvh flex flex-col">
      {/* Top Nav */}
      <header className="bg-surface border-b-2 border-primary/10 fixed top-0 left-0 right-0 z-50">
        <div className="flex justify-between items-center w-full px-5 py-4 md:px-8 max-w-screen-2xl mx-auto">
          <Logo />
          <OnboardingTopBarActions />
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        <OnboardingSidebar />
        <main className="ml-0 lg:ml-64 flex-1 flex flex-col min-h-[calc(100dvh-64px)]">
          <OnboardingStepper />
          {children}
        </main>
      </div>
    </div>
  );
}
