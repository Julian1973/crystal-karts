import {recordName,countryCode,countrySuggestion} from './arcade-records.js';
import {TRIAL_RULES,COURSE_LENGTHS,validResult,cleanProgress} from './trial-rules.js';
const q=(db,s,...a)=>db.prepare(s).bind(...a);
const reply=(data,status=200,cookie)=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
export async function challengeAPI(request,env){
 const url=new URL(request.url),action=url.pathname.split('/').pop(),db=env.DB;
 if(!db)return reply({error:'Saving is temporarily unavailable. You can still race.'},503);
 if(request.method!=='POST')return reply({error:'Use POST.'},405);
 if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return reply({error:'Invalid origin.'},403);
 const raw=await request.text();if(raw.length>12000)return reply({error:'Request too large.'},413);
 let b;try{b=JSON.parse(raw)}catch{return reply({error:'Invalid request.'},400);}
 try{
 if(action==='country')return reply({country:countrySuggestion(request)});
 if(action==='board'){
  if(!COURSE_LENGTHS[b.track])return reply({error:'Choose a course.'},400);
  const records=await q(db,'SELECT r.name,r.country,r.ms,c.bear,r.challenge FROM kart_arcade_records r JOIN kart_challenges c ON c.id=r.challenge WHERE r.track=? AND r.rules=? AND r.listed=1 ORDER BY r.ms ASC,r.updated ASC,r.challenge ASC LIMIT 20',b.track,TRIAL_RULES).all();
  return reply({records:records.results});
 }
 if(action==='read'){
  if(!/^[a-f0-9-]{36}$/.test(b.id||''))return reply({error:'Challenge not found.'},404);
  const result=await q(db,'SELECT c.id,c.track,c.bear,c.ms,c.rules,r.name,r.country FROM kart_challenges c LEFT JOIN kart_arcade_records r ON r.challenge=c.id AND r.listed=1 WHERE c.id=?',b.id).first();
  return result?reply(result):reply({error:'Challenge not found.'},404);
 }
 // Anonymous, browser-bound guest save. This is not a player sign-in account.
 let token=request.headers.get('cookie')?.match(/(?:^|; )kart_guest=([a-f0-9]{64})(?:;|$)/)?.[1],cookie;
 if(!token){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');cookie='kart_guest='+token+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=31536000';}
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');
 await q(db,"INSERT OR IGNORE INTO kart_guests(id,progress) VALUES(?,'{}')",digest).run();
 const done=(data,status=200)=>reply(data,status,cookie),now=Date.now();
 if(action==='record-info'){
  const owned=await q(db,'SELECT c.track,c.rules FROM kart_challenges c WHERE c.id=? AND (EXISTS(SELECT 1 FROM kart_bests b WHERE b.guest=? AND b.challenge=c.id) OR EXISTS(SELECT 1 FROM kart_arcade_records r WHERE r.guest=? AND r.challenge=c.id))',b.id||'',digest,digest).first();
  if(!owned)return done({error:'Finish a time trial on this browser first.'},403);
  const record=await q(db,'SELECT name,country,listed,challenge FROM kart_arcade_records WHERE guest=? AND track=? AND rules=?',digest,owned.track,owned.rules).first();
  return done({record:record||null,suggestedCountry:countrySuggestion(request)});
 }
 if(action==='record'){
  const name=recordName(b.name),country=countryCode(b.country);
  if(!name)return done({error:'Use 1–12 letters or numbers for friendly initials or a nickname. Start with a letter; no spaces or contact details.'},400);
  if(b.country!==''&&!country)return done({error:'Choose a country or leave it hidden.'},400);
  if(typeof b.listed!=='boolean')return done({error:'Choose whether to show this time on the board.'},400);
  const own=await q(db,'SELECT c.track,c.rules,c.ms FROM kart_challenges c WHERE c.id=? AND (EXISTS(SELECT 1 FROM kart_bests b WHERE b.guest=? AND b.challenge=c.id) OR EXISTS(SELECT 1 FROM kart_arcade_records r WHERE r.guest=? AND r.challenge=c.id))',b.id||'',digest,digest).first();
  if(!own)return done({error:'Only your saved best from this browser can be recorded.'},403);
  await q(db,'INSERT INTO kart_arcade_records(guest,track,rules,challenge,name,country,listed,ms,updated) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(guest,track,rules) DO UPDATE SET challenge=excluded.challenge,name=excluded.name,country=excluded.country,listed=excluded.listed,ms=excluded.ms,updated=excluded.updated',digest,own.track,own.rules,b.id,name,country,b.listed?1:0,own.ms,now).run();
  return done({name,country,listed:b.listed});
 }
 if(action==='remove-record'){
  if(!COURSE_LENGTHS[b.track])return done({error:'Choose a course.'},400);
  await q(db,'DELETE FROM kart_arcade_records WHERE guest=? AND track=? AND rules=?',digest,b.track,TRIAL_RULES).run();return done({removed:true});
 }
 if(action==='progress'){
  if(b.progress){const old=JSON.parse((await q(db,'SELECT progress FROM kart_guests WHERE id=?',digest).first()).progress);const progress=cleanProgress({earned:[...(old.earned||[]),...cleanProgress(b.progress).earned]});await q(db,'UPDATE kart_guests SET progress=? WHERE id=?',JSON.stringify(progress),digest).run();}
  const saved=await q(db,'SELECT progress FROM kart_guests WHERE id=?',digest).first();
  const best=await q(db,'SELECT track,bear,ms,challenge FROM kart_bests WHERE guest=? AND rules=?',digest,TRIAL_RULES).all();
  const records=await q(db,'SELECT track,name,country,listed,challenge,ms FROM kart_arcade_records WHERE guest=? AND rules=?',digest,TRIAL_RULES).all();
  return done({progress:JSON.parse(saved.progress),best:best.results,records:records.results});
 }
 if(action==='start'){
  if(!COURSE_LENGTHS[b.track]||b.rules!==TRIAL_RULES||!Number.isInteger(b.bear)||b.bear<0||b.bear>8)return done({error:'Choose a current time trial.'},400);
  const old=await q(db,'SELECT started FROM kart_attempts WHERE guest=?',digest).first();
  if(old&&now-old.started<3000)return done({error:'Wait a moment before restarting.'},429);
  const id=crypto.randomUUID();
  await q(db,'INSERT INTO kart_attempts(guest,id,track,bear,started) VALUES(?,?,?,?,?) ON CONFLICT(guest) DO UPDATE SET id=excluded.id,track=excluded.track,bear=excluded.bear,started=excluded.started',digest,id,b.track,b.bear,now).run();
  return done({attempt:id});
 }
 if(action==='finish'){
  const attempt=await q(db,'SELECT * FROM kart_attempts WHERE guest=? AND id=?',digest,b.attempt||'').first();
  if(!attempt||!validResult(b)||attempt.track!==b.track||attempt.bear!==b.bear||now-attempt.started<b.ms-1500||now-attempt.started>b.ms+60000)return done({error:'This run could not be saved as a challenge. Please try a fresh time trial.'},400);
  // One submission per issued attempt; client runs remain personal, not verified rankings.
  const removed=await q(db,'DELETE FROM kart_attempts WHERE guest=? AND id=?',digest,b.attempt).run();if(!removed.meta.changes)return done({error:'This attempt has already been saved.'},409);
  const existing=await q(db,'SELECT ms,challenge FROM kart_bests WHERE guest=? AND track=? AND rules=?',digest,b.track,TRIAL_RULES).first();
  if(existing&&existing.ms<=b.ms)return done({id:existing.challenge,ms:existing.ms,newBest:false});
  const id=crypto.randomUUID();
  await db.batch([q(db,'INSERT INTO kart_challenges(id,track,bear,ms,rules) VALUES(?,?,?,?,?)',id,b.track,b.bear,b.ms,TRIAL_RULES),q(db,'INSERT INTO kart_bests(guest,track,rules,bear,ms,challenge) VALUES(?,?,?,?,?,?) ON CONFLICT(guest,track,rules) DO UPDATE SET bear=excluded.bear,ms=excluded.ms,challenge=excluded.challenge WHERE excluded.ms<kart_bests.ms',digest,b.track,TRIAL_RULES,b.bear,b.ms,id)]);
  return done({id,ms:b.ms,newBest:true});
 }
 return done({error:'Unknown action.'},404);
 }catch(e){console.error('Challenge storage failed',e.message);return reply({error:'Saving is unavailable. Your local progress is still here.'},503);}
}
