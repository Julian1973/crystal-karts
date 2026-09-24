import assert from 'node:assert/strict';
import {STEER_PROFILES,TOUCH_DEFAULTS,cleanTouchSettings,loadTouchSettings,saveTouchSettings,steerFromDrag,stepAutoDrift,buzz} from '../public/touch-settings.js';
const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
assert.deepEqual(loadTouchSettings(storage),{...TOUCH_DEFAULTS});assert.equal(TOUCH_DEFAULTS.autoDrive,false,'no automatic driving unless chosen');
saveTouchSettings({sensitivity:'quick',autoDrive:true,autoDrift:false,vibrate:false},storage);assert.deepEqual(loadTouchSettings(storage),{sensitivity:'quick',autoDrive:true,autoDrift:false,vibrate:false});
assert.deepEqual(cleanTouchSettings({sensitivity:'turbo',autoDrive:'yes'}),{...TOUCH_DEFAULTS},'bad values fall back');assert.deepEqual(loadTouchSettings({getItem(){throw Error('blocked')}}),{...TOUCH_DEFAULTS},'private mode is safe');
for(const p of Object.values(STEER_PROFILES)){assert.equal(steerFromDrag(0,p),0);assert.equal(steerFromDrag(p.reach*.05,p),0,'dead zone');assert.equal(steerFromDrag(p.reach*2,p),1);assert.equal(steerFromDrag(-p.reach,p),-1);}
assert(steerFromDrag(30,STEER_PROFILES.quick)>steerFromDrag(30,STEER_PROFILES.normal)&&steerFromDrag(30,STEER_PROFILES.normal)>steerFromDrag(30,STEER_PROFILES.gentle),'quick > normal > gentle for the same thumb move');
let s={};for(let i=0;i<20;i++)stepAutoDrift(s,{steer:.9,throttle:true,speed:25,dt:.01});assert(!s.drifting,'a quick flick is not a drift');
for(let i=0;i<15;i++)stepAutoDrift(s,{steer:.9,throttle:true,speed:25,dt:.01});assert(s.drifting,'holding full lock drifts');
assert(stepAutoDrift(s,{steer:.6,throttle:true,speed:25,dt:.01}),'keeps drifting through the bend');assert(!stepAutoDrift(s,{steer:.3,throttle:true,speed:25,dt:.01}),'easing off ends the drift');
s={};for(let i=0;i<50;i++)stepAutoDrift(s,{steer:1,throttle:true,speed:8,dt:.01});assert(!s.drifting,'no drifting at low speed');
const calls=[];const nav={vibrate:p=>{calls.push(p);return true}};assert(buzz('shot',{vibrate:true},nav));assert(!buzz('shot',{vibrate:false},nav));assert(!buzz('nothing',{vibrate:true},nav));assert(!buzz('boost',{vibrate:true},{}),'no vibration API is fine');assert.deepEqual(calls,[[40,30,40]]);
console.log('Touch settings: safe storage, three steering feels, floating stick dead zone, deliberate auto-drift, opt-in auto-drive and optional vibration passed.');
