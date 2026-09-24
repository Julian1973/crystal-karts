import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import worker from '../worker/index.js';
import {recordName,countrySuggestion,countryCode,COUNTRIES} from '../public/arcade-records.js';
import {TRIAL_RULES,validResult,medal,targets} from '../public/trial-rules.js';
assert.equal(readFileSync('public/trial-rules.js','utf8'),readFileSync('worker/trial-rules.js','utf8'),'client and server use identical challenge rules');
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+f,'utf8'));
const DB={prepare(query){return {bind(...args){return {async first(){return sql.prepare(query).get(...args)},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return {meta:sql.prepare(query).run(...args)}}}}}},async batch(items){return Promise.all(items.map(i=>i.run()))}};
let clock=Date.now();const native=Date.now;Date.now=()=>clock;
const client=()=>({cookie:''}),a=client(),b=client();
async function call(who,action,data={},status=200,origin='https://race.test'){const res=await worker.fetch(new Request('https://race.test/api/challenge/'+action,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:who.cookie},body:JSON.stringify(data)}),{DB});if(res.headers.get('set-cookie'))who.cookie=res.headers.get('set-cookie').split(';')[0];const d=await res.json();assert.equal(res.status,status,JSON.stringify(d));return d;}
const start=async who=>call(who,'start',{track:'wood',bear:0,rules:TRIAL_RULES});
const result=(attempt,ms=180000)=>({attempt,track:'wood',bear:0,rules:TRIAL_RULES,ms,splits:Array.from({length:12},(_,i)=>Math.round(ms*(i+1)/12))});
try{
const ticket=await start(a);assert.match(a.cookie,/kart_guest=[a-f0-9]{64}/);
await call(b,'finish',result(ticket.attempt),400);await start(b);
await call(a,'finish',result(ticket.attempt,10),400);await call(a,'finish',result(ticket.attempt),400);
clock+=184000;const saved=await call(a,'finish',result(ticket.attempt));assert(saved.newBest);
await call(a,'finish',result(ticket.attempt),400);
const read=await call(b,'read',{id:saved.id});assert.equal(read.ms,180000);assert(!('guest' in read));assert(!('attempt' in read));
await call(a,'progress',{progress:{earned:['clean','racer:keen','<script>','clean']}});const own=await call(a,'progress');assert.deepEqual(own.progress.earned,['clean','racer:keen']);assert.equal(own.best.length,1);assert.equal((await call(b,'progress')).best.length,0);
const next=await start(a);clock+=194000;const slower=await call(a,'finish',result(next.attempt,190000));assert.equal(slower.id,saved.id);assert.equal(slower.ms,180000);assert(!slower.newBest);
await call(a,'progress',{},403,'https://unrelated.test');
assert.equal(new Set(COUNTRIES).size,249,'all ISO countries available');
assert.equal(recordName('JJJ'),'JJJ');assert.equal(recordName('Élodie'),'Élodie');assert.equal(recordName('Fuzzby_7'),'Fuzzby_7');
for(const invalid of ['Jane Smith','a@b.com','<script>','123456','fUcK','f_u_ck','reallylongnickname'])assert.equal(recordName(invalid),null,invalid);
assert.equal(countrySuggestion({cf:{country:'GB'}}),'GB');assert.equal(countrySuggestion({headers:new Headers({'cf-ipcountry':'US'})}),'','do not trust spoofable client country headers');assert.equal(countrySuggestion({cf:{country:'XX'}}),'');assert.equal(countryCode('zz'),'');
assert.equal((await call(a,'board',{track:'wood'})).records.length,0,'anonymous times are not automatically listed');
await call(b,'record',{id:saved.id,name:'BOB',country:'US',listed:true},403);
await call(a,'record',{id:saved.id,name:'JJJ',country:'GB',listed:false});
assert.equal((await call(b,'read',{id:saved.id})).name,null,'private nickname not disclosed in shared link');
assert.equal((await call(b,'board',{track:'wood'})).records.length,0);
assert.equal((await call(a,'progress')).records[0].name,'JJJ');
await call(a,'record',{id:saved.id,name:'JJJ',country:'GB',listed:true});
let board=await call(b,'board',{track:'wood'});assert.equal(board.records[0].name,'JJJ');assert.equal(board.records[0].country,'GB');assert(!('guest' in board.records[0]));
assert.equal((await call(b,'read',{id:saved.id})).name,'JJJ');
await call(a,'record',{id:saved.id,name:'Jules',country:'',listed:true});
board=await call(b,'board',{track:'wood'});assert.equal(board.records.length,1,'editing does not duplicate a score');assert.equal(board.records[0].country,'','country can be hidden');
await call(b,'remove-record',{track:'wood'});assert.equal((await call(b,'board',{track:'wood'})).records.length,1,'different guest cannot delete your entry');
await call(a,'record',{id:saved.id,name:'Jules',country:'ZZ',listed:true},400);
await call(a,'record',{id:saved.id,name:'<img>',country:'',listed:true},400);
await call(a,'record',{id:saved.id,name:'Jules',country:'',listed:'true'},400);
await call(a,'remove-record',{track:'wood'});assert.equal((await call(b,'board',{track:'wood'})).records.length,0);assert.equal((await call(b,'read',{id:saved.id})).name,null);

assert(!validResult({...result('x'),splits:Array(12).fill(100)}));
assert(!validResult({...result('x'),rules:'old'}));
for(const track of ['wood','cove']){const t=targets(track);assert.equal(medal(track,t.gold),'Gold');assert.equal(medal(track,t.gold+1),'Silver');assert.equal(medal(track,t.silver+1),'Bronze');assert.equal(medal(track,t.bronze+1),'');}
console.log('Passed: optional/private/public nickname records, hidden/corrected countries, ownership, edit/removal, browser guest isolation, checkpoint/timing bounds, single-use attempts, immutable challenge links, best-only updates, rule versions and medal thresholds.');
}finally{Date.now=native;}
