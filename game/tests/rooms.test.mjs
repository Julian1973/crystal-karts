import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import worker from '../worker/index.js';
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')))sql.exec(readFileSync('drizzle/'+f,'utf8'));
const DB={prepare(query){return {bind(...args){return {async first(){return sql.prepare(query).get(...args)},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return {meta:sql.prepare(query).run(...args)}}}}}},async batch(items){return Promise.all(items.map(i=>i.run()))}};
const call=async(action,body,status=200)=>{const res=await worker.fetch(new Request('https://race.test/api/'+action,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://race.test'},body:JSON.stringify(body)}),{DB});const d=await res.json();assert.equal(res.status,status,JSON.stringify(d));return d;};
const host=await call('create',{bear:0});assert.match(host.code,/^[A-Z2-9]{6}$/);
const guest=await call('join',{code:host.code,bear:1});
await call('join',{code:host.code,bear:1},400);
await call('sync',{code:host.code,token:'wrong'},403);
await call('start',guest,403);await call('start',host,400);
await call('ready',{...guest,ready:true});await call('start',host);
await call('join',{code:host.code,bear:2},400);
await call('sync',{...guest,input:{throttle:true,right:true,skill:1}});
const h=await call('sync',host);assert(h.members.find(m=>m.bear===1).input.throttle);assert(!JSON.stringify(h).includes(guest.token),'tokens never disclosed');
const snapshot={mode:'racing',elapsed:3,racers:Array.from({length:9},(_,ci)=>({ci,s:ci*10})),weather:{rain:1},pickups:[0]};
await call('sync',{...host,snapshot});const g=await call('sync',guest);assert.deepEqual(g.snapshot,snapshot,'separate clients share authoritative race');
await call('sync',{...guest,snapshot:{...snapshot,elapsed:999}});assert.equal((await call('sync',guest)).snapshot.elapsed,3,'guest cannot replace race state');
sql.prepare('UPDATE race_members SET seen=? WHERE token=?').run(Date.now()-2000,guest.token);assert(!(await call('sync',host)).members.find(m=>m.bear===1).input.throttle,'stale controls release');
await call('leave',host);await call('sync',guest,410);
const full=await call('create',{bear:0});for(let bear=1;bear<9;bear++)await call('join',{code:full.code,bear});await call('join',{code:full.code,bear:0},400);
console.log('Passed: independent room clients, unique bears, readiness, host-only start/state, input relay, shared snapshots, stale control release, capacity and host disconnect.');

const river=await call('create',{bear:0,track:'river'});await call('join',{code:river.code,bear:1,track:'wood'},409);const riverGuest=await call('join',{code:river.code,bear:1,track:'river'});assert.equal((await call('sync',riverGuest)).track,'river');

for(const track of ['honey','moon','coast','night']){const h=await call('create',{bear:0,track});const g=await call('join',{code:h.code,bear:1,track});assert.equal((await call('sync',g)).track,track);await call('leave',h);}
