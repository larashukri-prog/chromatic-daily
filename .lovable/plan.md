## Goal

Make Chromatic Daily highly discoverable for Google + AI answer engines targeting "neuroplasticity", "brain games", "memory games", "color games" — **without touching any game logic, state machine, color generation, scoring, or sharing flow**.

## Scope (files touched)

1. `index.html` — metadata + JSON-LD (static, crawler-visible on first paint).
2. `src/pages/Index.tsx` — add an SEO content block inside the existing "How to Play" Dialog structure with semantic headers. Render it always (so it's in the SSR'd HTML markup that React hydrates), but visually hidden via `sr-only` so the minimalist UI is preserved.

No edits to: `src/lib/game.ts`, `src/lib/freeplay.ts`, scoring, sharing, color generators, GameGrid, timers, or any state hooks.

## 1. `index.html` — metadata + JSON-LD

Replace existing `<title>` / `<meta name="description">` and add a JSON-LD script in `<head>`:

```html
<title>Chromatic Daily | Daily Color Memory & Brain Game</title>
<meta name="description" content="Challenge your brain with Chromatic Daily. A minimalist color memory game designed to stimulate neuroplasticity and cognitive focus every day. Play instantly." />

<!-- Also align og:title / og:description / twitter:* with the new copy -->

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Chromatic Daily",
  "url": "https://chromaticdaily.com",
  "applicationCategory": "GameApplication",
  "genre": "Brain Game, Memory Game, Color Puzzle",
  "description": "A minimalist daily color memory game designed to stimulate neuroplasticity and cognitive retention through visual tracking.",
  "browserRequirements": "Requires HTML5 support."
}
</script>
```

Note: the schema URL `https://chromaticdaily.com` is taken verbatim from your spec. The live deploy is `https://chromatic-daily.lovable.app`. Flagging in case you want the schema `url` to point to the lovable.app domain instead — say the word and I'll swap it.

## 2. Semantic SEO block inside the How-To modal (crawler-visible)

Inside `src/pages/Index.tsx`, append a new block inside the existing `<Dialog>` for `showHowTo` (after the existing instructional content, around line 1288). This block uses the requested semantic hierarchy and is wrapped in `sr-only` so it's parsed by Googlebot/LLM scrapers but invisible to sighted users.

Crucially, this content lives in the JSX tree unconditionally — not gated behind `showHowTo` — so it appears in the HTML even before the modal opens. Implementation: render it as a sibling `<section className="sr-only">` directly inside the page (not inside `<DialogContent>`, which Radix only mounts when `open`). This guarantees crawlers see it on first parse.

```tsx
<section className="sr-only" aria-hidden="true">
  <h1>Chromatic Daily | Daily Color Memory & Brain Game</h1>
  <h2>How it Works: Stimulating Neuroplasticity Through Color</h2>
  <p>Chromatic Daily is a minimalist daily color memory game...</p>
  <h3>Cognitive Benefits of Daily Memory Games</h3>
  <p>Regular practice with color-based memory challenges supports neuroplasticity, working memory, and visual attention...</p>
</section>
```

- `<h1>` carries the brand + primary keywords.
- `<h2>` and `<h3>` carry the requested keyword-rich phrases.
- `sr-only` (already a Tailwind utility) hides via off-screen 1px clip — Google reads it; users never see it; layout is untouched.
- The existing visible "How to Play" Dialog modal content is left exactly as-is.

## 3. Verification checklist before applying

- `src/lib/game.ts`, `freeplay.ts`, scoring, sharing, color generators: untouched.
- No new state hooks, no changes to `showHowTo` toggle behavior.
- Existing modal copy and layout unchanged.
- New SEO block lives outside `<Dialog>` so it's always in the DOM.
- JSON-LD added via static `<script>` in `index.html` (no Helmet needed; safest, zero build risk).

## Out of scope

- Per-route Helmet metadata (single-page experience, one canonical title is sufficient).
- Sitemap/robots changes (existing `robots.txt` retained).
- Any AI-gateway, analytics, or game behavior changes.
