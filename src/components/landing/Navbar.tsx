import Link from "next/link";
import { Logo } from "@/components/Logo";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/docs" }
]

export function Navbar() {
  return (
    <header className="bg-surface border-b border-border fixed top-0 left-0 right-0 z-50">
      <nav className="flex justify-between items-center w-full px-5 md:px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden lg:flex gap-6 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-on-surface-variant hover:text-on-surface font-body text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="pod-btn px-5 py-2"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
