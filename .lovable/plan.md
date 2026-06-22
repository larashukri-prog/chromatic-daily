## Plan: Add Daily Salutations to Game Header

### Goal
Replace the static "Level: Complex" subtitle in the game header with a dynamic daily salutation that changes based on the current day of the week.

### Changes

1. **Create a salutation map in `src/pages/Index.tsx`**
   - Add a `DAY_SALUTATIONS` constant (or inline function) keyed by full day name.
   - Map each day to its phrase:
     - Monday → "Fresh focus."
     - Tuesday → "Stay sharp."
     - Wednesday → "Midweek flow."
     - Thursday → "Deep attention."
     - Friday → "Finish strong."
     - Saturday → "Unwind & play."
     - Sunday → "Weekly reset."

2. **Update the header subtitle JSX**
   - Location: `src/pages/Index.tsx` line ~1075.
   - Replace the current string:
     ```
     {dayName} · #{dayNum} · Level: {difficultyName}
     ```
   - With:
     ```
     {dayName} · #{dayNum} · {salutation}
     ```
   - Remove the `getDifficultyName` function and `difficultyName` variable if they are no longer referenced elsewhere.

3. **Preserve visual balance**
   - Keep the existing `<p>` element and its Tailwind classes (`text-sm text-muted-foreground tracking-wide uppercase`).
   - The centered flex layout of the parent header `div` remains unchanged, so interpunct spacing stays balanced regardless of salutation length.

### No-Change Areas
- Game logic, difficulty tiers, DDA, or stage progression.
- `getDayInfo()`, `getDayNumber()`, `dayName`, and `dayNum` behavior.
- Header layout, typography, or responsive visibility rules.