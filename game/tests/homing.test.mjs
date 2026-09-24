import assert from 'node:assert/strict';
import {launchCrystal,advanceShots} from '../public/combat.js';
const make=(ci,s,lane=0)=>({ci,s,lane,time:null,speed:32,driveSpeed:32,powerTime:0,friendTime:0});
for(const start of [20,850]){
 const a=make(0,start),b=make(1,start+70,7);let shots=[launchCrystal(a,0,[a,b],900)],hits=0;
 for(let i=0;i<1200&&shots.length;i++){b.s+=32/120;b.lane=Math.sin(i/15)*8;b.route=i>30?1:0;b.airHeight=3;shots=advanceShots(shots,[a,b],[{s:start+25,lane:0}],1/120,900,()=>hits++);}
 assert.equal(hits,1,'tracks a moving rival across lap wrap, lane changes, obstacles and shortcuts');assert.equal(b.spinTime,.72);assert(b.speed>0&&b.speed<32,'friendly spin keeps the kart moving');
}
const a=make(0,0),b=make(1,10);b.phasing=true;let shots=[launchCrystal(a,0,[a,b],900)];
for(let i=0;i<100;i++)shots=advanceShots(shots,[a,b],[],.01,900);
assert.equal(shots.length,1);assert(!b.spinTime);b.phasing=false;shots=advanceShots(shots,[a,b],[],.01,900);assert.equal(shots.length,0);assert(b.spinTime>0);
const shield=make(2,5);shield.activePower='aida';shield.powerTime=5;shots=[launchCrystal(a,0,[a,shield],900)];for(let i=0;i<100;i++)shots=advanceShots(shots,[a,shield],[],.01,900);assert(!shield.spinTime);assert.equal(shots.length,0);
const finished=make(3,10);shots=[launchCrystal(a,0,[a,finished],900)];finished.time=20;assert.equal(advanceShots(shots,[a,finished],[],.01,900).length,0);
console.log('Homing moving targets, lap wrap, routes, airborne hit, phase wait, shield and finish cleanup passed.');
