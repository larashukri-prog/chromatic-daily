## Replace 3 Knicks visual-style images

Swap three of the Knicks PNGs with the newly uploaded ones, keeping the same hex-color mapping. No logic, no UI, no other assets touched.

### Replacements

| Slot (hex / color) | Old image | New image |
|---|---|---|
| `#2563EB` Blue | `mask_8.png` (jersey #23) | `Mask_group_10.png` (jersey #8) |
| `#F198C4` Pink | `mask_7.png` (#23 portrait) | `Mask_group_11.png` (new portrait) |
| `#FDE047` Yellow | `mask_3.png` (KNICKS wordmark roundel) | `Vector.png` (ANUNOBY roundel) |

### Steps

1. Upload the 3 user files to Lovable Assets CDN with stable filenames:
   - `/mnt/user-uploads/Mask_group_10.png` → `src/assets/knicks/jersey_8.png.asset.json`
   - `/mnt/user-uploads/Mask_group_11.png` → `src/assets/knicks/portrait_anunoby.png.asset.json`
   - `/mnt/user-uploads/Vector.png` → `src/assets/knicks/roundel_anunoby.png.asset.json`
2. Update `src/components/KnicksOverlay.tsx`:
   - Replace imports for `mask_3`, `mask_7`, `mask_8` with the three new asset JSONs.
   - Update the `KNICKS_IMAGE_FOR_HEX` entries for `#FDE047`, `#F198C4`, `#2563EB` and refresh inline comments.
3. Delete the three now-unused asset pointers via `assets--delete_asset`:
   - `src/assets/knicks/mask_3.png.asset.json`
   - `src/assets/knicks/mask_7.png.asset.json`
   - `src/assets/knicks/mask_8.png.asset.json`
4. Verify by viewing the preview on a day that surfaces these colors (or via Practice).

Nothing else (game logic, other 6 Knicks images, anchors, share text) changes.
