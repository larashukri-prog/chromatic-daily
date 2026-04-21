

## Add Two New Sections to "How to Play" Modal

Insert two new sections in the "How to Play" dialog in `src/pages/Index.tsx`, immediately after the existing "The Speed Star ⭐️" block (line 1000) and before the "3 Daily Attempts" block (line 1001).

### Change

**File: `src/pages/Index.tsx`** — insert after line 1000:

```tsx
<div className="border-t border-border pt-4">
  <p className="font-medium text-foreground mb-1">The Neural Match</p>
  <p>Neural Match represents the precision of your visual memory. Unlike a simple pass/fail, this measures how closely your brain mapped the chromatic spectrum. Aim for 100% Neural Match to reach the Mastered State.</p>
</div>
<div className="border-t border-border pt-4">
  <p className="font-medium text-foreground mb-1">Deep Focus Tracking</p>
  <p>We now monitor your total focus duration per session. This is not a race; it is a measure of sustained attention. Watch your daily focus time grow as your concentration strengthens.</p>
</div>
```

Styling matches the existing sibling sections (same border-top divider, heading weight, and body copy treatment) so the new content blends seamlessly into the scrollable modal.

### Result

The "How to Play" modal now reads in this order: Speed Star → **Neural Match** → **Deep Focus Tracking** → 3 Daily Attempts → Daily Difficulty → Practice Makes Perfect.

