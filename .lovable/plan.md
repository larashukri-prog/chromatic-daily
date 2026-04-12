

## Update Onboarding & Info Modal — "Precision over Panic"

Three areas of change: the first-time onboarding overlay, the "How to Play" info modal, and icon swaps.

### 1. Onboarding Overlay (`src/components/OnboardingOverlay.tsx`)

Replace the current 4 steps with 3 new steps:

| # | Icon | Label | Description |
|---|------|-------|-------------|
| 1 | `Eye` | Analyze the Colors | Take your time studying the color shades shown to you. |
| 2 | `CheckCircle2` | Start the Challenge | Tap the 'I am Ready' button once you've memorized the colors. The target colors will disappear once pressed. |
| 3 | `Star` | Earn a Speed Star ⭐️ | If you hit 'Ready' fast, you'll earn a Speed Star when you win the round! |

- Import `Star` from `lucide-react` (replace `Brain`, `Palette`).
- Remove the `badge` property (no longer needed).
- Update subtitle from "A daily color memory puzzle" to "Take your time. Precision over panic."

### 2. How to Play Modal (`src/pages/Index.tsx`, lines 935-983)

Replace the instruction steps (lines 942-958) with the same 3 steps above.

Replace the existing info sections with three new sections:

**Relaxed Mode:**
> "Play at your own pace. There is no time limit for studying the colors, making it the perfect way to relax while honing your visual perception skills."

**The Transition Tip:**
> "On your first game, we'll show a quick 3-2-1 countdown after you tap 'Ready' to help you transition. For all future games, the colors will fade smoothly and instantly."

**The Speed Star ⭐️:**
> "The Speed Star is a mark of visual mastery. It proves you have both a sharp eye and a fast memory. Try to collect a star in every round of the Daily Challenge!"

Keep the existing "3-Round Rule" and "Daily Difficulty" sections unchanged.

### 3. Icon Swap in `src/pages/Index.tsx`

- In the imports, add `Star` from `lucide-react` if not already imported.
- Replace any clock/hourglass icons used in game UI with `CheckCircle2` or `Star` to signal mastery instead of deadline. (Based on the current code, the main icon is already `Info` for the button — no clock icons found in UI, so this is primarily about the modal content icons.)

### Files Modified
- `src/components/OnboardingOverlay.tsx` — new steps, icons, subtitle
- `src/pages/Index.tsx` — rewritten How to Play modal content, icon imports

