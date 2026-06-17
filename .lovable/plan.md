## SEO Copy Update Plan

### 1. Update Meta Description in `index.html`
Replace the current `<meta name="description">` tag with the exact user-provided copy to clarify the browser-based nature of the game and differentiate from iOS apps.

### 2. Add Footer Disclaimer to `src/pages/Index.tsx`
Insert the provided disclaimer text at the very bottom of the main page layout (after the `<style>` block, before the closing root `</div>`). Style it with `text-[10px] text-muted-foreground/60` to keep it minimalist and crawler-friendly without disrupting the UI aesthetic.

No game logic or other UI components will be touched.