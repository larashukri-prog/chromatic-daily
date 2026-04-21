

## Move Neural Match & Deep Focus Copy to a Dedicated Info Modal

The new "Neural Match" and "Deep Focus Tracking" copy was added inside the existing **How to Play** dialog (`showHowTo`), which mixes onboarding instructions with metrics info. The user wants the metrics info isolated to its own modal — opened by the Info (ⓘ) icon next to the refresh button — separate from the gameplay instructions.

### Changes (all in `src/pages/Index.tsx`)

**1. Remove the two new sections from the How-to-Play dialog**

In the `showHowTo` Dialog (around lines 997–1013), delete the two `<div className="border-t border-border pt-4">` blocks containing "The Neural Match" and "Deep Focus Tracking". The How-to-Play dialog returns to onboarding steps + Speed Star + 3 Daily Attempts + Daily Difficulty + Practice Makes Perfect only.

**2. Add new state for the metrics modal**

```tsx
const [showMetricsInfo, setShowMetricsInfo] = useState(false);
```

**3. Re-wire the Info (ⓘ) button** (line 942) to open the new modal:

```tsx
<button onClick={() => setShowMetricsInfo(true)} ...>
  <Info className="w-5 h-5" />
</button>
```

**4. Add a new dedicated Dialog** for the metrics info, placed next to the existing How-to-Play dialog:

```tsx
<Dialog open={showMetricsInfo} onOpenChange={setShowMetricsInfo}>
  <DialogContent className="sm:max-w-md rounded-2xl">
    <DialogHeader>
      <DialogTitle style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        Game Metrics
      </DialogTitle>
      <DialogDescription className="sr-only">
        How Neural Match and Deep Focus tracking work
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <div>
        <p className="font-medium text-foreground mb-1">The Neural Match</p>
        <p>Neural Match represents the precision of your visual memory. Unlike a simple pass/fail, this measures how closely your brain mapped the chromatic spectrum. Aim for 100% Neural Match to reach the Mastered State.</p>
      </div>
      <div className="border-t border-border pt-4">
        <p className="font-medium text-foreground mb-1">Deep Focus Tracking</p>
        <p>We now monitor your total focus duration per session. This is not a race; it is a measure of sustained attention. Watch your daily focus time grow as your concentration strengthens.</p>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### How to access "How to Play" afterward

The start-of-game `OnboardingOverlay` already covers first-time instruction. The existing `showHowTo` dialog stays in the codebase but is no longer wired to a button after this change. To keep it reachable, we'll leave `setShowHowTo` available for future use (no UI entry point removed beyond repurposing the Info icon). If you'd like a separate trigger for "How to Play" later (e.g., a small "?" link inside the metrics modal), that's a follow-up.

### Result
- Tapping the Info (ⓘ) icon now opens a focused "Game Metrics" modal with only Neural Match + Deep Focus copy.
- The previous mixed How-to-Play dialog no longer contains the metrics sections.
- Onboarding card at game start is unchanged (it never had the metrics copy).

