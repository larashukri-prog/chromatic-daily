## Add SoftwareApplication JSON-LD + update meta description

Two small edits to `index.html`. No component, hook, or game logic changes.

### 1. Update description tags

Replace the existing `<meta name="description">` (and matching `og:description` / `twitter:description`) content with:

> Chromatic Daily: The free, minimalist color memory game you can play instantly in any browser. No app store downloads or sign-ups required.

### 2. Add SoftwareApplication JSON-LD

Append a second `<script type="application/ld+json">` block in `<head>`, alongside the existing `WebApplication` schema (the two coexist fine):

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Chromatic Daily",
  "description": "A free, minimalist color memory game you can play instantly in any browser. No app store downloads or sign-ups required.",
  "applicationCategory": "BrowserGame",
  "operatingSystem": "Web Browser",
  "url": "https://chromatic-daily.lovable.app"
}
```

### Files touched
- `index.html` — description tags + new JSON-LD script block.

### Out of scope
- No changes to React components, routes, hooks, game state, color generation, or score sharing.
- Existing `WebApplication` JSON-LD, canonical, OG image, and title tags left as-is.
