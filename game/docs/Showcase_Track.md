# Crystal Bears Showcase

Playable course: `?track=showcase&step=track`.

The showcase now loads the user's Meshy scenery exports with their embedded textures. Six reusable assets replace the original procedural landmarks and verge props: Great Oak, Lush Canopy Tree v2, Bee Tree Cottage, Woodland Flowers, Rose Quartz Cluster and Mossy Quartz Boulder. The 871-unit racing surface and lighting remain engine-built. The mixed procedural scenery, waterfall, deck, cloud blobs and flower dots have been removed from the showcase. The road and continuous banks use the supplied trail and ground textures. Existing driving, powers and racers are reused. The ten-race cup remains unchanged; the showcase is an additional standalone course with online and time-trial support.

## Reference authority

Authoritative folder: https://drive.google.com/drive/folders/1PPbuIuTAeMKHJbNNDHzsalB_z8Sneb-Y

References inspected for this implementation:

- Great Oak glowing canopy: https://drive.google.com/file/d/1rzWN5o26OrFBVKL9_rHUEd0Z_L1pbMAK/view
- Bee cottage in ancient tree: https://drive.google.com/file/d/1IcXtOeF3VlzOt2bmzZMfvQD6nmP6XaJI/view

The connecting geography is a game adaptation. This is a first playable showcase, not an assertion of final cinematic asset fidelity. No external model-generation job or Meshy spend was initiated.

## Assembly

`public/showcase.js` builds continuous ground banks and applies the supplied ground and trail textures. `public/meshy-scenery.js` loads the six GLBs and places repeated scenery as instanced meshes under `meshy-showcase-assets`. Models are normalised from their actual scene bounds to centre-ground pivots. Landmarks sit at woodland-floor height beside the track; the banks slope down from the racing surface. Track length is registered in both client and server timing rules. A failed scenery load blocks the race and exposes Retry.

Meshy source folder: https://drive.google.com/drive/folders/1g_TUMmzDaiv5H4EyKI7v2eZfyX9d-BGE

Source IDs: oak archive `1atRD5qeg-OdXYYBmXF7-dUD7Ksm_eIHK`; canopy `1FpOnOt0zJjbu8xnPVDRjk1mM1mqJE4JV`; bee cottage `1JPiulQEUDIu57Bzr2GaALOw8WF_QGsh0`; flowers `1Q5V2GjZBRtwSshIK8rl5cwVSKlKxQSAb`; crystals `1No37h2Ggeh5jd_x18xtj8-KjRGg20hku`; boulder `1AYFU4djwmKonJw-IIajbp-ZIBEnwunKh`. The supplied oak has sparse foliage; floating whole-tree canopy supplements have been removed. Ground texture `12h1IyT_pS-PvPh668pUrAQtgKvHknLG1`; trail texture `1MLZONojgK_DzxrLXfpeT87A7Yh_M81PA`. No new Meshy generation or spend.

## Validation

The scene integration test includes the showcase and the existing ten courses. It checks model loading, manual movement, pickups, scenery animation and race flow with a mocked browser renderer. It does not qualify GPU rendering or real-device frame rate.

A live browser inspection on 2026-09-15 failed before scene initialisation because the review browser reports GL_RENDERER=Disabled. The correction is not visually signed off; full CGI quality and physical-device frame rate remain unverified.

## Panoramic art and live race map

The showcase uses `crystal-valley-panorama.png` on the camera-centred sky sphere. The road, cars and near scenery stay 3D. The panorama is a single texture, has no collision or shadows, preserves its painted colour and dims during rain. The other ten courses retain their established skies.

Art provenance: built-in image generation using the authoritative Crystal Valley reference, Drive ID `17CjzoOHpfZ_YCKBx3trEQWWiccigPPjf`. Prompt: create a seamless 360-degree equirectangular 2:1 panorama in the reference's cinematic family CGI style, ground-level clearing, centred horizon, distant emerald woodland, rolling mountains, lavender/yellow flower meadows, rose quartz, turquoise river, peach-gold morning sky; no text, characters, vehicles, hearts, close foreground objects or road. Output: `public/assets/scenery/crystal-valley-panorama.png`. In-game seam and visual fidelity remain unverified because the review browser has WebGL disabled.

All courses now display a compact top-right map below the race buttons and above the thumb controls. Circuit and shortcut bounds determine its scale; the player has a larger lime marker with a white ring and rivals use character colours. A gold ring identifies a rival in the lead. The finish line and current lap remain visible. Map updates reuse the existing 10Hz HUD cadence and the track projection is cached. CSS uses safe-area offsets and reduces the map size on short and narrow screens. These are implementation checks, not real-device visual or performance sign-off.
