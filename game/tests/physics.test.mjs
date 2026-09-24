import assert from 'node:assert/strict';
import {advance,solveContacts,KART,ROCK,LANE_LIMIT,wrapDelta} from '../public/physics.js';
const car=(s,lane=0,speed=32)=>({s,lane,speed,lateralSpeed:0,stun:0,hitCooldown:0,mass:1});
const tick=(cars,rocks,targets=cars.map(()=>32),turns=cars.map(()=>0))=>{cars.forEach((r,i)=>advance(r,1/120,targets[i],turns[i]));solveContacts(cars,rocks,858)};
let r=car(0),rock={s:20,lane:0};
for(let i=0;i<600;i++)tick([r],[rock]);
assert(r.s<=20-KART.halfLength-ROCK.halfLength+.001);assert.equal(r.speed,0);
for(let i=0;i<100;i++)tick([r],[rock],[32],[-7]);
for(let i=0;i<360;i++)tick([r],[rock],[32],[0]);
assert(r.s>25,'steering clears rock and resumes acceleration');
r=car(0,0,48);r.mass=1.8;
for(let i=0;i<600;i++)tick([r],[rock],[48]);
assert(r.s<17&&r.speed===0,'boost and shield never bypass a rock');
let cars=[car(0,0,48),car(8,0,10)];
for(let i=0;i<600;i++){tick(cars,[],[48,10]);assert(cars[1].s-cars[0].s>=2*KART.halfLength-.001,'rear collision separation')}
assert(cars[1].speed>10,'impact transfers momentum');
cars=[car(20,-3),car(20,3)];
for(let i=0;i<240;i++){tick(cars,[],[32,32],[7,-7]);assert(cars[1].lane-cars[0].lane>=2*KART.halfWidth-.001,'side collision separation')}
cars=[car(856,0,48),car(4,0,10)];tick(cars,[],[48,10]);
assert(Math.abs(wrapDelta(cars[1].s-cars[0].s,858))>=KART.halfLength*2-.001,'lap seam collision');
cars=[car(0),car(6),car(12)];
for(let i=0;i<1200;i++)tick(cars,[rock]);
assert(cars[2].s<=20-KART.halfLength-ROCK.halfLength+.001);
assert(cars[1].s-cars[0].s>2*KART.halfLength-.01&&cars[2].s-cars[1].s>2*KART.halfLength-.01,'queue cannot push through rock');
r=car(0);for(let i=0;i<240;i++)tick([r],[],[0]);assert.equal(r.speed,0,'brake comes to rest');
assert(Math.abs(r.lane)<=LANE_LIMIT);
console.log('Passed: persistent rock stop, steering recovery, boosted/shielded contact, rear and side impacts, lap seam, queue against rock, full braking.');
