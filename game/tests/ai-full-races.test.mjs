import assert from 'node:assert/strict';
import test from 'node:test';
import {makeTrack} from '../public/tracks.js';
import {DIFFICULTIES} from '../public/difficulty.js';
import {advance,solveContacts,wrapDelta} from '../public/physics.js';
import {rivalPlan,recoverStalledRival,racingLineLane,cornerSpeedLimit} from '../public/race-extras.js';
import {comebackBoost} from '../public/gameplay.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const scenarios=[['easy','wood'],['standard','moon'],['hard','wood']];

for(const [level,trackId] of scenarios)test(`${level} rivals complete three laps without repeated wall contact`,()=>{
 const track=makeTrack(trackId),d=DIFFICULTIES[level],cars=Array.from({length:9},(_,i)=>({ci:i,s:i===0?0:-5-i*4,lane:i===0?0:i%2?4:-4,speed:0,lateralSpeed:0,mass:1,base:26.8+(i%3)*.4,time:null,route:0,manual:false}));
 const rocks=[[.19,4],[.34,-4],[.49,1],[.67,5],[.84,-3]].map(([u,lane])=>({s:u*track.length,lane,halfWidth:1.55,halfLength:1.3,height:2.2}));
 const pads=[.13,.39,.66,.87].map((u,i)=>({s:u*track.length,lane:0,index:i}));
 const boxes=Array.from({length:9},(_,i)=>({s:(.055+i/9*.91)*track.length,lane:[-4,0,4][i%3],usedLap:-1}));
 const hits=new Map(cars.map(c=>[c,0])),lastHit=new Map(),finishTimes=new Map();let maxTime=240;
 for(let tick=0;tick<maxTime*30&&finishTimes.size<cars.length;tick++){
  const now=tick/30;
  for(const c of cars){if(finishTimes.has(c))continue;const profile=[];
   for(let dist=-24;dist<d.lookahead;dist+=8){const a=track.frame(c.s+dist,0,c.route),b=track.frame(c.s+dist+8,0,c.route),ya=Math.atan2(a.t.x,a.t.z),yb=Math.atan2(b.t.x,b.t.z);profile.push({distance:dist+4,curvature:wrapDelta(yb-ya,Math.PI*2)/8});}
   const corner=profile.filter(x=>x.distance>-12&&x.distance<42).sort((a,b)=>Math.abs(b.curvature)-Math.abs(a.curvature))[0];
   c.aiRacingLane=racingLineLane(profile,d.lookahead);c.aiInsideLane=corner&&Math.abs(corner.curvature)>.006?Math.sign(corner.curvature)*5.8:null;
   const lap=Math.floor(c.s/track.length),objects=[...boxes.filter(p=>p.usedLap<lap),...pads.filter(p=>c.padLap?.[p.index]!==lap)].map(p=>({p,dist:wrapDelta(p.s-c.s,track.length)})).filter(x=>x.dist>4&&x.dist<d.lookahead).sort((a,b)=>a.dist-b.dist)[0];if(objects)c.aiRacingLane+=(objects.p.lane-c.aiRacingLane)*clamp(1-objects.dist/d.lookahead,.08,.68);
   const plan=rivalPlan(c,cars,rocks,track.length,wrapDelta,d.lookahead);c.passLane=plan.lane;
   const rank=1+cars.filter(o=>o.s>c.s).length,playerS=now*27.5,gap=c.s-playerS,rivalEase=gap>65?.94:gap< -65?1.025:1;let target=c.base*d.pace*rivalEase*(1+comebackBoost(rank,cars.length)*.35)+clamp((playerS-c.s)*.018,-2,3)+(c.boostTime>0?9:0);c.boostTime=Math.max(0,(c.boostTime||0)-1/30);if(corner&&corner.distance<34)target=Math.min(target,cornerSpeedLimit(corner.curvature));
   const wobble=d.mistake*Math.sin(now*1.65+c.ci*2.7);
   advance(c,1/30,Math.min(plan.cap,target),clamp((plan.lane+wobble-c.lane)*d.steer,-7,7),d.acceleration,1);
  }
  const carsOnTrack=cars.filter(c=>!finishTimes.has(c));
  solveContacts(carsOnTrack,rocks,track.length,(c,kind)=>{if(kind==='rock'||kind==='edge'){hits.set(c,hits.get(c)+1);const prior=lastHit.get(c);if(prior!==undefined&&now-prior<1.5)c.repeatedHits=(c.repeatedHits||0)+1;lastHit.set(c,now);}});
  for(const c of carsOnTrack){if(recoverStalledRival(c,1/30,rocks,carsOnTrack,track.length)){const f=track.frame(c.s);c.heading=Math.atan2(f.t.x,f.t.z)}const lap=Math.floor(c.s/track.length);for(const p of boxes)if(p.usedLap<lap&&Math.abs(wrapDelta(p.s-c.s,track.length))<2.3&&Math.abs(p.lane-c.lane)<2){p.usedLap=lap;c.powerCharge=Math.min(3,(c.powerCharge||0)+1)}for(const p of pads)if(c.padLap?.[p.index]!==lap&&c.s%track.length>=p.s&&c.lastPadProgress%track.length<p.s&&Math.abs(c.lane-p.lane)<3.4){c.padLap??={};c.padLap[p.index]=lap;c.boostTime=1.25}c.lastPadProgress=c.s;if(c.s>=track.length*3){c.time=now;finishTimes.set(c,now);}}
 }
 assert.equal(finishTimes.size,cars.length,`${level} race finishes with all nine racers (${cars.filter(c=>!finishTimes.has(c)).map(c=>`${c.ci}@${Math.round(c.s)}`).join(', ')})`);
 assert([...cars].every(c=>(c.repeatedHits||0)<6),`${level} rivals do not keep hitting walls: ${cars.map(c=>c.repeatedHits||0)}`);
 const times=[...finishTimes.values()].sort((a,b)=>a-b),spread=times.at(-1)-times[0];
 assert(spread<24,`${level} field remains reasonably close (spread ${spread.toFixed(1)}s)`);
 console.log(`RACE ${level.toUpperCase()} / ${trackId}: ${cars.length} finishers, ${spread.toFixed(1)}s spread, ${[...hits.values()].reduce((a,b)=>a+b,0)} wall/rock contacts`);
});
