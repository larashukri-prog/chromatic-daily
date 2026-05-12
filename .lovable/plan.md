## Goal

Center the "Not Quite" / "Perfect Recall" / "Game Over" / "Nice One!" titles in the result modal. They currently render left-aligned on `sm+` because shadcn's default `DialogHeader` applies `text-center sm:text-left`, which overrides the parent `text-center` on `DialogContent`.

## Change

**File:** `src/pages/Index.tsx` (around line 1296–1307)

Add `text-center` (and `sm:text-center` to override the shadcn default) on the `DialogHeader` of the result modal.

```tsx
<DialogHeader className="text-center sm:text-center items-center">
  <DialogTitle ...>...</DialogTitle>
  ...
</DialogHeader>
```

Scoped only to the result modal — the "How to Play" / info dialogs remain unchanged.
