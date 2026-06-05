## Scope

All changes are gated to the **Go Knicks** visual theme. Core game logic, scoring, persistence, DDA, timers, sharing, and other themes are untouched.

## 1. Replace Knicks images with uploaded PNGs

Use the 7 attached PNGs for the 7 chromatic slots (excluding the two that previously mapped to images now serving as anchors). The Black anchor renders solid Knicks blue and the White anchor renders solid Knicks orange — these stay as solid color fills, no image.

Upload all 7 PNGs to Lovable Assets (CDN pointers under `src/assets/knicks/`), then delete the obsolete locally-generated PNGs that they replace. Final 9-slot mapping for `KnicksOverlay`:

| Hex | Slot | Asset |
|---|---|---|
| #EF4444 Red | basketball | `Mask group.png` |
| #FDE047 Yellow | KNICKS wordmark roundel | `Mask group (3).png` |
| #2DD4D4 Teal | Statue of Liberty | `Mask group (5).png` |
| #FD9349 Orange | Jersey 11 | `Mask group (6).png` |
| #8B5CF6 Purple | KNICKS circular logo | `Mask group (4).png` |
| #7AC00F Lime | Player portrait (Brunson) | `Mask group (1).png` |
| #3F6212 DarkGreen | Player portrait (Towns) | `Mask group (2).png` |
| #F198C4 Pink | reuse KNICKS roundel | `Mask group (3).png` |
| #2563EB Blue | reuse jersey 11 | `Mask group (6).png` |
| #000000 (anchor) | solid Knicks blue `#1D428A` | none |
| #FFFFFF (anchor) | solid Knicks orange `#F58426` | none |

(Two slots reuse an attached image since only 7 unique uploads were provided. No new generation.)

### Responsive circular sizing

Update `KnicksOverlay` so each `<img>` reliably fits the circle regardless of source aspect ratio:
- `position: absolute; inset: 0; width: 100%; height: 100%`
- `object-fit: contain` (was `cover`) so logos/portraits aren't cropped
- `object-position: center`
- Underlying tile keeps the white backdrop from `GameGrid.getDisplayBackground` so transparent PNG corners read as a clean circle
- Existing border rule for light-filled tiles stays in place

No layout, sizing, or container changes outside the overlay's own styles.

## 2. Conditional game-end audio + confetti (Go Knicks only)

Trigger when `phase` transitions to `'result'` for the **daily** game **and** `visualTheme === 'knicks'`. Fires on every game-end (wins and losses), per user choice.

Implementation in `src/pages/Index.tsx`:

1. Add a second audio ref `bingBongAudio` loaded once in the existing audio-init `useEffect`. Use a free open-source SFX URL (e.g. a short Pixabay "ding/bell" clip) as a placeholder for "Bing Bong" — easy to swap later.
2. Add `fireKnicksCelebration()` helper modeled on existing `triggerMilestone`, but with `colors: ['#1D428A', '#F58426']` (Knicks blue + orange) only.
3. In the existing daily-result effect (around line 432 / where `phase === 'result'` first commits), add a one-shot guard so when `visualTheme === 'knicks'` and the result modal is opening for the first time this round, we call `fireKnicksCelebration()` and play `bingBongAudio`. Use a `useRef` flag keyed off `(roundIndex, attemptInRound)` to avoid double-firing on rerenders or auto-transition.
4. Practice/freeplay mode is excluded (the existing `practiceMode` / freeplay branches don't enter the daily result path we're hooking).

The existing `triggerMilestone` (multi-color confetti + chime) is left alone for non-Knicks themes.

## 3. Basketball-themed copy (Go Knicks only)

Wrap the small set of player-facing strings so that when `visualTheme === 'knicks'`, the alternates apply. All other themes keep current copy verbatim.

Locations:

- **`src/lib/game.ts` → `getResultMessage`**: accept an optional `theme` param. When `theme === 'knicks'` and `isCorrect`, return Knicks-flavored variants:
  - First-round perfect → "Swish! Nothing but net." (+ existing "rounds left" tail)
  - Final-attempt clutch win → "Buzzer Beater! 🏀"
  - Generic mid-game win → "On Fire!"
  - Final round complete (any) → "Game complete — championship form!"
  - Loss copy stays as-is (no goofy basketball loss copy was requested).
- **`src/pages/Index.tsx`** around the freeplay result string (line 548): when knicks, swap `'Great memory! Ready for the next one?'` → `'Swish! Run it back?'`.
- **Streak / daily summary headline** in `DailySummary.tsx`: when knicks, swap any "Nice work" / generic success headline for "On Fire!" and the streak-line label (e.g. "Day streak") for "Game streak". I'll grep the file for the exact strings and only replace the success-facing ones — no layout changes, just text swaps inside existing nodes so spacing/alignment stay identical.

All swaps are pure string substitutions in the same JSX nodes — no new components, no wrapping containers.

## 4. Preservation

- No changes to `COLORS`, round count, DDA, timers, scoring, persistence keys, share text format, analytics event names, onboarding copy, or other themes.
- `KNICKS_IMAGE_FOR_HEX` keys stay aligned with the canonical `COLORS` hexes.
- No new dependencies (canvas-confetti is already installed).

## Files touched

- `src/assets/knicks/*.asset.json` — 7 new CDN pointers; delete obsolete generated PNGs they replace
- `src/components/KnicksOverlay.tsx` — new mapping + `object-contain` styling
- `src/pages/Index.tsx` — bing-bong audio ref, Knicks-only celebration trigger, freeplay copy swap
- `src/lib/game.ts` — `getResultMessage` accepts optional `theme` and returns Knicks variants
- `src/components/DailySummary.tsx` — Knicks-only headline/streak label swaps

## Verification

- Toggle to Go Knicks → tiles show the 7 attached PNGs (no cropping), anchors solid blue/orange.
- Finish a daily round in Go Knicks → bing-bong plays, blue/orange confetti bursts, result text reads "Swish!" / "Buzzer Beater!" / "On Fire!" as appropriate.
- Toggle to Colors/Patterns/Shapes → original copy, original confetti palette, original chime — completely unchanged.
- Reload mid-state → no double-fire of celebration.
