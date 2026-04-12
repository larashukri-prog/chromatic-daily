

## Add "Practice Makes Perfect" Section to How to Play

### Change
In `src/pages/Index.tsx`, add a new section after the "Daily Difficulty" block (after line 931), using the same styling pattern as the other sections:

```tsx
<div className="border-t border-border pt-4">
  <p className="font-medium text-foreground mb-1">Practice Makes Perfect</p>
  <p>Finished your Daily Challenge? Practice Mode unlocks once you've used your daily attempts. Dive in for unlimited rounds to sharpen your eye and master the mix!</p>
</div>
```

Also add the same section to the `OnboardingOverlay.tsx` steps or keep it modal-only — since it's contextual info rather than a core gameplay step, it fits best in the modal only.

Single insertion, one file (`src/pages/Index.tsx`).

