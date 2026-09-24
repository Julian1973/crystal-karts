import assert from 'node:assert/strict';
import {ITEM_POWERS,comebackFactor,comebackBoost,crystalRollBoost,selectItem,kartStats,slipstreaming} from '../public/gameplay.js';
import {advanceManual,solveContacts,LANE_LIMIT} from '../public/physics.js';

assert.equal(comebackFactor(1,9),0);assert.equal(comebackFactor(9,9),1);
assert.equal(comebackBoost(5,9),.03);assert.equal(comebackBoost(9,9),.10);
assert(crystalRollBoost(9,9)>crystalRollBoost(1,9),'last place rolls friendlier power odds');
for(let position=1;position<=9;position++)for(let i=0;i<100;i++)assert(Object.hasOwn(ITEM_POWERS,selectItem(position,9,()=>i/100)));
let seed=5193;const random=()=>{seed=(seed*48271)%2147483647;return seed/2147483647};
const sample=(place)=>{const counts={};for(let i=0;i<20000;i++){const id=selectItem(place,9,random);counts[id]=(counts[id]||0)+1;}return counts;};
const first=sample(1),last=sample(9);assert(last.triple>first.triple&&last.star>first.star,'comeback positions receive more strong item rolls');
const stats=Array.from({length:9},(_,i)=>kartStats(i));assert(stats.every(row=>row.length===4&&row.every(v=>v>=3&&v<=5)));
assert(Math.max(...stats.map(x=>x[0]))-Math.min(...stats.map(x=>x[0]))<=1,'speed stats stay close');
const car={s:100,lane:0,time:null},rival={s:108,lane:1,time:null};assert(slipstreaming(car,[car,rival]));rival.s=112;assert(!slipstreaming(car,[car,rival]));
const r={s:0,lane:6.4,heading:.4,driveSpeed:24,speed:22,lateralSpeed:0,manual:true,stun:0};
const before=Math.abs(r.heading);for(let i=0;i<120;i++){advanceManual(r,1/120,{throttle:true,steer:0,easyAssist:1.35},0);solveContacts([r],[],1000)}
assert(Math.abs(r.heading)<before,'Easy steering assist brings the kart back onto the road');assert(Math.abs(r.lane)<=LANE_LIMIT,'road edge contact keeps the kart on the road');
console.log('PASS: comeback boosts and item odds, fair star stats, slipstream range and Easy steering/road limits');
