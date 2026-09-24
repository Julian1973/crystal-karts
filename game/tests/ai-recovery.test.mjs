import assert from 'node:assert/strict';
import {rivalPlan,recoverStalledRival} from '../public/race-extras.js';
import {advance,solveContacts,wrapDelta,contact} from '../public/physics.js';
const make=(s,lane,ci=1)=>({s,lane,ci,speed:0,lateralSpeed:0,mass:1});
function run(bot,cars,rocks,seconds=12){
 let recoveries=0;
 for(let i=0;i<seconds*120;i++){
  const p=rivalPlan(bot,cars,rocks,1000,wrapDelta);bot.passLane=p.lane;
  advance(bot,1/120,Math.min(28,p.cap),Math.max(-7,Math.min(7,(p.lane-bot.lane)*3)));
  solveContacts(cars,rocks,1000);
  if(recoverStalledRival(bot,1/120,rocks,cars,1000))recoveries++;
 }
 return recoveries;
}
for(const lane of [-5,0,5]){
 const bot=make(0,lane),rock={s:3.4,lane};
 run(bot,[bot],[rock]);assert(bot.s>50,'escape after starting against rock');
}
const bot=make(0,0),leader={...make(4.2,0,2),manual:true};
run(bot,[bot,leader],[]);assert(bot.s>50,'pass a stopped car after close contact');
const jam=make(50,0),rocks=[-6,-3,0,3,6].map(lane=>({s:54,lane}));
let recovered=false;
for(let i=0;i<370;i++)if(recoverStalledRival(jam,1/120,rocks,[jam],1000)){recovered=true;break;}
assert(recovered);assert(jam.s<50,'recovery never advances racer');assert(rocks.every(r=>!contact(jam,r,1000,true)));
const human={...make(0,0),manual:true},finished={...make(0,0),time:20};
for(let i=0;i<600;i++){assert(!recoverStalledRival(human,1/120,[],[human],1000));assert(!recoverStalledRival(finished,1/120,[],[finished],1000));}
const moving=make(0,0);assert.equal(run(moving,[moving],[],8),0,'normal acceleration does not trigger recovery');
console.log('Passed: close rock contacts, stopped rival, blocked pile-up recovery, human/finished exclusions and normal driving');
