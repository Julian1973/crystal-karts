import assert from 'node:assert/strict';
import {advanceManual,solveContacts,syncManualContact,ROCK,wrapDelta,contact} from '../public/physics.js';
for(const traction of [1,.35])for(const side of [-1,1]){
 const r={manual:true,s:90,lane:0,heading:0,driveSpeed:25,lateralSpeed:0},rocks=[{s:100,lane:0}];
 const step=input=>{advanceManual(r,1/120,{traction,...input},0);solveContacts([r],rocks,858);syncManualContact(r,0);assert((contact(r,rocks[0],858,true)?.depth||0)<.001,'rock stays solid');};
 for(let i=0;i<240;i++)step({throttle:true,steer:0});
 assert(r.s<100&&Math.abs(r.driveSpeed)<1,'front impact stops kart');
 const stopped=r.s;for(let i=0;i<120;i++)step({steer:0});assert(Math.abs(r.s-stopped)<.01,'no automatic escape');
 for(let i=0;i<1800&&r.s<110;i++){
  const wanted=Math.abs(r.lane)<4.5?side*.85:0;
  step({throttle:true,steer:Math.max(-1,Math.min(1,(wanted-r.heading)*4))});
 }
 assert(r.s>110,'can steer away and pass rock using accelerator on wet and dry track');
}
console.log('Passed: stop at rock, no automatic motion, steer away left/right, pass solid rock on wet/dry track.');
