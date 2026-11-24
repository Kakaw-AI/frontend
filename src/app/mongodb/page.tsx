import { LANDING, LandingPageView, landingMetadata } from "@/components/landing/pages";

const page = LANDING.mongodb;

export const metadata = landingMetadata(page);

export default function Page() {
  return <LandingPageView page={page} />;
}
