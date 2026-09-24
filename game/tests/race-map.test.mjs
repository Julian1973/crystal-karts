import assert from 'node:assert/strict';
import {createRaceMap} from '../public/race-map.js';
import {TRACKS,makeTrack} from '../public/tracks.js';
for(const id of Object.keys(TRACKS)){
 const marks=[],ctx={clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(x,y,r){assert(Number.isFinite(x)&&Number.isFinite(y));marks.push({x,y,r});}};
 const map=createRaceMap({width:440,height:350,getContext:()=>ctx},makeTrack(id)),track=makeTrack(id);
 for(let i=0;i<=200;i++){const [x,y]=map.project(track.curve.getPointAt(i/200));assert(x>=22&&x<=418&&y>=22&&y<=328,id+' fits the map');}
 const player={s:track.length*2+.1,lane:0,ci:0},rival={s:track.length*.6,lane:4,ci:1};
 map.draw(player,[rival],[{color:0x123456},{color:0xabcdef}]);assert.equal(marks.filter(m=>m.r===13).length,1,'one distinct player marker');assert.equal(marks.filter(m=>m.r===8).length,1,'rival marker');
 const a=map.project(track.frame(.1).p),b=map.project(track.frame(track.length*2+.1).p);assert(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-5,'lap wrap matches');
}
console.log('Passed: all 11 circuits fit, racer markers and lap wrap');
