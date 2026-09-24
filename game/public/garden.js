// Crystal Garden: a two-minute crystal hunt on any course. Gather garden crystals; a spin-out knocks
// two loose for anyone to collect. Nobody is ever eliminated. Most crystals when time is up wins.
export const GARDEN=Object.freeze({duration:120,gems:16,golden:3,respawn:5,drop:2,catchS:2.4,catchLane:2.2,grace:.8});
export function gardenRandom(seed=1){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function place(g,gem){gem.s=(.04+g.rand()*.92)*g.length;gem.lane=Math.round((g.rand()*10-5)*10)/10;gem.active=true;return gem;}
export function createGarden(length,seed=Date.now()){
 const g={length,rand:gardenRandom(seed),gems:[],scores:Object.create(null)};
 for(let i=0;i<GARDEN.gems;i++)g.gems.push(place(g,{value:i===0?GARDEN.golden:1,golden:i===0,respawnAt:0,loose:false}));
 return g;
}
export const gardenScore=(g,r)=>g?.scores[r.ci]||0;
export const gardenTimeLeft=(g,elapsed)=>Math.max(0,GARDEN.duration-elapsed);
// Collect touching gems and respawn spent ones. Returns collection events for sound and HUD.
export function stepGarden(g,racers,now,wrapDelta){
 const events=[];
 for(const gem of g.gems)if(!gem.active&&!gem.loose&&now>=gem.respawnAt)place(g,gem);
 for(const gem of g.gems){if(!gem.active)continue;
  for(const r of racers){if(r.airborne||r.time!==null&&r.time!==undefined)continue;if(gem.blockedCi===r.ci&&now<gem.blockedUntil)continue;
   if(Math.abs(wrapDelta(gem.s-r.s,g.length))<GARDEN.catchS&&Math.abs(gem.lane-r.lane)<GARDEN.catchLane){gem.active=false;gem.respawnAt=now+GARDEN.respawn;g.scores[r.ci]=gardenScore(g,r)+gem.value;events.push({r,gem,value:gem.value});break;}}}
 g.gems=g.gems.filter(gem=>gem.active||!gem.loose);
 return events;
}
// A spin-out knocks up to two crystals loose just behind the racer; they cannot grab them straight back.
export function dropGems(g,r,now){
 const n=Math.min(GARDEN.drop,gardenScore(g,r));if(!n)return 0;g.scores[r.ci]-=n;
 for(let i=0;i<n;i++)g.gems.push({s:(r.s-6-i*3+g.length)%g.length,lane:Math.max(-6,Math.min(6,r.lane+(i?2.2:-2.2))),value:1,golden:false,loose:true,active:true,blockedCi:r.ci,blockedUntil:now+GARDEN.grace});
 return n;
}
export function nearestGem(g,r,lookahead,wrapDelta){let best=null,bestD=Infinity;for(const gem of g.gems){if(!gem.active)continue;const d=wrapDelta(gem.s-r.s,g.length)+(gem.golden?-12:0);if(d>4&&d<lookahead&&d<bestD){best=gem;bestD=d;}}return best;}
export function gardenRanking(g,racers,length){return [...racers].sort((a,b)=>gardenScore(g,b)-gardenScore(g,a)||((b.s%length)-(a.s%length)));}
