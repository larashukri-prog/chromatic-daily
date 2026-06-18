Update the flag `objectPosition` logic in `src/components/FifaOverlay.tsx` to treat both `jo.png` and `qa.png` as left-aligned.

**Current logic (line 116):**
```ts
const objectPosition = entry.url.includes('jo.png') ? 'object-left' : 'object-center';
```

**Updated logic:**
```ts
const objectPosition = (entry.url.includes('jo.png') || entry.url.includes('qa.png')) ? 'object-left' : 'object-center';
```

All other flags remain `object-center`. No other changes needed.