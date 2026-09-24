import assert from 'node:assert/strict';
import {driftTier,driftBoost,rivalPlan,award,readCollection,validGhost,interpolateGhost} from '../public/race-extras.js';
import {wrapDelta,advance,solveContacts} from '../public/physics.js';
assert.equal(driftTier(.7),0);assert.equal(driftTier(.8),1);assert.equal(driftTier(1.8),2);assert.equal(driftTier(2.6),3);
assert(driftBoost(1.8)>driftBoost(.9));assert(driftBoost(2.6)>driftBoost(1.8));
const r={ci:1,s:0,lane:0,speed:30,mass:1},lead={ci:2,s:12,lane:0,speed:15,mass:1};
assert(rivalPlan(r,[r,lead],[],1000,wrapDelta).cap<30,'follow rather than ram');
const blocked=[lead,{ci:3,s:1,lane:-4,speed:25},{ci:4,s:1,lane:4,speed:25}];
assert(rivalPlan(r,[r,...blocked],[],1000,wrapDelta).cap<30);
const distant={...lead,s:30};assert.notEqual(rivalPlan(r,[r,distant],[],1000,wrapDelta).lane,0,'clear passing lane selected');
const alongside={ci:3,s:1,lane:3.8,speed:30};assert(rivalPlan(r,[r,alongside],[],1000,wrapDelta).lane<=0,'leave lateral room');
// A lone rival must get past a rock, not stop forever behind its safe-follow distance.
const bot={...r,lateralSpeed:0},rock={s:30,lane:0};
for(let i=0;i<1200;i++){const p=rivalPlan(bot,[bot],[rock],1000,wrapDelta);bot.passLane=p.lane;advance(bot,1/120,Math.min(30,p.cap),Math.max(-7,Math.min(7,(p.lane-bot.lane)*3)));solveContacts([bot],[rock],1000);}
assert(bot.s>60,'rival navigates obstacle');
const collection=readCollection({getItem(){throw Error('blocked')}});assert.deepEqual(collection.earned,[]);
assert.deepEqual(award(collection,['clean']),['clean']);assert.deepEqual(award(collection,['clean']),[]);
const data={version:1,time:1,ci:0,samples:[[0,0,0,3.1,0,0],[1,10,2,-3.1,1,0]]};
assert(validGhost(data));assert(!validGhost({...data,samples:[[1,0,0,0,0,0],[0,1,0,0,0,0]]}));
const mid=interpolateGhost(data.samples,.5,1000);assert.equal(mid.s,5);assert.equal(mid.lane,1);assert(Math.abs(mid.heading)>3,'heading wraps smoothly');
assert.equal(interpolateGhost(data.samples,1.1,1000),null);
assert.equal(interpolateGhost([[0,0,0,0,0,0],[1,10,0,0,0,1]],.5,1000).s,0,'no interpolation across route change');
console.log('PASS: three drift tiers, fair AI and rock navigation, sticker deduplication, ghost validation/interpolation');
