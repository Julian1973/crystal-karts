import assert from 'node:assert/strict';
import {createMobileControls} from '../public/mobile-controls.js';
const events={},els=new Map();const classes={add(){},remove(){},toggle(){}};
function el(id){if(!els.has(id))els.set(id,{textContent:'',style:{},open:false,listeners:{},addEventListener(k,f){this.listeners[k]=f},showModal(){this.open=true},close(){this.open=false;this.listeners.close?.()},click(){this.onclick?.()}});return els.get(id);}
globalThis.window=globalThis;globalThis.isSecureContext=true;globalThis.innerWidth=900;globalThis.innerHeight=400;globalThis.screen={orientation:{angle:90,addEventListener(k,f){events.screenChange=f}}};globalThis.matchMedia=()=>({matches:true});globalThis.document={hidden:false,getElementById:el,body:{classList:classes},addEventListener(k,f){events[k]=f}};globalThis.addEventListener=(k,f)=>events[k]=f;
globalThis.DeviceOrientationEvent={requestPermission:async()=> 'granted'};
let interrupted=0,resumed=0;const m=createMobileControls({interrupt:()=>{interrupted++;return true;},resume:()=>resumed++});
el('phone-setup').click();el('tilt-enable').click();await new Promise(r=>setImmediate(r));
events.deviceorientation({beta:0,gamma:45}); // A single reading must be sufficient, even at low sensor rates.
assert.equal(m.read().blocked,true);
el('close-mobile-settings').click();assert.equal(resumed,1);assert.equal(m.read().throttle,false);
events.deviceorientation({beta:0,gamma:25});assert.equal(m.read().throttle,false);
events.deviceorientation({beta:0,gamma:65});assert.equal(m.read().brake,false);
// Tilting into a browser portrait layout must not pause, reset, or block input.
const before=interrupted;
globalThis.innerWidth=400;globalThis.innerHeight=900;events.resize();
screen.orientation.angle=0;events.screenChange();
events.deviceorientation({beta:0,gamma:25});
assert.equal(m.read().throttle,false);assert.equal(m.read().blocked,undefined);
assert.equal(interrupted,before);
events.deviceorientation({beta:-20,gamma:45});assert.ok(m.read().steer<0);
events.deviceorientation({beta:20,gamma:45});assert.ok(m.read().steer>0);
screen.orientation.angle=90;globalThis.innerWidth=900;globalThis.innerHeight=400;events.screenChange();events.resize();
events.deviceorientation({beta:0,gamma:65});assert.equal(m.read().brake,false);
el('tilt-enable').click();assert.equal(m.read().brake,false);
el('touch-enable').click();assert.equal(m.enabled(),false);
const stick=el('thumb-steer');stick.getBoundingClientRect=()=>({left:0,width:150});stick.setPointerCapture=()=>{};
stick.listeners.pointerdown({pointerId:1,clientX:129,preventDefault(){}});
assert.equal(m.read().steer,1);
stick.listeners.pointermove({pointerId:1,clientX:21});assert.equal(m.read().steer,-1);
stick.listeners.pointercancel({pointerId:1});assert.equal(m.read().steer,0);
let started=0;m.prepare(()=>started++);assert.equal(started,0);
el('close-mobile-settings').click();assert.equal(started,1);
m.prepare(()=>started++);assert.equal(started,2);

console.log('Permission, single-reading calibration, settings resume, pedals, recenter and touch fallback passed.');
