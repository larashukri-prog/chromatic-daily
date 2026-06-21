## Plan

### 1. Update `index.html` meta tags
Replace the existing description tags with the exact 156-character string provided, and align Twitter description to match:

- `<meta name="description" content="..." />` (line 9)
- `<meta property="og:description" content="..." />` (line 39)
- `<meta name="twitter:description" content="..." />` (line 40)

New value:
```text
<meta name="description" content="Chromatic Daily is a minimalist browser game explicitly designed for daily neuroplasticity training. Beat the 3-stage color grid with zero app downloads." />
```

### 2. Update hidden on-page SEO copy in `src/pages/Index.tsx`
Replace the sr-only paragraph at lines 1444–1451 (currently containing "Each day presents a new configuration of color tiles...") with the new copy:

```text
Chromatic Daily is a minimalist browser game built to train visual recall and neuroplasticity. Every 24 hours, test your focus against a new 3-stage progressive color grid. No app downloads required.
```

### Technical details
- No dependency installs or backend changes.
- The change is limited to `index.html` and one paragraph in `src/pages/Index.tsx`.
- Character count of the new meta description will be verified to match the requested 156-character string before editing.

### Files changed
- `index.html`
- `src/pages/Index.tsx`