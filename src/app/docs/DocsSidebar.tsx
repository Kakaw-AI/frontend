'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

const sidebarLinks = [
  { label: "Getting Started", href: "/docs" },
  { label: "Connect a Database", href: "/docs/connect-database" },
  { label: "Set Up Your LLM", href: "/docs/setup-llm" },
  { label: "Using the Chat", href: "/docs/using-chat" },
]

export function DocsSidebar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-32 space-y-1">
      <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface opacity-40 mb-4">
        Documentation
      </p>
      {sidebarLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === link.href
              ? "text-primary bg-surface-container-low font-semibold"
              : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
