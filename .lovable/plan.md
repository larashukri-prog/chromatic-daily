# Fix: Stable, Fast, Branded Share PNG

## Problem
Capturing the visible `SessionReport` card has two issues:
- Layout can shift during capture (icons/labels stack or overlap when html-to-image rasterizes the live, responsive card).
- Custom web font (`Playfair Display`) may not be ready, causing inconsistent text rendering and added latency.

The fix: render a dedicated **off-screen capture node** with fixed width, system fonts, flex layout, and `flex-shrink: 0` rules — and snapshot that instead of the live card.

## Changes — `src/components/SessionReport.tsx`

### 1. Add an off-screen capture container
Add a second `div` (positioned `fixed; left: -10000px; top: 0`) that mounts only while `isCapturing` is true. Width locked at `420px`, system font stack, contains the same content as the visible card minus interactive buttons, plus the branded footer.

```tsx
const captureRef = useRef<HTMLDivElement>(null);

{isCapturing && (
  <div
    ref={captureRef}
    style={{
      position: 'fixed',
      left: '-10000px',
      top: 0,
      width: '420px',
      padding: '24px',
      background: '#ffffff',
      border: '1px solid hsl(var(--border))',
      borderRadius: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}
  >
    {/* Title, insight, 4 stat rows, footer */}
  </div>
)}
```

### 2. Stat row layout (No-Overlap Rule)
Each stat is a flex row, not a stacked column, so icon + value + label remain neighbors:

```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  marginBottom: '8px',
}}>
  <Icon style={{ width: 18, height: 18, flexShrink: 0, color: '#6b7280' }} />
  <span style={{ flexShrink: 0, fontWeight: 600, fontSize: 18, color: '#111' }}>
    {value}
  </span>
  <span style={{
    flexShrink: 0,
    marginLeft: 'auto',
    fontSize: 10,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#6b7280',
  }}>
    {label}
  </span>
</div>
```

`flex-shrink: 0` on every child guarantees no squishing/overlap regardless of value length. Fixed 420px parent width prevents responsive reflow.

### 3. Metrics & labels (synced)
Four rows, in this order, matching latest definitions:
- `Target` — **Rounds** — `stats.roundsPlayed`
- `Zap` — **Reflex Avg** — `reflexLabel`
- `Crown` — **Peak** — `peakLabel`
- `Brain` — **Decoded** — `stats.tilesDecoded`

### 4. High-efficiency capture (rAF, no setTimeout)
Replace the current double-rAF + width-mutation dance with a single rAF after `setIsCapturing(true)`, then snapshot `captureRef.current`:

```tsx
const handleShareCard = async () => {
  if (isCapturing) return;
  setIsCapturing(true);
  // Wait one paint so the off-screen node mounts.
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  try {
    const node = captureRef.current;
    if (!node) return;
    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });
    // …existing share/download/WhatsApp flow unchanged…
  } finally {
    setIsCapturing(false); // unmounts the off-screen node → frees memory
  }
};
```

Removes: per-capture style mutations on the live card, double-rAF wait, font-smoothing toggles, low-res session flag (no longer needed — system fonts + fixed width make 3x fast and consistent).

### 5. Branded footer (inside capture node)
At the bottom of the capture container:

```tsx
<div style={{
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #e5e7eb',
}}>
  <img src="/share-logo.png" alt="" style={{ height: 20, flexShrink: 0 }}
       onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
  <span style={{ fontWeight: 700, fontSize: 14, color: '#111', flexShrink: 0 }}>
    ChromaticDaily
  </span>
  <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>
    · chromatic-daily.lovable.app
  </span>
</div>
```

### 6. Visible card untouched
The on-screen card keeps its current grid/Playfair design. Only the capture node uses system fonts + flex rows. Users still see the polished Playfair version; the shared PNG is a clean, stable variant.

## Result
- PNG layout is pixel-stable: fixed width, flex rows, `flex-shrink: 0`, system fonts.
- Capture is one rAF away — no setTimeout, no perceived lag.
- Off-screen node only exists during capture, then unmounts (low memory).
- Metrics/labels: Rounds, Reflex Avg, Peak, Decoded.
- Branded footer included.
