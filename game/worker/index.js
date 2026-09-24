import {challengeAPI} from './challenges.js';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const getDB=env=>{if(!env.DB)fail('Online rooms are temporarily unavailable.',503);return env.DB};
const stmt=(db,sql,...args)=>db.prepare(sql).bind(...args);
const validBear=n=>Number.isInteger(n)&&n>=0&&n<9;
const cleanInput=i=>({throttle:!!i?.throttle,brake:!!i?.brake,left:!!i?.left,right:!!i?.right,drift:!!i?.drift,skill:Number.isSafeInteger(i?.skill)?i.skill:0,recover:Number.isSafeInteger(i?.recover)?i.recover:0});
export default {async fetch(request,env){
 const url=new URL(request.url);if(url.pathname.startsWith('/api/challenge/'))return challengeAPI(request,env);if(!url.pathname.startsWith('/api/')){const asset=await env.ASSETS.fetch(request);const response=new Response(asset.body,asset);if(/\.(js|css|html)$/.test(url.pathname)||url.pathname.endsWith('/'))response.headers.set('Cache-Control','no-store');return response;}
 if(request.method!=='POST')return json({error:'Use POST.'},405);
 try{
  if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)fail('Invalid request origin.',403);
  const raw=await request.text();if(raw.length>24000)fail('Request too large.',413);
  let b;try{b=JSON.parse(raw)}catch{fail('Invalid request.')}
  const db=getDB(env),now=Date.now(),action=url.pathname.split('/').pop();
  if(action==='create'){
   if(!validBear(b.bear))fail('Choose a bear.');if(b.track&&!['wood','river','honey','moon','coast','night','rose','blossom','zen','cove','showcase'].includes(b.track))fail('Choose a track.');
   const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[v%31]).join(''),token=crypto.randomUUID();
   await db.batch([stmt(db,'DELETE FROM race_members WHERE room IN (SELECT code FROM race_rooms WHERE expires < ?)',now),stmt(db,'DELETE FROM race_rooms WHERE expires < ?',now),stmt(db,'INSERT INTO race_rooms(code,host,phase,updated,expires,track) VALUES(?,?,?,?,?,?)',code,token,'lobby',now,now+3600000,b.track||'wood'),stmt(db,'INSERT INTO race_members(token,room,bear,ready,input,seen) VALUES(?,?,?,?,?,?)',token,code,b.bear,1,'{}',now)]);
   return json({code,token,host:true});
  }
  const code=String(b.code||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))fail('Enter the six-character room code.');
  let room=await stmt(db,'SELECT * FROM race_rooms WHERE code=? AND expires>?',code,now).first();
  if(!room)fail('Room not found or expired.',404);
  if(room.phase==='closed'||now-room.updated>60000)fail('The host has disconnected. Create a new room.',410);
  if(action==='join'){if((b.track||'wood')!==room.track)fail('Choose '+({wood:'Whisper Wood',river:'Crystal River Run',honey:'Honey Hill Circuit',moon:'Moonlight Pool',coast:'Crystal Coast',night:'Starlight Forest Run',rose:'Aida’s Rose Garden',blossom:'Amie’s Blossom Trail',zen:'Zenny’s Lotus Gardens',cove:'Crystal Cove Grand Tour',showcase:'Crystal Bears Showcase'}[room.track]||'Whisper Wood')+' in the garage, then join this room.',409);
   if(room.phase!=='lobby')fail('This race has already started.');if(!validBear(b.bear))fail('Choose a bear.');
   const token=crypto.randomUUID();
   const result=await stmt(db,"INSERT OR IGNORE INTO race_members(token,room,bear,ready,input,seen) SELECT ?,?,?,0,'{}',? WHERE (SELECT COUNT(*) FROM race_members WHERE room=?)<9 AND EXISTS(SELECT 1 FROM race_rooms WHERE code=? AND phase='lobby')",token,code,b.bear,now,code,code).run();
   if(!result.meta.changes)fail('That bear is taken, or the room is full. Choose another bear.');
   return json({code,token,host:false});
  }
  if(typeof b.token!=='string')fail('Rejoin this room.',403);
  const member=await stmt(db,'SELECT * FROM race_members WHERE token=? AND room=?',b.token,code).first();if(!member)fail('Rejoin this room.',403);
  const host=room.host===b.token;
  if(action==='leave'){
   if(host)await stmt(db,"UPDATE race_rooms SET phase='closed' WHERE code=?",code).run();
   await stmt(db,'DELETE FROM race_members WHERE token=?',b.token).run();return json({left:true});
  }
  if(action==='ready')await stmt(db,'UPDATE race_members SET ready=?,seen=? WHERE token=?',b.ready?1:0,now,b.token).run();
  if(action==='start'){
   if(!host)fail('Only the host can start.',403);
   const result=await stmt(db,"UPDATE race_rooms SET phase='racing',snapshot=NULL,updated=? WHERE code=? AND phase='lobby' AND (SELECT COUNT(*) FROM race_members WHERE room=? AND seen>?)>=2 AND NOT EXISTS(SELECT 1 FROM race_members WHERE room=? AND (ready=0 OR seen<?))",now,code,code,now-30000,code,now-30000).run();
   if(!result.meta.changes)fail('At least two racers must be connected and ready.');
  }
  if(action==='sync'){
   await stmt(db,'UPDATE race_members SET input=?,seen=? WHERE token=?',JSON.stringify(cleanInput(b.input)),now,b.token).run();
   if(host){
    const snapshot=b.snapshot;
    if(snapshot&&room.phase==='racing'){
     if(!Array.isArray(snapshot.racers)||snapshot.racers.length!==9||!Number.isFinite(snapshot.elapsed))fail('Invalid race state.');
     await stmt(db,'UPDATE race_rooms SET snapshot=?,updated=?,expires=? WHERE code=?',JSON.stringify(snapshot),now,now+3600000,code).run();
    }else await stmt(db,'UPDATE race_rooms SET updated=?,expires=? WHERE code=?',now,now+3600000,code).run();
    if(room.phase==='lobby')await stmt(db,'DELETE FROM race_members WHERE room=? AND token<>? AND seen<?',code,b.token,now-45000).run();
   }
  }
  room=await stmt(db,'SELECT * FROM race_rooms WHERE code=?',code).first();
  const rows=(await stmt(db,'SELECT bear,ready,input,seen,token=? AS host FROM race_members WHERE room=? ORDER BY host DESC,bear',room.host,code).all()).results;
  return json({track:room.track,phase:room.phase,updated:room.updated,members:rows.map(r=>({bear:r.bear,ready:!!r.ready,host:!!r.host,connected:now-r.seen<30000,input:now-r.seen<1500?JSON.parse(r.input):cleanInput({})})),snapshot:host?null:room.snapshot?JSON.parse(room.snapshot):null});
 }catch(e){if(!e.status)console.error('Room service error',e.message);return json({error:e.status?e.message:'Online rooms are unavailable. Please try again.'},e.status||503);}
}};
