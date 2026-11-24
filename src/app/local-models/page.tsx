import { LANDING, LandingPageView, landingMetadata } from "@/components/landing/pages";

const page = LANDING.localModels;

export const metadata = landingMetadata(page);

export default function Page() {
  return <LandingPageView page={page} />;
}
