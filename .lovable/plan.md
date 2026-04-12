

## Make "How to Play" Modal Scrollable

### Problem
The "How to Play" dialog content overflows the viewport on smaller screens, and the content is not scrollable.

### Solution
Wrap the content `div` (line 942) inside a `ScrollArea` component with a max height, making the modal content scrollable when it exceeds the available space.

### File: `src/pages/Index.tsx`

1. Add `ScrollArea` to imports from `@/components/ui/scroll-area`
2. Wrap the content div (lines 942-1003) in `<ScrollArea className="max-h-[60vh]">` so it scrolls on smaller viewports
3. Add `max-h-[85vh] overflow-hidden` to `DialogContent` (line 937) to constrain the dialog itself

After implementing, I'll take a screenshot of the modal for you to preview.

