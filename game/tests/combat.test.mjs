import assert from 'node:assert/strict';
import {contact,solveContacts,advanceManual,syncManualContact} from '../public/physics.js';
import {activateSkill,skillEffects} from '../public/skills.js';
import {launchCrystal,advanceShots} from '../public/combat.js';
const racer=(ci,s=0,lane=0)=>({ci,id:'luna',manual:true,s,lane,heading:0,speed:0,driveSpeed:0,lateralSpeed:0,powerCharge:3,powerTime:0,friendTime:0,time:null});
const a=racer(0),b=racer(1,0,3.2);assert(!contact(a,b,858),'visible gap between karts does not collide');
a.colliderAngle=Math.PI/4;const corner={s:-2.7,lane:2.7};assert(!contact(a,corner,858,true),'empty corner outside rotated kart does not collide');
for(const id of ['keen','sunny']){const r=racer(0);r.id=id;assert(activateSkill(r,[r],858));assert(r.driveSpeed>0,'explicit boost gives forward kick');}
const p=racer(0);p.id='misty';activateSkill(p,[p],858);p.phasing=skillEffects(p).phase;p.s=20;const rock={s:20,lane:0};const car=racer(1,20);solveContacts([p,car],[rock],858);assert.equal(p.s,20,'phase passes through rock and kart');p.phasing=false;solveContacts([p],[rock],858);assert(!contact(p,rock,858,true),'phase ending clears overlap');
const shoot=(target,rocks=[])=>{const shooter=racer(0);shooter.id='amie';activateSkill(shooter,[shooter,target],858);assert(shooter.pendingShot);let shots=[launchCrystal(shooter,0)];for(let i=0;i<120;i++)shots=advanceShots(shots,[shooter,target],rocks,1/120,858);return shots;};
const target=racer(1,25);target.speed=target.driveSpeed=25;assert.equal(shoot(target).length,0);assert(target.slipTime===.7&&target.driveSpeed>0&&target.driveSpeed<25,'shot makes opponent gently skid without stopping');
const shield=racer(1,25);shield.activePower='aida';shield.powerTime=5;shoot(shield);assert(!shield.slipTime,'shield blocks shot');
const protectedCar=racer(1,25);shoot(protectedCar,[{s:12,lane:0}]);assert(!protectedCar.slipTime,'rock blocks shot');
const phase=racer(1,25);phase.phasing=true;shoot(phase);assert(!phase.slipTime,'phase avoids shot');
console.log('Passed: tighter kart gap, rotated empty corner, explicit boost, temporary phase, solid phase exit, crystal hit, shields and rock blocking.');
