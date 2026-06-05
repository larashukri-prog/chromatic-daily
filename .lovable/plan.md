## Add 2 new Knicks PNGs and stop reuse on chromatic colors

We have 9 chromatic colors + 2 anchors (Black/White). Today, Pink and Blue reuse the orange/blue anchor PNGs. The two newly uploaded PNGs (player portrait, jersey "23") will take those slots so every chromatic color has a unique image, and the orange/blue anchor PNGs are used **only** for the Black/White anchors.

### Steps

1. Upload the two attached images as Lovable Assets:
   - `user-uploads://Mask_group_7.png` → `src/assets/knicks/mask_7.png.asset.json` (player portrait on orange bg)
   - `user-uploads://Mask_group_8.png` → `src/assets/knicks/mask_8.png.asset.json` (jersey "23" on orange bg)

2. Update `src/components/KnicksOverlay.tsx` `KNICKS_IMAGE_FOR_HEX`:
   - `#F198C4` (Pink) → new `mask_7` (player portrait)
   - `#2563EB` (Blue) → new `mask_8` (jersey 23)
   - `#000000` (Black anchor) → `anchorBlue.url` (unchanged)
   - `#FFFFFF` (White anchor) → `anchorOrange.url` (unchanged)
   - All other 7 chromatic mappings unchanged.

No other files change. No game logic or color palette changes.
