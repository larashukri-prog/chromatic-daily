## Summary Screen Overhaul & Conditional Messaging

### What Changes

**File 1: `src/pages/Index.tsx**`

- Hide the status bar (lines 620-665) when `showDailySummary` is true — wrap it in `{!showDailySummary && (...)}`
- Pass two new props to `DailySummary`: `dayName` (already available) and `colorCount` (use `baseColorCount`)

**File 2: `src/components/DailySummary.tsx**`

- Add `dayName: string` and `colorCount: number` to the props interface
- Add a `getDifficultyName` helper (same logic: ≤2 Minimalist, ≤4 Standard, ≤6 Complex, else Master)
- **Keep header** (lines 56-68): Instead of "Daily Summary" + solved count, show:
- **Add conditional rest section** between the carousel dots and share buttons (after line 137):
  - Primary: "Daily Challenge Complete."
  - Secondary (conditional): If today is Sunday → "Master Challenge Complete! A fresh start begins tomorrow." Otherwise → "Rest your eyes. Tomorrow will be even more challenging..."

### Technical Details

All game logic, attempt tracking, scoring, and state variables remain untouched. The status bar still renders during active gameplay — only hidden on the summary screen. The `dayName` is derived from the existing `getDayInfo()` call in Index.tsx and simply passed through as a prop.