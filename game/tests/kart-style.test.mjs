import assert from 'node:assert/strict';
import {KART_STYLES,impactPenalty} from '../public/kart-style.js';
import {advance} from '../public/physics.js';
assert.equal(Object.keys(KART_STYLES).length,9);
for(const kind of ['rock']){
 const human={manual:true,speed:28,stun:0,boostTime:3},bot={manual:false,speed:28,stun:0,boostTime:3};
 for(const r of [human,bot])impactPenalty(r,kind,20);
 assert.equal(human.stun,bot.stun);assert.equal(bot.boostTime,0);
 Object.assign(bot,{s:0,lane:0,lateralSpeed:0});advance(bot,.016,30,0);assert.equal(bot.speed,0);assert.equal(bot.s,0,'stunned AI cannot keep moving');
}
const shielded={stun:0,boostTime:3};impactPenalty(shielded,'kart',20,true);assert.equal(shielded.stun,0);
const unshielded={stun:0,boostTime:3};impactPenalty(unshielded,'kart',20);assert.equal(unshielded.stun,0);assert.equal(unshielded.boostTime,3);
console.log('Nine kart styles; shared impact penalties; AI stops during stun; shield respected.');
