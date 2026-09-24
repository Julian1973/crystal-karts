import assert from 'node:assert/strict';
import {readShards,createRareShard,rushGate} from '../public/rare-shard.js';
import {makeTrack,routeStep,TRACKS} from '../public/tracks.js';
import * as T from '../public/assets/three.module.js';
assert.deepEqual(readShards({getItem(){throw Error();}}),{});
assert.equal(rushGate(99,101,100,0,22),true);assert.equal(rushGate(99,101,100,3,22),false);
let saved='{}';globalThis.localStorage={getItem:()=>saved,setItem:(_,v)=>saved=v};
for(const id of Object.keys(TRACKS)){
 const scene=new T.Scene(),track=makeTrack(id),b=track.rushRoute,messages=[];
 const challenge=createRareShard({scene,track,toast:m=>messages.push(m),audio:{effect(){},tone(){}}});
 const run=(miss=false)=>{const p={s:2*track.length+b.a-120,lane:5,speed:30,completedLaps:2,route:0};challenge.reset(true);
 for(let i=0;i<900&&p.s<2*track.length+b.b+2;i++){
 const old=p.s,u=(p.s-2*track.length-b.a)/(b.b-b.a);p.lane=miss?8:u<.12?5:u<.37?3:u<.66?0:-3;
 p.s+=.5;routeStep(p,old,track);challenge.update(p,i/60);
 }return p;};
 run();assert(!JSON.parse(saved)[id],'reward waits for finish');assert(challenge.finish().includes('shard!'),id);assert(JSON.parse(saved)[id]);
 const p=run(true);assert.equal(challenge.finish(),'');p.s=2*track.length+b.a-1;p.lane=5;challenge.update(p,20);p.s+=2;routeStep(p,p.s-2,track);challenge.update(p,21);assert.equal(challenge.finish(),'','miss cannot be reversed for another attempt');
 challenge.reset(false);assert.equal(scene.getObjectByName('crystal-rush').visible,false);
 assert(Number.isFinite(track.frame(b.a+1,0,90).p.x));
}
console.log('All eleven Rush routes, precise gates, one attempt and finish-only rewards passed.');
