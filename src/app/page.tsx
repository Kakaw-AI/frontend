import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { softwareApplicationSchema, videoObjectSchema } from "@/lib/schema";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Kakaw AI: Ask PostgreSQL, MongoDB or SQLite in Plain English",
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ExtendedFeatures } from "@/components/landing/ExtendedFeatures";
import { PricingSection } from "@/components/landing/PricingSection";
import { DemoVideo } from "@/components/landing/DemoVideo";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { ProgressIndicator } from "@/components/amicro/progress-indicator";

export default function Home() {
  return (
    <>
      <JsonLd data={[softwareApplicationSchema(), videoObjectSchema()]} />
      <ProgressIndicator />
      <Navbar />
      <main className="pt-24">
        <Hero />
        <DemoVideo />
        <Features />
        <HowItWorks />
        <ExtendedFeatures />
        <PricingSection />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
