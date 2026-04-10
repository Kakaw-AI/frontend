# OG Image — Design Spec

**Date:** 2026-04-10
**Scope:** Single shared Open Graph image for the entire Kakaw AI site.

---

## Goal

Add a single `opengraph-image.tsx` to the Next.js App Router so every page on kakaw.ai shares a polished, on-brand social preview image when shared on Twitter/X, LinkedIn, Slack, iMessage, etc.

---

## Output

| Property | Value |
|---|---|
| File | `src/app/opengraph-image.tsx` |
| Dimensions | 1200 × 630 px |
| Format | PNG (via `ImageResponse`) |
| Route | `/opengraph-image` (auto-discovered by Next.js) |
| Scope | Site-wide — one image, no per-page variants |

---

## Visual Design

**Direction: Dark & Warm** — inspired by the login page's right panel.

### Background
Full-bleed gradient: `#705731` (top-left) → `#291800` (bottom-right), `135deg`.

### Left panel (~60% width)
Vertically centered, left-aligned content:

1. **Eyebrow** — "KAKAW AI" in all-caps, gold (`#e3c193`), wide letter-spacing, small font (~18px equivalent)
2. **Headline** — "Talk to your database like a friend." in Newsreader italic, cream (`#fffaf8`), large (~72px), line-height 1.15
3. **Body copy** — "No SQL needed. Ask in plain English, get answers in seconds." muted cream (`rgba(255,250,248,0.65)`), ~22px
4. **Wordmark** — A short gold rule (`#e3c193`) followed by "kakaw.ai" in Newsreader italic, gold, ~26px

### Right panel (~35% width)
Centered vertically:

1. **Orbit bubbles** — two soft circular blobs behind the mascot, `rgba(227,193,147,0.10)` and `rgba(227,193,147,0.07)`, blurred
2. **Mascot circle** — circular frame with `rgba(255,255,255,0.08)` fill and `rgba(255,255,255,0.15)` border; `mascot.png` rendered inside, object-fit contain
3. **Pill badge** — "✦ No SQL required" floating bottom-right of the right panel; `rgba(255,255,255,0.10)` background, `rgba(255,255,255,0.20)` border, cream text, small rounded pill

---

## Implementation

### Font loading
Fetch **Newsreader italic** from Google Fonts at generation time:

```
https://fonts.gstatic.com/s/newsreader/v20/cY9qfjOCX1hbuyalUrK49dLioYsn.woff2
```

Pass as `fonts` option to `ImageResponse`. Used for headline and wordmark only — body copy uses system sans.

### Mascot image
Read `public/mascot.png` with `fs.readFileSync` at generation time, convert to base64 data URL (`data:image/png;base64,...`). No network call, no external dependency.

### ImageResponse constraints
- All layout must use **flexbox only** — no CSS grid
- No `backdrop-filter`, `blur()`, or advanced CSS (not supported in `ImageResponse`)
- Orbit blobs simulated with `border-radius: 9999px` and low-opacity fills
- Pill badge: simple `border-radius`, inline padding

---

## Files Changed

| File | Action |
|---|---|
| `src/app/opengraph-image.tsx` | Create |

No changes to `layout.tsx` or any existing metadata — Next.js auto-discovers the file.

---

## Acceptance Criteria

- `GET /opengraph-image` returns a 1200×630 PNG
- Image renders the dark gradient, headline, mascot, and pill badge
- No build errors related to font fetching or image reading
- Verified with [opengraph.xyz](https://www.opengraph.xyz) or browser DevTools (check `<meta property="og:image">`)
