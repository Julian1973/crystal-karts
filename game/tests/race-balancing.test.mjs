import assert from 'node:assert/strict';
import {makeTrack} from '../public/tracks.js';
import {DIFFICULTIES} from '../public/difficulty.js';
import {advance,advanceManual,wrapDelta,solveContacts,LANE_LIMIT} from '../public/physics.js';
import {comebackBoost} from '../public/gameplay.js';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const tracks=['wood','river','honey'];
const ranks={};
for(const level of ['easy','standard','hard'])for(const trackId of tracks){
 const track=makeTrack(trackId),cars=Array.from({length:9},(_,i)=>({s:-5*i,lane:0,speed:0,driveSpeed:0,lateralSpeed:0,heading:0,manual:i===8,time:null,base:27.5+(i%3)*.75,mass:1}));
 const player=cars[8];player.s=-40;const finishes=new Map();let steps=0;
 while(steps<30000&&!finishes.has(player)){
  const dt=1/60;
  for(const car of cars){
   const at=track.frame(car.s),ahead=track.frame(car.s+.5),yaw=Math.atan2(at.t.x,at.t.z),curve=wrapDelta(Math.atan2(ahead.t.x,ahead.t.z)-yaw,Math.PI*2)/.5;
   if(car===player){
    const error=wrapDelta(yaw-car.heading,Math.PI*2),rank=1+cars.filter(other=>other.s>car.s).length;
    advanceManual(car,dt,{throttle:true,steer:clamp(error*2.2-car.lane*.055,-1,1),topSpeed:32*(1+comebackBoost(rank,9)),acceleration:10,easyAssist:level==='easy'?1.35:0},yaw,curve);
    solveContacts([car],[],track.length);
   }else{
    const difficulty=DIFFICULTIES[level],rank=1+cars.filter(other=>other.s>car.s).length,gap=car.s-player.s;
    const easing=gap>65?.94:gap< -65?1.025:1;
    advance(car,dt,car.base*difficulty.pace*easing*(1+comebackBoost(rank,9)*.35),0,difficulty.acceleration);
   }
   if(car.s>=3*track.length&&!finishes.has(car))finishes.set(car,steps*dt);
   if(car===player)assert(Math.abs(car.lane)<=LANE_LIMIT+1e-6,'Easy road assist respects the solid edge');
  }
  steps++;
 }
 assert(finishes.has(player),`${level} ${trackId} player reaches the finish`);
 const rank=1+[...finishes].filter(([car,time])=>car!==player&&time<finishes.get(player)).length;
 ranks[level+':'+trackId]=rank;
}
assert(tracks.every(track=>ranks['easy:'+track]===1),'a last-place player can win an Easy race on each tested circuit');
console.log('PASS: full three-lap physics pace races on wood, river and honey at all three difficulty levels; Easy comeback wins from last place.');
