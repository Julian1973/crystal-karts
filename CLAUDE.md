# CLAUDE.md — Crystal Karts

## Your role

You are working on the production Crystal Karts game for The Crystal Bears.

Treat the existing live game as the baseline product. Preserve behaviour and assets unless a change is explicitly requested.

## Canonical product goals

Crystal Karts should feel:
- fun and welcoming for children and families
- responsive on desktop and mobile
- visually coherent with The Crystal Bears 3D CGI world
- alive with vehicle sound, natural ambience and restrained character reactions
- easy to understand but capable of increasing challenge

## Known required improvements

1. Add difficulty selection: Easy / Standard / Hard.
2. Make AI behaviour scale sensibly with difficulty.
3. Restore / improve character reactions:
   - hit by obstacle: restrained “ouch”
   - driver hits obstacle: restrained “whoops”
   - another racer lands a successful hit: occasional character-specific laugh
   - guided crystal hit: reaction should correspond to the relevant racer
   - do not fire voice lines so frequently that they become annoying.
4. Ensure mobile includes the same important SFX / reaction system as desktop.
5. Tune mobile virtual joystick sensitivity.
6. Improve car FX and environmental ambience.
7. Improve collision behaviour and prevent obvious pass-through.
8. Ensure track scenery and 3D imagery sit naturally in the world rather than appearing pasted onto terrain.
9. Preserve Crystal Bears character canon and approved visual identity.
10. Keep public hosting independent of visibly branded ChatGPT URLs.

## Engineering principles

- Inspect before changing.
- Preserve the current game loop.
- Prefer small, testable commits.
- Do not silently replace major systems.
- Keep desktop and mobile controls separate where required, but share gameplay logic.
- Centralise audio event throttling so reactions remain expressive rather than noisy.
- Keep game tuning values configurable.
- Document asset provenance where possible.
- Never commit secrets.

## Migration rule

The original live ChatGPT Site project remains the fallback while this repository is being established.

Do not declare migration complete until:
- the source builds locally,
- gameplay parity has been checked,
- assets load correctly,
- mobile input works,
- audio works,
- a production deployment succeeds.

Read `docs/MIGRATION.md` before significant changes.
