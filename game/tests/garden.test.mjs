import assert from 'node:assert/strict';
import {GARDEN,createGarden,stepGarden,dropGems,nearestGem,gardenRanking,gardenScore,gardenTimeLeft,gardenRandom} from '../public/garden.js';
const wrap=(d,L)=>((d+L/2)%L+L)%L-L/2,L=900;
const a=gardenRandom(7),b=gardenRandom(7);assert.equal(a(),b(),'seeded layout is repeatable');
const g=createGarden(L,42);assert.equal(g.gems.length,GARDEN.gems);assert.equal(g.gems.filter(x=>x.golden).length,1,'one golden gem');
for(const gem of g.gems){assert(gem.s>=0&&gem.s<L&&Math.abs(gem.lane)<=5);}
const gold=g.gems.find(x=>x.golden),me={ci:0,s:gold.s,lane:gold.lane,time:null},you={ci:1,s:gold.s+400,lane:0,time:null};
let ev=stepGarden(g,[me,you],1,wrap);assert.equal(ev.length>=1,true);assert.equal(gardenScore(g,me),GARDEN.golden,'golden gem is worth three');assert(!gold.active);
stepGarden(g,[{ci:5,s:-999,lane:99,time:null}],1+GARDEN.respawn,wrap);assert(gold.active,'spent gems respawn');
me.airborne=true;const before=gardenScore(g,me);const near=g.gems.find(x=>x.active);me.s=near.s;me.lane=near.lane;stepGarden(g,[me],10,wrap);assert.equal(gardenScore(g,me),before,'no grabbing crystals mid-air');me.airborne=false;
assert.equal(dropGems(g,me,20),2);assert.equal(gardenScore(g,me),GARDEN.golden-2);const loose=g.gems.filter(x=>x.loose);assert.equal(loose.length,2);
me.s=loose[0].s;me.lane=loose[0].lane;stepGarden(g,[me],20.2,wrap);assert.equal(gardenScore(g,me),GARDEN.golden-2,'cannot grab your own dropped crystal straight back');
you.s=loose[0].s;you.lane=loose[0].lane;me.s=0;stepGarden(g,[you],20.5,wrap);assert.equal(gardenScore(g,you),1,'rivals can collect dropped crystals');assert.equal(g.gems.filter(x=>x.loose).length,1,'collected loose crystals disappear');
assert.equal(dropGems(g,{ci:9,s:0,lane:0},1),0,'nothing to drop, nothing lost');
const hunter={ci:3,s:0,lane:0},target=nearestGem(g,hunter,200,wrap);assert(!target||wrap(target.s-hunter.s,L)>4);
g.scores[0]=5;const rank=gardenRanking(g,[you,me,{ci:9,s:5}],L);assert.equal(rank[0],me,'most crystals leads');g.scores[0]=1;you.s=300;me.s=200;assert.equal(gardenRanking(g,[me,you],L)[0],you,'ties go to the racer further round the lap');
assert.equal(gardenTimeLeft(null,30),GARDEN.duration-30);assert.equal(gardenTimeLeft(null,500),0);
const finished={ci:4,s:gold.s,lane:gold.lane,time:12};const g2=createGarden(L,42);stepGarden(g2,[finished],1,wrap);assert.equal(gardenScore(g2,finished),0,'finished racers do not collect');
console.log('Crystal Garden: seeded layout, golden gem, respawn, no mid-air grabs, kind drops with grace, rival pickups, AI targeting and ranking passed.');
