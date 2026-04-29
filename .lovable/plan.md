## Practice Mode: Share via WhatsApp

Update the "Share Results" button in the Practice session report so it opens WhatsApp with the prefilled session summary, matching how the daily-mode WhatsApp share already works.

### Changes

**`src/pages/Index.tsx`**

Rewrite `shareSession` (line 769) to open WhatsApp instead of writing to clipboard:

```ts
const shareSession = useCallback(() => {
  const peak = sessionStats.bestSpeed > 0 ? `${sessionStats.bestSpeed.toFixed(2)}s` : '—';
  const text = `Chromatic Practice Results ⚡️\nTotal Rounds: ${sessionStats.roundsPlayed}\nLongest Streak: ${sessionStats.longestStreak}\nPeak Speed: ${peak}\n\nHow many rounds can you handle? https://chromatic-daily.lovable.app`;
  const encoded = encodeURIComponent(text);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const url = isMobile ? `whatsapp://send?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}, [sessionStats]);
```

Drop the `setSessionCopied` calls — no clipboard step anymore. The `sessionCopied` state and `copied` prop pass-through to `SessionReport` can stay (harmless) or be removed; simplest is to leave them but always pass `copied={false}` so the button label stays "Share Results".

**`src/components/SessionReport.tsx`**

Swap the WhatsApp-style label/icon on the share button. Replace the copied/Share toggle:

```tsx
<Button onClick={onShare} variant="outline" className="w-full rounded-xl h-10 text-sm gap-2">
  <Share2 className="w-4 h-4" /> Share on WhatsApp
</Button>
```

The `copied` prop and `Check` import become unused and can be removed.

### Notes

- Reuses the exact mobile-vs-desktop URL pattern from `shareWhatsApp` (line 659) for consistency.
- Text content stays identical to the previously approved practice share format.
- No game-state, layout, or analytics changes.
