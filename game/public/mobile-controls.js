export function thumbSteering(raw){const magnitude=Math.min(1,Math.abs(raw));return Math.sign(raw)*Math.pow(Math.max(0,(magnitude-.08)/.92),1.35);}
export function screenTilt(beta,gamma,angle=0){
 const d=Math.PI/180,b=beta*d,g=gamma*d,a=angle*d;
 const x=-Math.cos(b)*Math.sin(g),y=Math.sin(b),z=Math.cos(b)*Math.cos(g);
 const sx=x*Math.cos(a)+y*Math.sin(a),sy=-x*Math.sin(a)+y*Math.cos(a);
 return {roll:Math.atan2(-sx,Math.hypot(sy,z))/d,pitch:Math.atan2(sy,z)/d};
}
export function tiltInput(current,neutral){
 const delta=(a,b)=>((a-b+540)%360)-180;
 const dead=(v,n,max)=>Math.sign(v)*Math.min(1,Math.max(0,Math.abs(v)-n)/(max-n));
 const steer=-dead(delta(current.roll,neutral.roll),4,25)||0;
 return {steer,throttle:false,brake:false};
}
export function createMobileControls({interrupt,resume=()=>{},guide=()=>{},stopGuide=()=>{}}){
 const $=id=>document.getElementById(id),coarse={matches:matchMedia('(any-pointer:coarse)').matches||navigator.maxTouchPoints>0};
 let setupSeen=false,onReady=null;
 let centred=false,leftSeen=false,rightSeen=false,touchSteer=0,stickPointer=null,touchThrottle=false,touchBrake=false;
 let enabled=false,neutral=null,last=null,lastAt=0,angle=null,pending=false,timer,pausedBySettings=false;
 const angleNow=()=>screen.orientation?.angle??window.orientation??0;
 const landscape=()=>innerWidth>innerHeight;
 const status=t=>$('motion-status').textContent=t;
 const reset=()=>{neutral=null;last=null;lastAt=0;};
 function touch(message='Touch controls selected.'){enabled=false;centred=false;pending=false;clearTimeout(timer);reset();document.body.classList.remove('tilt-mode');$('tilt-enable').textContent='Enable tilt controls';status(message);}
 function calibrate(){if(last&&performance.now()-lastAt<2000){centred=true;leftSeen=false;rightSeen=false;neutral={...last};document.body.classList.add('tilt-mode');status('Ready! Tilt left and right. Watch the marker move.');const meter=$('steering-meter');if(meter)meter.value=0;}else{status('Waiting for a reading from your phone.');}}
 async function enable(){
  if(!landscape()){status('Turn your phone to landscape first.');return;}
  if(!window.isSecureContext||!window.DeviceOrientationEvent){touch('Tilt is unavailable here. Use the touch buttons.');return;}
  if(pending)return;pending=true;
  try{if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted'){touch('Motion access was not allowed. Touch buttons are ready.');return;}
   enabled=true;pending=false;angle=angleNow();reset();status('Motion allowed. Waiting for your phone…');$('tilt-enable').textContent='Centre steering';
   clearTimeout(timer);timer=setTimeout(()=>{if(!last)touch('Motion was allowed, but this browser sent no readings. Try opening the game directly in Safari, or use touch controls.');},8000);
  }catch{touch('Could not enable motion. Use touch controls.');}
 }
 // Keep the calibrated control frame stable through browser auto-rotation.
 addEventListener('deviceorientation',e=>{
  if(!enabled||document.hidden||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;
  last=screenTilt(e.beta,e.gamma,angle);lastAt=performance.now();
  clearTimeout(timer);
  if(!neutral){neutral={...last};document.body.classList.add('tilt-mode');status('Connected! Hold comfortably, tap Centre steering, then tilt left and right.');}
  const input=tiltInput(last,neutral);
  if(centred){leftSeen ||= input.steer<-.35;rightSeen ||= input.steer>.35;}
  const steps=$('steering-steps');if(steps)steps.textContent=!centred?'Tap Centre steering':!leftSeen?'Now tilt left ←':!rightSeen?'Now tilt right →':'✓ Ready to race!';
  const wheel=$('steering-wheel');if(wheel)wheel.style.transform='rotate('+(input.steer*35)+'deg)';
  const meter=$('steering-meter');if(meter)meter.value=input.steer;
  const preview=$('tilt-preview');if(preview)preview.textContent=`${input.steer<-.1?'← Left':input.steer>.1?'Right →':'Steering centred'} · Hold Go to drive`;

 });
 if($('hear-controls'))$('hear-controls').onclick=guide;
 $('tilt-enable').onclick=()=>{if(enabled)calibrate();else enable();};$('touch-enable').onclick=()=>touch();
 $('phone-setup').onclick=()=>{releaseStick();pausedBySettings=interrupt()===true;$('mobile-settings').showModal();guide();};
 $('mobile-options').onclick=()=>{releaseStick();pausedBySettings=interrupt()===true;$('mobile-settings').showModal();guide();};
 $('mobile-settings').addEventListener('close',()=>{stopGuide();if(pausedBySettings){pausedBySettings=false;resume();}if(onReady){const action=onReady;onReady=null;setupSeen=true;if(!neutral)touch();action();}});
 $('close-mobile-settings').onclick=()=>$('mobile-settings').close();
 $('mobile-recover').onclick=()=>{$('mobile-settings').close();$('recover').click();};
 $('mobile-music').onclick=()=>$('music').click();$('mobile-sound').onclick=()=>$('sound').click();

 const stick=$('thumb-steer'),knob=$('thumb-knob');
 function moveStick(e){const box=stick.getBoundingClientRect(),raw=(e.clientX-box.left-box.width/2)/(box.width*.30);touchSteer=thumbSteering(raw);if(knob)knob.style.transform='translateX('+(touchSteer*42)+'px)';}
 function releaseStick(){stickPointer=null;touchSteer=0;if(knob)knob.style.transform='translateX(0)';}
 if(stick){stick.addEventListener('pointerdown',e=>{if(stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e)});
 stick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)moveStick(e)});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>{if(e.pointerId===stickPointer)releaseStick()});}
 const hold=(id,on,off=on)=>{const btn=document.querySelector?.(`[data-key="${id}"]`);if(!btn)return;const down=e=>{e.preventDefault();on(true);btn.classList.add('pressed')},up=()=>{off(false);btn.classList.remove('pressed')};btn.addEventListener('pointerdown',down);for(const event of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(event,up);btn.addEventListener('touchstart',down,{passive:false});for(const event of ['touchend','touchcancel'])btn.addEventListener(event,up,{passive:false});};
 hold('ArrowUp',v=>touchThrottle=v);
 hold('ArrowDown',v=>touchBrake=v);
 function releaseTouch(){releaseStick();touchThrottle=false;touchBrake=false;for(const b of document.querySelectorAll?.('.touch-controls button.pressed')||[])b.classList.remove('pressed');}
 addEventListener('blur',releaseTouch);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseTouch()});
 function orient(){document.body.classList.toggle('mobile-device',coarse.matches);}
 // Resize and orientation events describe the display, not the driver's intention.
 // Never pause or erase calibration because a steering movement rotates the UI.
 addEventListener('resize',orient);screen.orientation?.addEventListener('change',orient);
 addEventListener('blur',()=>{last=null;lastAt=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden){last=null;lastAt=0;}});orient();
 return {read(){const blocked=document.hidden||$('mobile-settings').open;
   if(blocked)return {steer:0,throttle:false,brake:false,blocked:true};
   if(!enabled)return {steer:touchSteer,throttle:touchThrottle,brake:touchBrake};
   if(lastAt&&performance.now()-lastAt>1500){touch('Motion readings stopped. Touch controls are ready.');interrupt();return {steer:0,throttle:false,brake:false,blocked:true};}
   return neutral&&last?{...tiltInput(last,neutral),throttle:touchThrottle,brake:touchBrake}:{steer:0,throttle:false,brake:false,blocked:true};
 },prepare(action){if(coarse.matches&&!setupSeen){onReady=action;$('mobile-settings').showModal();guide();}else action();},enabled:()=>enabled};
}
