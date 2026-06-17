Refactor the `<head>` tag in `index.html` to resolve conflicting metadata, remove redundancies, and add a favicon. Changes are scoped exclusively to `index.html`.

### 1. Delete conflicting JSON-LD schema
Remove the second `<script type="application/ld+json">` block (lines 56-66) with `@type: "SoftwareApplication"`.

### 2. Update the WebApplication schema
Replace the first `<script type="application/ld+json">` block (lines 44-55) with the following exact code. The `url` field changes from `https://chromaticdaily.com` to `https://chromatic-daily.lovable.app`, and the `description` is expanded.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Chromatic Daily",
  "url": "https://chromatic-daily.lovable.app",
  "applicationCategory": "GameApplication",
  "genre": "Brain Game, Memory Game, Color Puzzle",
  "description": "A minimalist daily color memory game designed to stimulate neuroplasticity and cognitive retention through visual tracking. Play instantly in any web browser without app store downloads or sign-ups.",
  "browserRequirements": "Requires HTML5 support."
}
</script>
```

### 3. Clean up redundancies
- Remove the outdated TODO comment on line 30 (`<!-- TODO: Update og:title to match your application name -->`).
- Remove `<meta name="twitter:site" content="@Lovable" />`.

### 4. Add favicon
Insert `<link rel="icon" type="image/png" href="/apple-touch-icon.png" />` immediately after the existing `<link rel="apple-touch-icon" ...>` tag so the logo appears in browser tabs and Google Search results.