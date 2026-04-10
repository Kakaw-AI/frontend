import { OnboardingSidebar } from "@/components/onboarding/OnboardingSidebar";
import { OnboardingTopBarActions } from "@/components/onboarding/OnboardingTopBarActions";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="bg-[#fbf9f8] fixed top-0 left-0 right-0 z-50">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="text-2xl font-headline italic text-primary tracking-tight">
            Kakaw DB
          </div>
          <OnboardingTopBarActions />
        </div>
        <div className="bg-surface-container-low h-px w-full" />
      </header>

      <div className="flex flex-1 pt-16">
        <OnboardingSidebar />
        <main className="ml-64 flex-1 flex flex-col min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
