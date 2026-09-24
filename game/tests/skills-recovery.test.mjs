import assert from 'node:assert/strict';
import {CRYSTALS,PICKUP_COUNT,collectCrystal,activateSkill,skillEffects} from '../public/skills.js';
import {findRecoverySpot,advanceManual,solveContacts,syncManualContact,KART,ROCK,wrapDelta} from '../public/physics.js';
assert.equal(PICKUP_COUNT,9);
for(const [id,power] of Object.entries(CRYSTALS)){
 const r={id,s:100,lane:0,powerCharge:0,powerTime:0,friendTime:0,stun:1};
 for(let charge=1;charge<=3;charge++){
  const gem={owner:'keen',usedLap:-1};assert(collectCrystal(r,gem,0));assert.equal(r.powerCharge,charge);assert.equal(r.heldPower,id);
  if(charge<3)assert(!activateSkill(r,[r],858),'bear move charges across three boxes');
 }
 assert(activateSkill(r,[r],858));assert.equal(r.powerTime,power.duration);assert.equal(r.powerCharge,0);assert.equal(r.activePower,id);
 assert(!activateSkill(r,[r],858),'cannot activate without charge');
 assert(collectCrystal(r,{owner:'keen',usedLap:-1},1),'next lap refreshes');assert.equal(r.powerCharge,1);assert(!activateSkill(r,[r],858),'cannot stack active powers');
 r.powerTime=0;r.powerCharge=3;assert(!collectCrystal(r,{owner:'keen',usedLap:-1},0),'full charge prevents overfilling');assert(activateSkill(r,[r],858));
 assert(Object.values(skillEffects(r)).some(Boolean));
}
const howey={id:'howey',heldPower:'howey',s:100,powerCharge:3,powerTime:0,stun:1},friend={id:'keen',s:112,friendTime:0,stun:1},far={id:'amie',s:150,friendTime:0};
activateSkill(howey,[howey,friend,far],858);assert.equal(friend.friendTime,6);assert.equal(friend.stun,0);assert.equal(far.friendTime,0);
const r={id:'keen',manual:true,s:96,lane:3,speed:0,driveSpeed:0,lateralSpeed:0,heading:0,stun:9,reverseHold:0},rocks=[{s:100,lane:3}],cars=[r,{s:88,lane:3},{s:84,lane:0}];
const spot=findRecoverySpot(r,rocks,cars,858);assert(spot&&spot.s<r.s);
for(const rock of rocks)assert(Math.abs(wrapDelta(spot.s-rock.s,858))>KART.halfLength+ROCK.halfLength||Math.abs(spot.lane-rock.lane)>KART.halfWidth+ROCK.halfWidth);
for(const c of cars.slice(1))assert(Math.abs(spot.s-c.s)>KART.halfLength*2||Math.abs(spot.lane-c.lane)>KART.halfWidth*2);
const old=r.s;for(let i=0;i<180;i++){advanceManual(r,1/120,{brake:true,throttle:true,steer:0},0);solveContacts([r],rocks,858);syncManualContact(r,0)}assert(r.s<old-2&&r.driveSpeed<0,'brake escapes even while throttle and stun remain');
console.log('Passed: seven cross-bear skills, scarcity, charge limit, lap refresh, no farming, shared kindness, safe backwards recovery and reverse during stun.');
