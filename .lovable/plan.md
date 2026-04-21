

## Remove "Earn a Speed Star" Step from Info Modal

The info modal (the "How to Play" dialog opened from the info icon in `src/pages/Index.tsx`) still shows the third onboarding step with the Star icon and "Earn a Speed Star ⭐️" heading. Remove it so only the first two steps remain before the "The Neural Match" section.

### Change

**File: `src/pages/Index.tsx`**

In the info modal's "How to Play" content, remove the third step block:
- The `Star` icon container
- The heading "Earn a Speed Star ⭐️"
- The description sentence about clicking "Ready" fast

Keep:
1. Eye icon → "Analyze the Colors" + sentence
2. CheckCircle2 icon → "Start the Challenge" + sentence

The "The Neural Match" section (and everything after it) remains untouched and now follows directly after step 2.

If the `Star` icon import from `lucide-react` becomes unused after removal, also drop it from the import statement to keep the file clean.

### Note

This change only affects the info modal in `src/pages/Index.tsx`. The separate first-visit `OnboardingOverlay.tsx` component is not modified — its three-step intro (including the Speed Star step) stays as-is.

### Result

The info modal opens to a tighter two-step intro (Analyze → Start), flowing directly into the "The Neural Match" and "Focus Tracking" explanatory sections below.

