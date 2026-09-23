# Crystal Karts

Crystal Karts is the 3D kart-racing game from **The Crystal Bears** universe.

## Status

This repository is the new canonical development home for Crystal Karts.

The current live build is still published from the ChatGPT Site project:

- Site slug: `crystal-bears-rally`
- Live URL: https://crystal-bears-rally.jenko1973.chatgpt.site
- Last identified Site source version: 29

The live build must be preserved during migration. Do not replace functionality with a simplified rewrite.

## Product direction

Crystal Karts is a family-friendly, character-led 3D kart racer featuring Crystal Bears characters and crystal-powered gameplay.

Current priorities include:

- Easy / Standard / Hard difficulty modes
- stronger AI racing behaviour
- character-specific hit reactions and laughter without becoming repetitive
- mobile audio parity
- mobile joystick sensitivity tuning
- improved collision physics
- crystal powers and guided-crystal hit reactions
- 3D scenery integrated naturally into each landscape
- richer vehicle FX, ambience and environmental audio
- winner / podium sequences
- multiple tracks and tour modes
- Crystal Arcade / The Crystal Bears website integration
- removal of visible ChatGPT hosting from the public-facing experience

## Development rule

Preserve the existing playable build first. Improve it incrementally.

Do not:
- rebuild the game from scratch unless explicitly approved
- remove working features to simplify implementation
- change character identity or Crystal Bears brand canon
- commit secrets, API keys or private credentials

## Deployment direction

The intended public destination is under The Crystal Bears brand, rather than a `chatgpt.site` URL.

Potential target structure:

- `thecrystalbears.com/crystal-arcade`
- `thecrystalbears.com/crystal-karts`

## Repository handover

This repository is intended to be workable from both Claude Code and Codex.

See `CLAUDE.md` and `docs/MIGRATION.md`.
