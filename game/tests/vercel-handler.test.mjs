// The Vercel Function must run the real worker unchanged against a real libSQL (Turso) database.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createClient} from '@libsql/client';
import {createHandler} from '../api/handler.js';
import {ensureSchema} from '../worker/libsql-d1.js';
import {TRIAL_RULES} from '../worker/trial-rules.js';

const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
assert.equal(config.outputDirectory,'public');assert.deepEqual(config.rewrites,[{source:'/api/:path*',destination:'/api/handler?__path=:path*'}]);
assert(config.functions['api/handler.js'].includeFiles.includes('drizzle'),'migrations ship with the function');

const client=createClient({url:':memory:'});
assert.equal((await ensureSchema(client)).length,4,'all migrations applied on first start');assert.equal((await ensureSchema(client)).length,0,'re-running is harmless');
const tables=(await client.execute("SELECT name FROM sqlite_master WHERE type='table'")).rows.map(r=>r[0]);for(const t of ['race_rooms','race_members','kart_guests','kart_attempts','kart_challenges','kart_bests','kart_arcade_records'])assert(tables.includes(t),t);

const handle=createHandler({makeClient:async()=>client});
let clock=Date.now();Date.now=()=>clock;
// Requests arrive exactly as Vercel delivers them after the rewrite.
async function call(path,body,status=200,cookie='',country=''){const res=await handle(new Request('https://karts.example/api/handler?__path='+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://karts.example',Cookie:cookie,...(country?{'x-vercel-ip-country':country}:{})},body:JSON.stringify(body)}));const d=await res.json();assert.equal(res.status,status,path+' '+JSON.stringify(d));return {d,cookie:res.headers.get('set-cookie')?.split(';')[0]||cookie};}

// Online rooms: create, join, ready, start, input relay, snapshots, capacity.
const host=(await call('create',{bear:0,track:'wood'})).d;assert.match(host.code,/^[A-Z2-9]{6}$/);
const guest=(await call('join',{code:host.code,bear:6,track:'wood'})).d;await call('join',{code:host.code,bear:6,track:'wood'},400);
await call('ready',{...guest,ready:true});await call('start',host);
await call('sync',{...guest,input:{throttle:true,left:true,skill:2}});
const h=(await call('sync',host)).d;const luna=h.members.find(m=>m.bear===6);assert(luna.input.throttle&&luna.input.left&&luna.input.skill===2,'phone/guest input reaches the host');assert.equal(h.phase,'racing');
const snapshot={mode:'racing',elapsed:4,racers:Array.from({length:9},(_,ci)=>({ci,s:ci*3}))};await call('sync',{...host,snapshot});assert.deepEqual((await call('sync',guest)).d.snapshot,snapshot,'guests receive the host race');
await call('leave',host);await call('sync',guest,410);

// Time trials, challenge links, leaderboard and the Vercel country header.
let a=await call('challenge/start',{track:'wood',bear:0,rules:TRIAL_RULES});assert.match(a.cookie,/kart_guest=[a-f0-9]{64}/,'guest cookie issued');
const ms=180000,result={attempt:a.d.attempt,track:'wood',bear:0,rules:TRIAL_RULES,ms,splits:Array.from({length:12},(_,i)=>Math.round(ms*(i+1)/12))};
clock+=184000;const saved=(await call('challenge/finish',result,200,a.cookie)).d;assert(saved.newBest);
assert.equal((await call('challenge/read',{id:saved.id})).d.ms,ms,'challenge link readable');
assert.equal((await call('challenge/country',{},200,'','GB')).d.country,'GB','country comes from x-vercel-ip-country');
await call('challenge/record',{id:saved.id,name:'LUNA',country:'GB',listed:true},200,a.cookie);
const board=(await call('challenge/board',{track:'wood'})).d.records;assert.equal(board[0].name,'LUNA');assert.equal(board[0].ms,ms);

// Without Turso configured the game still loads and the API explains itself.
const offline=createHandler({makeClient:async()=>null});const res=await offline(new Request('https://karts.example/api/handler?__path=create',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"bear":0}'}));assert.equal(res.status,503);
console.log('Vercel Function on libSQL: migrations, rooms, input relay, snapshots, time trials, challenge links, leaderboard, country header and offline fallback passed.');
