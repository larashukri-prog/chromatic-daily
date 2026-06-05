## Replace the two latest Knicks PNGs with the new uploads

The new uploads have correct transparent padding so the orange circle will sit centered inside the tile like the other Knicks images.

### Steps

1. Upload `user-uploads://Mask_group_7-2.png` via `lovable-assets create --file /mnt/user-uploads/Mask_group_7-2.png --filename mask_7.png` and overwrite `src/assets/knicks/mask_7.png.asset.json` with the new pointer (portrait).
2. Upload `user-uploads://Screen_Shot_2026-06-05_at_10.28.14_AM_1.png` via `lovable-assets create --file /mnt/user-uploads/Screen_Shot_2026-06-05_at_10.28.14_AM_1.png --filename mask_8.png` and overwrite `src/assets/knicks/mask_8.png.asset.json` (jersey 23).

No code changes — `KnicksOverlay.tsx` continues importing the same JSON pointers, which now resolve to the corrected images.
