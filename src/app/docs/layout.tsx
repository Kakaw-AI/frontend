import Link from "next/link"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { DocsSidebar } from "./DocsSidebar"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="pt-24 min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-8 py-16 flex gap-16">
          <aside className="hidden lg:block w-56 shrink-0">
            <DocsSidebar />
          </aside>
          <main className="flex-1 min-w-0 max-w-2xl">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </>
  )
}
