import assert from 'node:assert/strict';
import {screenTilt,tiltInput} from '../public/mobile-controls.js';
for(const angle of [90,270]){
 const sign=angle===90?1:-1,neutral=screenTilt(0,45*sign,angle);
 assert.deepEqual(tiltInput(neutral,neutral),{steer:0,throttle:false,brake:false});
 assert(tiltInput(screenTilt(-20*sign,45*sign,angle),neutral).steer<0);
 assert(tiltInput(screenTilt(20*sign,45*sign,angle),neutral).steer>0);
 assert.equal(tiltInput(screenTilt(0,25*sign,angle),neutral).throttle,false);
 assert.equal(tiltInput(screenTilt(0,65*sign,angle),neutral).brake,false);
 assert.equal(tiltInput(screenTilt(1,45*sign,angle),neutral).throttle,false);
}
console.log('Both landscape orientations: neutral, steering, acceleration, braking and dead zone passed.');
