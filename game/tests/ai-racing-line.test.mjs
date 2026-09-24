import assert from 'node:assert/strict';
import test from 'node:test';
import {cornerSpeedLimit,racingLineLane,shouldUseAIItem} from '../public/race-extras.js';

test('rival line moves from the outside to the apex and back out',()=>{
 const outside=racingLineLane([{distance:40,curvature:.02}],62);
 const approach=racingLineLane([{distance:12,curvature:.02}],62);
 const apex=racingLineLane([{distance:0,curvature:.02}],62);
 const exit=racingLineLane([{distance:-12,curvature:.02}],62);
 assert(outside<0&&apex>0,'positive bend enters from outside and clips its inside');
 assert(approach<apex&&exit<apex,'line crosses progressively through the apex');
 assert.equal(racingLineLane([{distance:35,curvature:0}],62),0);
});

test('tight corners produce a safe rival speed cap',()=>{
 assert.equal(cornerSpeedLimit(0),Infinity);
 assert(cornerSpeedLimit(.025)<cornerSpeedLimit(.006));
 assert(cornerSpeedLimit(.025)>=17);
});

test('rivals use items for a nearby target, rear threat, or incoming shot',()=>{
 const bot={ci:1,s:20,lane:0,route:0,time:null,speed:22};
 const leader={ci:2,s:42,lane:0,route:0,time:null,speed:22};
 const tail={ci:3,s:9,lane:0,route:0,time:null,speed:22};
 assert(shouldUseAIItem('homing',bot,[bot,leader],[],1000));
 assert(shouldUseAIItem('honey',bot,[bot,tail],[],1000));
 assert(shouldUseAIItem('bubble',bot,[bot], [{homing:true,target:1}],1000));
 assert(!shouldUseAIItem('homing',bot,[bot],[],1000));
});
