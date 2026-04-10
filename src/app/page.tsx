import type { Metadata } from "next"
import { Navbar } from "@/components/landing/Navbar"

export const metadata: Metadata = {
  title: "Kakaw AI — Talk to Your Database Like You Talk to a Friend",
  description:
    "Kakaw AI lets non-technical teams query any database using plain English. No SQL needed. Connect your database, ask questions, get answers instantly.",
  openGraph: {
    title: "Kakaw AI — Talk to Your Database Like You Talk to a Friend",
    description:
      "Kakaw AI lets non-technical teams query any database using plain English. No SQL needed. Connect your database, ask questions, get answers instantly.",
    url: "https://kakaw.ai",
  },
}
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { ExtendedFeatures } from "@/components/landing/ExtendedFeatures"
import { PricingSection } from "@/components/landing/PricingSection"
import { Footer } from "@/components/landing/Footer"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <Hero />
        <Features />
        <HowItWorks />
        <ExtendedFeatures />
        <PricingSection />
      </main>
      <Footer />
    </>
  )
}
