# Tri-State Visual Theme System

Replace the binary Accessibility toggle (Colors ↔ Patterns) with a three-way **Visual Style** selector: **Solid Colors**, **Patterns**, **Shapes**. Game math, scoring, timing, DDA, weekend 7+2 anchor logic, and storage all remain unchanged — only rendering changes.

---

## Clarification needed (point 3 in your brief)

Your "Option B Logic" mentions a single **Target** that the user clicks, and treating any instance of an anchor shape as a hit. Chromatic Daily today is a **full-grid recall puzzle** (memorize 9 slots, reproduce them, then `verify()` compares slot-by-slot) — there is no single-target click flow.

I will proceed under this interpretation, which preserves the game exactly:

- "Hit" detection stays slot-by-slot via hex comparison (unchanged in `verify()`).
- In **Shapes mode**, each color hex is mapped 1:1 to a Font Awesome icon; comparison still happens on the underlying hex, so the player matching the right icon in the right slot is automatically a correct match.
- Anchors on weekends (`#000000`, `#FFFFFF`) map to `FaCircle` and `FaSquare` and stay locked in their generated positions — no change to `generateSolutionDDA` or the 7+2 split.

If you actually want a different mechanic (e.g. a new "tap the matching shape" mode), tell me and I'll revise.

---

## What changes

### 1. Theme state — replace `useAccessibility`

Rename `src/hooks/useAccessibility.tsx` → `src/hooks/useVisualTheme.tsx` (keep the file path but expand the API). Three values:

```ts
type VisualTheme = 'colors' | 'patterns' | 'shapes';
```

- localStorage key: `chromatic-visual-theme` (migrate old `chromatic-accessibility === 'true'` → `'patterns'`, else `'colors'`).
- Hook exports `{ theme, setTheme }`.
- Add a back-compat shim `useAccessibility()` returning `{ enabled: theme === 'patterns', toggle: () => setTheme(theme === 'patterns' ? 'colors' : 'patterns') }` so the timer-doubling math (`getObservationDuration(..., a11y)`) keeps working untouched. Patterns mode keeps the 2× observation time; Shapes mode does **not** (icons are as readable as colors).

### 2. New `VisualThemeToggle` segmented control

Create `src/components/VisualThemeToggle.tsx` — a 3-option segmented control replacing `AccessibilityToggle` in the same slot under the game card (`Index.tsx` line ~1093). Labels: **Colors / Patterns / Shapes**. Uses existing tokens (rounded-full pill, border, active = `bg-primary text-primary-foreground`). PostHog event `visual_theme_changed` with the new value.

Delete `src/components/AccessibilityToggle.tsx`.

### 3. Shape mapping

New file `src/components/ShapeOverlay.tsx`:

```ts
import { FaHeart, FaStar, FaBolt, FaCloud, FaMoon, FaCircle, FaSquare, FaPlay, FaGhost } from 'react-icons/fa';
```

Map by hex (order matches `COLORS` array in `src/lib/game.ts` + the two anchors):

| Hex | Color name | Icon |
|---|---|---|
| `#EF4444` Red | FaHeart |
| `#FDE047` Yellow | FaStar |
| `#2DD4D4` Teal | FaBolt |
| `#FD9349` Orange | FaCloud |
| `#8B5CF6` Purple | FaMoon |
| `#7AC00F` Lime | FaPlay (triangle) |
| `#3F6212` Green | FaGhost |
| `#F198C4` Pink | FaHeart… |
| `#2563EB` Blue | (assign remaining) |
| `#000000` Black anchor | **FaCircle** |
| `#FFFFFF` White anchor | **FaSquare** |

(I'll finalize the 9 chromatic ↔ 9 icon assignment when wiring up; you listed 9 icons but two — Circle/Square — are reserved for anchors, so I'll need to ask which of the 9 chromatic colors share an icon, OR substitute two extra icons like `FaSun`/`FaSnowflake`. **Please confirm**.)

`<ShapeOverlay colorHex={hex} />` renders an absolute-positioned, centered black icon at ~60% of parent width on a white background button. Returns `null` for `colorHex == null`.

### 4. Wire into renderers

Three places render colored circles. Each gets a `theme` switch:

- `src/components/GameGrid.tsx` — main 3×3 board.
- `src/pages/Index.tsx` — color picker palette (~line 1025) and result-pattern preview (~line 1256).
- `src/components/DailySummary.tsx` — solution + player grids (~lines 260, 291).

Render rule per slot, given the slot's `colorHex`:

- `theme === 'colors'`: today's behavior (solid background = hex, no overlay).
- `theme === 'patterns'`: today's behavior (solid background = hex + `<PatternOverlay>`).
- `theme === 'shapes'`: background forced to `#FFFFFF` with current border, plus `<ShapeOverlay colorHex={hex}>`. Selected/active/error borders behave exactly as the white-color case already does (the grid already has a white-color branch in `getCircleBorder`).

### 5. Share card capture (`SessionReport.tsx`)

The card already snapshots whatever is mounted, so changing the renderers above is sufficient — the active theme will appear in the PNG automatically. No extra work needed beyond verifying that `react-icons` SVGs render through `html-to-image` (they do; they're inline SVG). Keep the existing 3×→2× pixel-ratio fallback.

### 6. Performance / no resets

Theme switching only flips a context value → re-render. No effect on `phase`, `solution`, `playerGrid`, timers, or storage. Verified by not adding `theme` to any dependency array that triggers regeneration.

---

## Files touched

- **New:** `src/components/VisualThemeToggle.tsx`, `src/components/ShapeOverlay.tsx`
- **Renamed/expanded:** `src/hooks/useAccessibility.tsx` → adds `theme`/`setTheme` + back-compat shim
- **Edited:** `src/pages/Index.tsx`, `src/components/GameGrid.tsx`, `src/components/DailySummary.tsx`
- **Deleted:** `src/components/AccessibilityToggle.tsx`
- **Dependency:** `bun add react-icons`

---

## One blocker to confirm before I build

You listed **9 icons** but `FaCircle` + `FaSquare` are reserved for the two weekend anchors. That leaves only **7 icons** for **9 chromatic colors**. Options:

1. I substitute two extra icons (suggest: `FaSun`, `FaSnowflake`) so all 9 chromatic colors get a unique icon.
2. You provide the two replacement icons.
3. Two chromatic colors intentionally share an icon (not recommended — breaks recall).

I'll default to option 1 unless you say otherwise.