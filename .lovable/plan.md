Update FIFA flag roster for tomorrow

- Replace the 7 entries in `currentDayFlags` (src/components/FifaOverlay.tsx) with the provided URLs:
  1. https://flagcdn.com/w320/jo.png (Jordan)
  2. https://flagcdn.com/w320/ar.png (Argentina)
  3. https://flagcdn.com/w320/gb-eng.png (England)
  4. https://flagcdn.com/w320/pa.png (Panama)
  5. https://flagcdn.com/w320/pt.png (Portugal)
  6. https://flagcdn.com/w320/hr.png (Croatia)
  7. https://flagcdn.com/w320/dz.png (Algeria)
- Keep existing object-position logic for `jo.png` (`object-left`), `qa.png` (`object-[30%_center]`), and `tr.png` (`object-[40%_center]`) unchanged.