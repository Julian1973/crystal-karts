# Crystal Bears — 3D Game Model Set (v1, 10 Sept 2026)

Nine characters, three detail levels each, built from the locked turnaround sheets in
Google Drive → *The Crystal Bears Final* → each character's *Character* folder.

Cast: Aida, Sunny, Luna, Misty, Amie, Howey, Keen, Fuzzby, Zenny.

## The three levels

| Level | Triangles | Textures | Use in Crystal Cove (Unity) | Files |
|---|---|---|---|---|
| **Hero** | ~500,000 | 4K base colour + metallic/roughness + normal (PBR) | Cinematics, cut-scenes, close-ups, marketing renders, print/toy reference | `<Name>_Hero.glb` (Draco-compressed) |
| **Gameplay** | 50,000 | 2K base colour, metallic, roughness, normal (baked from Hero) | The in-world player and NPC model on PC/console/high-end mobile | `<Name>_Gameplay.glb` + `.fbx` |
| **Companion** | 12,000 | 1K maps (baked from Hero) | Mobile, crowds, distant LOD, bear-companion UI, AR | `<Name>_Companion.glb` + `.fbx` |

All three levels of a character share the same shape and colours (the lower levels are
derived from the Hero, not generated separately), so LOD switching in-game is seamless.

## Scale and orientation

Every model is scaled to its canon height from the turnaround sheets, feet on the ground
at origin, facing −Z (glTF) / standard Unity forward after import:

Aida 1.52 m (5'0") · Sunny 1.27 m (4'2") · Luna 1.37 m (4'6") · Misty 1.65 m (5'5") ·
Amie 1.17 m (3'10") · Howey 1.78 m (5'10") · Keen 1.45 m (4'9") · Fuzzby 0.36 m (1'2") · Zenny 0.30 m (1'0")

So the cast lines up at the correct relative sizes the moment they're dropped in a scene.

## Importing into Unity

- **GLB** — install *glTFast* (Unity Package Manager → Add package by name → `com.unity.cloud.gltfast`).
  Drag the `.glb` into the Project window; the Draco Hero files need the *Draco for Unity* package too
  (`com.unity.cloud.draco`). Materials come in as URP/HDRP Lit with all maps wired.
- **FBX** — native. Drag in, then in the importer's *Materials* tab click *Extract Textures* and
  *Extract Materials* so the embedded JPEGs become editable assets.
- Rigging: the models are static meshes (no skeleton). Auto-rig with Mixamo (upload the Gameplay FBX),
  Unity's *Animation Rigging*, or hand them to an animator; the Companion level is light enough for mobile skinning.

## What is NOT in this set

- No rig / skeleton / blendshapes yet (next step).
- Squeeky and Keen's Mum were excluded by request.
- Aida's Crystal Call remains an open canon issue (unrelated to geometry; noted so nobody bakes it into art).

## Provenance

- Source: character reference sheets (front / back / left / right) from the Drive folder above,
  backgrounds removed, labels stripped.
- Generation: Hunyuan 3D v3.1 Pro (multi-view, PBR) on fal.ai, one generation per character.
- Retopology, UVs, texture baking, scaling and export: Blender 5.0, headless.
- Cost of generation: ≈ £0.65 per character.

Each character's `<Name>_review.jpg` shows all three levels from four angles for sign-off.
