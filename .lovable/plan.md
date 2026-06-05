### Replace mask_7.png (Pink tile portrait) with the new upload

Re-upload `user-uploads://Mask_group_9.png` and overwrite the existing pointer at `src/assets/knicks/mask_7.png.asset.json`.

### Steps
1. Run `lovable-assets create --file /mnt/user-uploads/Mask_group_9.png --filename mask_7.png > src/assets/knicks/mask_7.png.asset.json`.

No code changes — `KnicksOverlay.tsx` continues importing the same JSON pointer, which now resolves to the new portrait image. The Pink (`#F198C4`) tile will display the updated portrait.
