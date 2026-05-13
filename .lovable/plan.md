Add a new entry titled "Practice Goals" directly below the "Practice Mode" item inside the "The Journey" section of the How to Play modal. Title only, no description paragraph — matching the user's request.

## File

`src/pages/Index.tsx` — inside the `Dialog` for `showHowTo`, after the `Practice Mode` block (around line 1285).

## Change

Append a new `<div>` after the Practice Mode block:

```tsx
<div>
  <p className="font-medium text-foreground mb-1">Practice Goals</p>
</div>
```

No other styling, copy, or layout changes.
