# Crystal Karts migration

## Source system

The existing public game is currently associated with the ChatGPT Site project:

- project/site slug: `crystal-bears-rally`
- live URL: `https://crystal-bears-rally.jenko1973.chatgpt.site`
- last identified source version: 29

The goal is to move the maintainable source into this GitHub repository without breaking the existing live game.

## Migration stages

### 1. Preserve
Obtain the latest editable source/export of the current Site build.

Do not migrate from screenshots or rebuild from memory if editable source is available.

### 2. Inventory
Record:
- framework / runtime
- source files
- dependencies
- game assets
- audio assets
- fonts
- 3D models
- environment assets
- configuration
- deployment assumptions

### 3. Clean repository
Exclude:
- generated build folders
- dependency folders
- credentials
- temporary exports
- local caches

Large binary assets may require Git LFS or a dedicated asset host.

### 4. Baseline
Get the unmodified game running from this repository first.

Tag that working baseline before substantial gameplay changes.

### 5. Improve
Apply the agreed Crystal Karts improvements after parity is established.

### 6. Deploy
Move production hosting away from a visibly branded ChatGPT URL and integrate with The Crystal Bears / Crystal Arcade web experience. Target: Vercel + Turso — setup steps in `docs/VERCEL.md`.

## Acceptance gate

Migration is only complete when the GitHub version can reproduce the playable experience with no material regression in:

- controls
- AI racers
- track rendering
- collisions
- crystal systems
- character identity
- audio
- mobile usability
- winner / race-end flow
