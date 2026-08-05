Remove per-game result cards from Practice Mode

Streamline Practice Mode by eliminating the intermediate "Nice One / Next Level" and "Not Quite / Try Again" modal cards. Verification feedback still runs through existing ripple, shake, chime, vibration, and milestone confetti effects. After the verification animation finishes, practice rounds automatically advance without an abrupt stop.

## 1. Auto-advance in Practice Mode after verify

In `src/pages/Index.tsx`:

- In the freeplay branch of `verify()`, after the 1500ms verification resolves:
  - On correct: call the existing freeplay next-level helper (same logic currently triggered by the modal's "Next Level" button).
  - On incorrect: call the existing freeplay retry helper (same logic currently triggered by the modal's "Try Again" button).
- Skip setting `phase = 'result'` and `showResult = true` for freeplay; these states now drive only the daily result modal.
- Keep `result`, `isCorrect`, `sessionStats`, milestone confetti, chime, and vibration exactly as they are today.

## 2. Remove the freeplay-specific Result Modal content

In `src/pages/Index.tsx`:

- Render the existing result `Dialog` only when `!isFreeplay`.
- Remove the freeplay title and button branches inside the Dialog so the modal remains a daily-only component.

## 3. Preserve Practice Mode aggregate results

- Keep the top-right "Results" button that opens `SessionReport.tsx`.
- Leave `SessionReport.tsx` unchanged so users can still review aggregate practice stats when they choose.

## 4. Validation

- Run the TypeScript build/typecheck.
- Open `/practice`, complete a correct round and an incorrect round, and confirm that no result card appears and the next observation starts automatically.
- Confirm daily mode still shows its result modal as before.