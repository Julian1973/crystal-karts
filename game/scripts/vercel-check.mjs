// Vercel build step: nothing to compile (the client is plain ES modules in public/);
// fail the deploy early if the API entry point or its migrations are missing.
import {readdir} from 'node:fs/promises';
const handler=await import('../api/handler.js');
if(typeof handler.POST!=='function')throw Error('api/handler.js must export POST');
const migrations=(await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql'));
if(!migrations.length)throw Error('No database migrations found in drizzle/');
if(!process.env.TURSO_DATABASE_URL)console.warn('TURSO_DATABASE_URL is not set: the game will load, but online rooms, challenges and leaderboards stay offline until Turso is connected.');
console.log('Crystal Karts: static client in public/, API in api/handler.js, '+migrations.length+' migrations ready.');
