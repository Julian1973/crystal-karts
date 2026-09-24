import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TRACKS,makeTrack,jumpStep,ROCK_LAYOUT,PAD_LAYOUT,pickupLayout,secretShardLayout} from '../public/tracks.js';
import {PICKUP_COUNT} from '../public/skills.js';
// The shared layout must match what game.js and scenery.js actually build.
const game=await readFile(new URL('../public/game.js',import.meta.url),'utf8'),scenery=await readFile(new URL('../public/scenery.js',import.meta.url),'utf8');
assert(game.includes('[[.19,4],[.34,-4],[.49,1],[.67,5],[.84,-3]]')&&ROCK_LAYOUT.join()==='0.19,0.34,0.49,0.67,0.84','rock layout in sync');
assert(scenery.includes('[.13,.39,.66,.87].map')&&PAD_LAYOUT.join()==='0.13,0.39,0.66,0.87','boost pad layout in sync');
assert(game.includes('s=(.055+i/PICKUP_COUNT*.91)*length'),'pickup layout in sync');assert(game.includes('length*(.19+(Object.keys(TRACKS).indexOf(trackId)%7)*.085)'),'secret shard layout in sync');
for(const [index,id] of Object.keys(TRACKS).entries()){
 const t=makeTrack(id),L=t.length;assert(t.ramps.length>=1&&t.ramps.length<=2,id+' has jumps');if(t.ramps.length===2)assert(Math.abs(t.ramps[1]-t.ramps[0])>=.15*L,id+' jumps are spread out');
 // River keeps its original hand-placed live ramps, whose landings already cross a crystal row.
 if(id==='river')continue;
 const objects=[...ROCK_LAYOUT.map(u=>['rock',u]),...PAD_LAYOUT.map(u=>['pad',u]),...pickupLayout(PICKUP_COUNT).map(u=>['crystal',u]),['shard',secretShardLayout(index)]];
 for(const ramp of t.ramps){for(const route of [...t.shortcuts,t.rushRoute])assert(ramp<route.a-5||ramp>route.b,id+' ramp is not on a branch route');
  for(const speed of [20,32,48]){const r={s:ramp-.2,lane:0,speed,route:0};let old=r.s;r.s=ramp+.01;jumpStep(r,old,1/120,t);assert(r.airborne,id+' takes off at '+speed);let steps=0;while(r.airborne&&steps++<600){old=r.s;r.s+=speed/120;jumpStep(r,old,1/120,t);}assert(!r.airborne,id+' lands');
   for(const [kind,u] of objects){const at=u*L;assert(!(at>ramp-2&&at<r.s+4),`${id}: ${kind} at ${at.toFixed(0)} sits under the ${speed} jump from ${ramp.toFixed(0)} to ${r.s.toFixed(0)}`);}}}
}
console.log('Passed: clear jumps on every generated course (two where the layout allows); nothing under any flight path or landing at 20, 32 or 48.');
