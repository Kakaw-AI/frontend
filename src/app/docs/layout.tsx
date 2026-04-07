import Link from "next/link"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

const sidebarLinks = [
  { label: "Getting Started", href: "/docs" },
  { label: "Connect a Database", href: "/docs/connect-database" },
  { label: "Set Up Your LLM", href: "/docs/setup-llm" },
  { label: "Using the Chat", href: "/docs/using-chat" },
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="pt-24 min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-8 py-16 flex gap-16">
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-32 space-y-1">
              <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface opacity-40 mb-4">
                Documentation
              </p>
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
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
