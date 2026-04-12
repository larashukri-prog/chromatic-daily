

## Make "Persistence:" and "Success:" Labels Visually Consistent

### Problem
Both labels already have identical CSS classes (`font-bold text-foreground`), but "Persistence:" appears visually thicker. This is likely a perceptual difference due to the word itself. Switching both to `font-semibold` should make them appear more uniform.

### Change
In `src/pages/Index.tsx` (lines 980–981), change `font-bold` to `font-semibold` on both spans to ensure consistent visual weight.

