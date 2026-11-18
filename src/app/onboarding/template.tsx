import { FadeUp } from "@/components/amicro/fade-up";

// A template remounts on every navigation, so each onboarding step fades in
// while the layout (logo, stepper) stays put.
export default function OnboardingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FadeUp yOffset={12} duration={0.4}>
      {children}
    </FadeUp>
  );
}
