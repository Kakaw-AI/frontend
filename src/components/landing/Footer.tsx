import Link from "next/link";

const footerLinks = {
  Product: ["Features", "Integrations", "Enterprise", "Changelog"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Security"],
};

export function Footer() {
  return (
    <footer className="bg-surface-container-high py-16">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Brand */}
        <div className="space-y-4">
          <span className="font-headline text-2xl italic font-bold text-primary">
            Kakaw AI
          </span>
          <p className="text-on-surface-variant max-w-xs text-sm">
            The Intelligent Atelier for data-driven teams who value craft over
            code.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-on-surface-variant hover:text-primary transition-colors"
              aria-label="Website"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            </Link>
            <Link
              href="#"
              className="text-on-surface-variant hover:text-primary transition-colors"
              aria-label="Share"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h5 className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface opacity-40">
                {category}
              </h5>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-outline-variant/15 text-center md:text-left">
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
          © 2024 Kakaw AI. Handcrafted in the Intelligent Atelier.
        </p>
      </div>
    </footer>
  );
}
