import Link from "next/link";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "/docs" }
]

export function Navbar() {
  return (
    <header className="bg-[#fbf9f8] fixed top-0 left-0 right-0 z-50">
      <nav className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-headline text-2xl italic font-bold text-primary"
          >
            Kakaw AI
          </Link>
          <div className="hidden lg:flex gap-6 items-center">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  i === 0
                    ? "text-primary font-semibold border-b-2 border-primary font-body text-sm tracking-tight transition-colors duration-300"
                    : "text-on-surface/60 hover:text-primary font-body text-sm tracking-tight transition-colors duration-300"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-primary font-body text-sm tracking-tight hover:opacity-80 px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-body text-sm tracking-tight font-medium hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
