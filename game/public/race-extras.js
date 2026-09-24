// Pure race rules shared by local and remote drivers.
import {findRecoverySpot,wrapDelta} from './physics.js?v=76';
export const driftTier=charge=>charge>=2.6?3:charge>=1.8?2:charge>=.8?1:0;
export const driftBoost=charge=>[0,.8,1.5,2.2][driftTier(charge)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function racingLineLane(samples,lookahead=62){
 const bend=samples.filter(x=>x.distance>=-30&&x.distance<=lookahead&&Math.abs(x.curvature)>=.0025)
  .sort((a,b)=>Math.abs(b.curvature)-Math.abs(a.curvature))[0];
 if(!bend)return 0;
 const side=Math.sign(bend.curvature),d=bend.distance,outside=-side*5.4,apex=side*5.1;
 if(d>25)return outside;
 if(d>=0)return outside+(apex-outside)*(1-d/25);
 if(d>-30)return apex+(outside-apex)*(-d/30);
 return 0;
}
export function cornerSpeedLimit(curvature){
 const strength=Math.abs(curvature);
 return strength<.003?Infinity:clamp(Math.sqrt(18/strength),17,34);
}
export function shouldUseAIItem(id,r,racers,shots,length,wrap=wrapDelta){
 const gap=(o)=>wrap(o.s-r.s,length);
 const same=o=>(o.route||0)===(r.route||0)&&o.time===null;
 const ahead=racers.filter(o=>o!==r&&same(o)&&gap(o)>0&&gap(o)<42).sort((a,b)=>gap(a)-gap(b))[0];
 const behind=racers.filter(o=>o!==r&&same(o)&&gap(o)<0&&gap(o)>-16).sort((a,b)=>gap(b)-gap(a))[0];
 if(id==='homing')return !!ahead;
 if(id==='honey')return !!behind;
 if(id==='bubble')return (shots||[]).some(s=>s.homing&&s.target===r.ci);
 if(id==='star')return !!ahead||!!behind;
 if(id==='boost'||id==='triple')return (r.speed||0)>12;
 if(id==='hug')return racers.some(o=>o!==r&&same(o)&&Math.abs(gap(o))<26);
 return false;
}
export function rivalPlan(r,racers,hazards,length,wrap,lookahead=45){
 const wrapD=d=>wrap(d,length),same=o=>(o.route||0)===(r.route||0)&&Math.abs((o.airHeight||0)-(r.airHeight||0))<1.8;
 const desired=r.aiRacingLane??r.passLane??r.lane;
 const ahead=[...hazards,...racers.filter(o=>o!==r)].filter(same).map(o=>({o,d:wrapD(o.s-r.s)}))
  .filter(({o,d})=>d>0&&d<lookahead&&Math.abs(o.lane-r.lane)<3.8).sort((a,b)=>a.d-b.d)[0];
 let lane=desired,cap=Infinity;
 if(ahead){
  const {o,d}=ahead;
  const choices=[-7,-3.5,0,3.5,7].filter(l=>Math.abs(l-o.lane)>3.7&&
   racers.filter(x=>x!==r&&same(x)).every(x=>{
    const gap=wrapD(x.s-r.s),closing=Math.max(0,(x.speed||0)-r.speed);
    // Check the entire lane-change corridor, including a faster kart behind.
    return gap>18||gap<-(8+closing*1.2)||x.lane<Math.min(r.lane,l)-3.5||x.lane>Math.max(r.lane,l)+3.5;
   })&&hazards.filter(same).every(x=>{const gap=wrapD(x.s-r.s);return gap< -3||gap>28||Math.abs(x.lane-l)>3.7;}));
  choices.sort((a,b)=>Math.abs(a-(r.aiInsideLane??r.lane))-Math.abs(b-(r.aiInsideLane??r.lane))||Math.abs(a-r.lane)-Math.abs(b-r.lane));
  if(choices.length)lane=choices[0];
  // Keep a little forward pressure while queuing; once a clear lane is chosen,
  // hold racing speed and let the steering complete the pass.
  if(Math.abs(o.lane-r.lane)<3.8&&Math.abs(o.lane-lane)<3.7&&d<22)cap=Math.max(0,(o.speed||0)+clamp((d-7)*.45,-3,4));
 }else if(r.passLane==null)lane=r.lane;
 // Side-by-side rivals leave space instead of crossing through each other.
 for(const o of racers.filter(o=>o!==r&&same(o))){
  if(Math.abs(wrapD(o.s-r.s))<7&&Math.abs(o.lane-r.lane)<4.2){
   const side=Math.sign(r.lane-o.lane)||((r.ci??0)<(o.ci??0)?-1:1);
   lane=Math.max(-5.8,Math.min(5.8,o.lane+side*4.2));
  }
 }
 return {lane,cap};
}

// Observe resolved progress, not wheel speed: a kart may accelerate into a wall.
export function recoverStalledRival(r,dt,hazards,racers,length){
 if(r.manual||r.time!=null||r.airborne){r.aiStallTime=0;r.aiProgress=r.s;return false;}
 if(!Number.isFinite(r.aiProgress))r.aiProgress=r.s;
 if(r.s-r.aiProgress>=1){r.aiProgress=r.s;r.aiStallTime=0;return false;}
 r.aiStallTime=(r.aiStallTime||0)+dt;
 if(r.aiStallTime<3)return false;
 const spot=findRecoverySpot(r,hazards,racers,length);
 if(!spot)return false;
 Object.assign(r,spot,{route:0,speed:0,driveSpeed:0,lateralSpeed:0,stun:0,rockContactTime:0,slipTime:0,colliderAngle:0,halfWidth:1.55,halfLength:2.05,passLane:spot.lane,aiStallTime:0,aiProgress:spot.s});
 return true;
}

export const ACHIEVEMENTS=[
 {id:'clean',name:'Smooth driver',hint:'Finish a lap without a hard bump',icon:'◇'},
 {id:'shortcut',name:'Pathfinder',hint:'Complete a shortcut',icon:'↗'},
 {id:'crystals',name:'Crystal explorer',hint:'Collect three different crystal types in one race',icon:'◆'},
 {id:'tour',name:'Tour adventurer',hint:'Finish every race in a tour',icon:'★'},
 {id:'drift',name:'Drift star',hint:'Release a gold drift boost',icon:'✦'},
 {id:'comeback',name:'Keep believing',hint:'Gain three places from your lowest position',icon:'↑'},
 {id:'best',name:'Growing stronger',hint:'Beat your saved course time',icon:'◷'}
];
export function readCollection(storage){
 try{storage??=globalThis.localStorage;const d=JSON.parse(storage.getItem('crystal-stickers-v1')||'{}');return {earned:Array.isArray(d.earned)?d.earned.filter(x=>typeof x==='string'):[],bestLaps:d.bestLaps&&typeof d.bestLaps==='object'?d.bestLaps:{}};}catch{return {earned:[],bestLaps:{}};}
}
export function award(collection,ids){const fresh=ids.filter(id=>!collection.earned.includes(id));collection.earned=[...new Set([...collection.earned,...fresh])];return fresh;}
export function interpolateGhost(samples,time,length){
 if(!samples?.length||time>samples.at(-1)[0])return null;
 let low=0,high=samples.length-1;while(low<high){const m=Math.ceil((low+high)/2);if(samples[m][0]<=time)low=m;else high=m-1;}
 const a=samples[low],b=samples[Math.min(low+1,samples.length-1)];
 const f=a[5]===b[5]?Math.max(0,Math.min(1,(time-a[0])/Math.max(.001,b[0]-a[0]))):0;
 const angle=((b[3]-a[3]+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
 return {s:a[1]+(b[1]-a[1])*f,lane:a[2]+(b[2]-a[2])*f,heading:a[3]+angle*f,airHeight:a[4]+(b[4]-a[4])*f,route:a[5]};
}
export function validGhost(d){return d?.version===1&&Number.isFinite(d.time)&&d.time>0&&d.time<=600&&Number.isInteger(d.ci)&&d.ci>=0&&d.ci<9&&Array.isArray(d.samples)&&d.samples.length>=2&&d.samples.length<=6100&&d.samples.every((s,i)=>Array.isArray(s)&&s.length===6&&s.every(Number.isFinite)&&s[0]>=0&&(!i||s[0]>d.samples[i-1][0]))&&Math.abs(d.samples.at(-1)[0]-d.time)<.2;}
