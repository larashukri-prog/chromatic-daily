## Add second Google Search Console verification meta tag

Add this line to `<head>` in `index.html`, right after the existing `google-site-verification` tag:

```html
<meta name="google-site-verification" content="pkTYqNdZN3roR8pfObDuCgcr3NeIc5eZxb4cZE03gZE" />
```

Multiple verification tags can coexist — the existing one stays in place.

### Files touched
- `index.html` — one-line addition.

### Out of scope
- No other tag, SEO, or game logic changes.
