# Hosting Crystal Karts on Vercel

The game moves to Vercel with **no changes to how it plays**:

| Part | ChatGPT Sites (today) | Vercel |
|---|---|---|
| Game files (`game/public/`) | Site static assets | Vercel static hosting |
| Server (`game/worker/`: rooms, time trials, challenge links, leaderboards) | Worker | Vercel Function `game/api/handler.js` running the same worker code |
| Database | Cloudflare D1 | **Turso** (libSQL, same SQLite tables and queries) |
| Visitor country (leaderboard flag) | `request.cf.country` | `x-vercel-ip-country` header |

Tables are created automatically on the first API request (`drizzle/*.sql`, tracked in
`_crystal_migrations`), so there is no manual database step.

## One-time setup (about 10 minutes)

1. **Import the repo:** Vercel dashboard → *Add New… → Project* → import `Julian1973/crystal-karts`.
   - **Root Directory:** `game`
   - **Framework Preset:** Other (the rest comes from `game/vercel.json`)
   - Deploy. The game loads straight away; online rooms, challenges and leaderboards
     show as unavailable until step 2.
2. **Add the database:** in the new project → *Storage* (or *Integrations → Marketplace*) →
   **Turso** → create a database (pick the region nearest your players, e.g. London) →
   connect it to this project. This adds `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
3. **Redeploy** (*Deployments → … → Redeploy*). Online features are now live.
4. **Domain:** *Settings → Domains* → add e.g. `karts.thecrystalbears.com` and follow the
   DNS instructions. Then point the Crystal Arcade link at it.

Every pull request now gets its own **preview link**, which is the easiest way to play-test
a branch (including the next-level features) on real phones before merging.

## Things to know

- **Plan:** Vercel's free Hobby plan is for non-commercial use only. Crystal Karts is part of
  the Crystal Bears business, so use a **Pro** team for the production site.
- **Online rooms cost:** each racer in an online room calls the API about 10 times a second
  while racing (a 9-player race ≈ 90 calls/second). Fine for families and friends; if online
  play grows a lot, move rooms to a real-time service (e.g. WebSockets) to save usage.
- **Existing data:** leaderboards and guest saves in the ChatGPT Site's D1 database do not
  move automatically. The Vercel version starts with fresh boards unless that data is exported.
- **Fallback:** keep the ChatGPT Site live until the Vercel version has been played through
  on desktop and mobile (see `docs/MIGRATION.md`).

## Local check

```bash
cd game
node tests/vercel-handler.test.mjs   # runs the Vercel Function against a real libSQL database
node scripts/vercel-check.mjs        # the same check Vercel runs as its build step
```
