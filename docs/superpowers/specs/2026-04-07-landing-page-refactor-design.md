# Landing Page Refactor — Design Spec

**Date:** 2026-04-07  
**Status:** Approved  

---

## Context

The landing page needs a full content and structure refresh to better reflect Kakaw AI's actual value proposition. Key problems: the hero floating card isn't visible, a "2-min demo" CTA oversells commitment, "Privacy First" is a weak differentiator compared to the real story (BYOK LLMs), there's no real pricing section, dead-end links exist throughout (Blog, Careers, Press), and there's no docs or legal page infrastructure.

---

## Architecture

### Files Modified

| File | Change |
|------|--------|
| `src/components/landing/Hero.tsx` | Fix floating card visibility; "30s Demo" button |
| `src/components/landing/Features.tsx` | Replace "Privacy First" → "Bring Your Own LLM" |
| `src/components/landing/HowItWorks.tsx` | Remove testimonial quote block |
| `src/components/landing/Navbar.tsx` | Remove Blog; point Docs → `/docs` |
| `src/components/landing/Footer.tsx` | Remove Company column; update Legal links to real pages; simplify Product column |
| `src/app/page.tsx` | Insert `<ExtendedFeatures />` after `<HowItWorks />`; replace `<CtaSection />` with `<PricingSection />` |
| `next.config.ts` | Add `@next/mdx` plugin + `pageExtensions` |

### Files Created

| File | Purpose |
|------|---------|
| `src/components/landing/ExtendedFeatures.tsx` | New 6-item feature grid section |
| `src/components/landing/PricingSection.tsx` | Replaces CtaSection — benefits grid + BYOK pricing |
| `src/mdx-components.tsx` | Required by App Router for MDX; maps headings/links to design system |
| `src/app/docs/layout.tsx` | Docs shell with sidebar nav (Getting Started, Connect DB, LLM Setup, Chat Guide) |
| `src/app/docs/page.tsx` | Docs index — imports `src/content/docs/index.mdx` |
| `src/content/docs/index.mdx` | Docs home: what is Kakaw, links to other guides |
| `src/content/docs/getting-started.mdx` | Quickstart guide |
| `src/content/docs/connect-database.mdx` | DB connection walkthrough |
| `src/content/docs/setup-llm.mdx` | LLM provider setup (Anthropic, OpenAI, Gemini, Ollama, LM Studio) |
| `src/content/docs/using-chat.mdx` | How to use the chat interface |
| `src/app/docs/[slug]/page.tsx` | Dynamic route rendering MDX doc by slug |
| `src/app/privacy/page.tsx` | Privacy Policy page — real content |
| `src/app/terms/page.tsx` | Terms of Service page — real content |

---

## Component Details

### Hero.tsx — Two fixes
1. **Floating card**: Remove `hidden md:block` class — replace with just `block`. Ensure the parent `lg:col-span-5` container has `overflow-visible` so the absolutely positioned card (`-bottom-6 -left-12`) isn't clipped.
2. **Demo button**: Change label from `Watch 2-min Demo` → `Watch 30s Demo`.

### Features.tsx — Replace third card
Replace the "Privacy First" entry in the `features` array with:
```ts
{
  title: "Bring Your Own LLM",
  body: "Connect your own API key from Anthropic, OpenAI, Gemini, Ollama, or LM Studio. You choose the model. We never touch your data or your keys.",
  icon: // key/lock icon (Lucide: KeyRound)
}
```

### HowItWorks.tsx — Remove testimonial
Remove the `<div className="space-y-4 max-w-sm">` block containing the `insight-accent` testimonial quote. Keep the `<h2>` heading and the four steps unchanged.

### ExtendedFeatures.tsx — New section
- Section id: `#extended-features`
- Heading: *"Everything you need to go from question to insight"*
- 6-item responsive grid (2 cols mobile, 3 cols desktop), each card: icon + title + one-line description:
  1. **Multi-Database Support** — Postgres, MySQL, Snowflake, SQLite
  2. **Transparent SQL** — See the exact query generated, no black box
  3. **Export & Share** — Download CSV, copy charts, share with your team
  4. **Saved Conversations** — Pick up where you left off, always saved
  5. **Schema-Aware AI** — Auto-maps your tables and relationships
  6. **Zero SQL Knowledge** — Anyone on your team can query data

Use the same card style as `Features.tsx` (`bg-surface-container-lowest p-10 rounded-2xl`) for visual consistency.

### PricingSection.tsx — Replaces CtaSection
Section id: `#pricing`. Layout: centered card with:
- Eyebrow label: "Pricing"
- Headline (font-headline italic): *"One plan. Always Free."*
- 2×2 benefits grid (background `surface-container-low` tiles):
  - ✓ BYOK — Use your own API key from any provider
  - ✓ All Features — No feature gates or paywalls
  - ✓ Any Model — Claude, GPT-4, Gemini, Llama…
  - ✓ Privacy First — Your data never touches our servers
- Provider row: `Anthropic · OpenAI · Gemini · Ollama · LM Studio`
- CTA button: "Get Started Free" → `/login`
- Remove all references to "14-day trial" and "500+ teams"

### Navbar.tsx — Link cleanup
Replace `navLinks` array:
```ts
const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "/docs" },
]
```
Remove Blog entry entirely.

### Footer.tsx — Structural cleanup
Replace `footerLinks` with:
```ts
const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Docs", href: "/docs" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
}
```
Remove entire Company column. Update footer copyright year to 2026.

---

## Docs Infrastructure

### Package installation
```
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

### next.config.ts update
```ts
import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}

const withMDX = createMDX({})

export default withMDX(nextConfig)
```

### mdx-components.tsx (src/mdx-components.tsx)
Maps MDX elements to design system typography:
- `h1` → `font-headline text-4xl italic`
- `h2` → `font-headline text-3xl italic`
- `h3` → `font-headline text-2xl italic`
- `p` → `text-on-surface-variant leading-relaxed`
- `a` → `text-primary hover:underline`
- `code` → `bg-surface-container-high px-1 rounded text-sm font-mono`
- `pre` → `bg-surface-container-high p-4 rounded-xl overflow-x-auto`

### Docs layout (src/app/docs/layout.tsx)
Sidebar + content shell. Sidebar nav items:
- Getting Started (`/docs`)
- Connect a Database (`/docs/connect-database`)
- Set Up Your LLM (`/docs/setup-llm`)
- Using the Chat (`/docs/using-chat`)

### Dynamic slug route
`src/app/docs/[slug]/page.tsx` uses dynamic import:
```ts
const { default: Doc } = await import(`@/content/docs/${slug}.mdx`)
```
With `generateStaticParams` returning all four slugs and `dynamicParams = false`.

---

## Privacy & Terms Pages

Both pages use the project's existing design system. No external layout component — inline TSX with `Navbar` and `Footer` wrappers, content rendered as styled prose sections.

**Privacy Policy** (`/privacy`) — sections:
1. Overview — BYOK model, schema-only access, no row data stored
2. What We Collect — account info (email), usage metadata
3. What We Don't Collect — your database rows, your API keys (never sent to our servers)
4. Data Storage — Better Auth session data stored locally
5. Third Parties — LLM providers (you choose, governed by their terms)
6. Contact

**Terms of Service** (`/terms`) — sections:
1. Acceptance
2. Service Description
3. Your Responsibilities — valid API keys, lawful database access
4. BYOK Acknowledgment — user is responsible for LLM provider costs
5. Limitation of Liability
6. Changes to Terms
7. Contact

---

## Verification

1. `npm run dev` — check landing page renders all sections in order
2. Hero floating card visible at all screen sizes
3. "Watch 30s Demo" shows in hero
4. Features shows "Bring Your Own LLM" as third card
5. HowItWorks has no testimonial
6. ExtendedFeatures renders all 6 items
7. PricingSection shows benefits grid + 5 providers
8. Navbar has: Features, How It Works, Pricing, Docs (no Blog)
9. Footer has: Product (Features, How It Works, Docs) + Legal (Privacy, Terms)
10. `/docs` loads docs index with sidebar
11. `/docs/getting-started`, `/docs/connect-database`, `/docs/setup-llm`, `/docs/using-chat` all render from MDX
12. `/privacy` and `/terms` pages render with real content
13. `npm run build` — no type errors
