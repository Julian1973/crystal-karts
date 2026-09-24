import assert from 'node:assert/strict';
import {solveContacts,advanceManual,syncManualContact,contact} from '../public/physics.js';
import {impactPenalty} from '../public/kart-style.js';
const kart=(s,speed,lane=0)=>({s,speed,driveSpeed:speed,lane,lateralSpeed:0,heading:0,manual:true,mass:1,stun:0,boostTime:2,driftCharge:1});
const solve=(cars,rocks=[])=>solveContacts(cars,rocks,1000,impactPenalty);
const step=r=>{syncManualContact(r,0);advanceManual(r,1/60,{throttle:true,steer:0},0);};
// Rear-end impulse pushes the front kart forwards, not into a next-frame stun.
{
 const rear=kart(0,30),front=kart(4,20);solve([rear,front]);
 assert(front.speed>20);assert(rear.speed<30);
 assert(Math.abs(front.speed+rear.speed-50)<1e-9);
 step(front);assert(front.driveSpeed>20);assert.equal(front.stun,0);
 assert.equal(front.boostTime,2);assert.equal(front.driftCharge,1);
 assert.equal(contact(rear,front,1000),null);
}
// A side swipe changes sideways velocity without scrubbing forwards speed.
{
 const a=kart(0,25,0),b=kart(0,25,3);a.lateralSpeed=5;
 solve([a,b]);assert.equal(a.speed,25);assert.equal(b.speed,25);
 assert(b.lateralSpeed>0);step(a);assert(a.driveSpeed>24);
}
// Separating contact is corrected spatially, never given a second impulse.
{
 const a=kart(0,20),b=kart(4,30);solve([a,b]);
 assert.equal(a.speed,20);assert.equal(b.speed,30);
}
// Head-on impact removes closing momentum, but does not freeze the controls.
{
 const a=kart(0,20),b=kart(4,-20);solve([a,b]);
 assert(Math.abs(a.speed)<20);assert(Math.abs(b.speed)<20);
 assert.equal(a.stun,0);assert.equal(b.stun,0);
}
// Repeated rear contact still permits forward motion and never adds kart stun.
{
 const rear=kart(0,30),front=kart(4,20);
 for(let i=0;i<120;i++){solve([rear,front]);step(rear);step(front);assert.equal(front.stun,0);assert(front.driveSpeed>0);}
}
// Solid rocks still block forward travel.
{
 const a=kart(0,25);solve([a],[{s:3,lane:0}]);
 assert.equal(a.speed,0);assert(a.stun>0);assert.equal(a.boostTime,0);
}
console.log('PASS: rear, side, separating, head-on, repeated contact and solid rock checks');
