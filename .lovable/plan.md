## Fix

In `src/components/KnicksOverlay.tsx`, remap the two chromatic slots that currently reuse other images so they use the new uploaded anchor PNGs instead. This removes the visible duplication in the color picker (and everywhere else).

```
'#F198C4' (Pink)            → anchor_orange.png   (was wordmark — duplicate)
'#2563EB' (Chromatic Blue)  → anchor_blue.png     (was jersey11 — duplicate)
```

Anchors stay as-is:
```
'#000000' → anchor_blue.png
'#FFFFFF' → anchor_orange.png
```

So on Sun/Practice the anchor + same-hued chromatic share the same image, which is fine since they're internally distinct slots and the new PNGs read cleanly in both contexts.

No other changes — same imports, same overlay logic, every surface already renders `KnicksOverlay` for all hexes.
