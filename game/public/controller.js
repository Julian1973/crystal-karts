// Phone controller: joins a room as a racer and sends button presses. The big screen runs the race.
import {RaceRoom} from './network.js?v=75';
import {PARTY_BEARS,readControllerParams,validRoomCode,tiltToSteer} from './party.js?v=78';

const $=id=>document.getElementById(id);
const params=readControllerParams(location.search);
const held={throttle:false,brake:false,left:false,right:false,drift:false};
let room=null,skill=0,recover=0,tilt=false,tiltSteer={left:false,right:false},wakeLock=null,lastPhase='';

const status=text=>{$('status').textContent=text};
const buzz=ms=>{try{navigator.vibrate?.(ms)}catch{}};
const input=()=>({throttle:held.throttle,brake:held.brake,left:held.left||tiltSteer.left,right:held.right||tiltSteer.right,drift:held.drift,skill,recover});

function show(step){for(const id of ['join-form','pick','pad'])$(id).classList.toggle('hidden',id!==step);$('intro').classList.toggle('hidden',step==='pad');}

function askForCode(){show('join-form');$('code').value=params.code;$('join-form').onsubmit=e=>{e.preventDefault();const code=$('code').value.trim().toUpperCase();if(!validRoomCode(code)){status('Type the six-character code from the big screen.');return}params.code=code;pickBear();};}

function pickBear(){
 show('pick');status('Room '+params.code);
 $('bears').replaceChildren(...PARTY_BEARS.map(([id,name,color],bear)=>{const b=document.createElement('button');b.type='button';b.style.borderColor=color;b.innerHTML=`<img src="assets/drivers/thumbs/${id}.webp?v=75" alt=""><span>${name}</span>`;b.onclick=()=>join(bear,b);return b;}));
}

async function join(bear,button){
 for(const b of $('bears').children)b.disabled=true;status('Joining…');
 const next=new RaceRoom();next.readInput=input;
 next.onState=state=>{if(room!==next)return;const me=state.members.find(m=>m.bear===bear);if(state.phase!==lastPhase){lastPhase=state.phase;if(state.phase==='racing'){buzz([60,40,60]);status('Race on! Eyes on the big screen.');}else if(state.phase==='lobby')status('Ready! Waiting for the host to start.');}if(!me&&state.phase!=='lobby')status('The race has finished. Leave to join again.');};
 next.onError=e=>{if(room===next)status(e.message||'Connection hiccup — hold on…');};
 try{room=next;await next.open('join',bear,params.code,params.track);await next.ready(true);}
 catch(e){room=null;for(const b of $('bears').children)b.disabled=false;status(e.message||'Could not join. Check the code.');if(e.status===404||e.status===410){askForCode();}return;}
 const [id,name,color]=PARTY_BEARS[bear];$('me-img').src=`assets/drivers/thumbs/${id}.webp?v=75`;$('me-name').textContent=name;document.body.style.setProperty('--me',color);
 show('pad');status('Ready! Waiting for the host to start.');buzz(40);keepAwake();
}

// Hold-to-press buttons. Pointer capture keeps a key held while a thumb slides a little.
function bindHold(id,key){const el=$(id);const on=e=>{e.preventDefault();el.setPointerCapture?.(e.pointerId);held[key]=true;el.classList.add('on');};const off=()=>{held[key]=false;el.classList.remove('on');};el.addEventListener('pointerdown',on);for(const t of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(t,off);}
function bindTap(id,fn){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();el.classList.add('on');fn();buzz(25);});for(const t of ['pointerup','pointercancel','pointerleave'])el.addEventListener(t,()=>el.classList.remove('on'));}
bindHold('left','left');bindHold('right','right');bindHold('drive','throttle');bindHold('brake','brake');bindHold('drift','drift');
bindTap('power',()=>{skill++;});bindTap('recover',()=>{recover++;});

$('tilt').onclick=async()=>{
 if(!tilt&&typeof DeviceOrientationEvent?.requestPermission==='function'){try{if(await DeviceOrientationEvent.requestPermission()!=='granted'){status('Tilt needs motion permission.');return}}catch{status('Tilt is not available.');return}}
 tilt=!tilt;tiltSteer={left:false,right:false};$('tilt').textContent='Tilt: '+(tilt?'on':'off');$('tilt').setAttribute('aria-pressed',String(tilt));
};
addEventListener('deviceorientation',e=>{if(!tilt)return;const landscape=Math.abs(screen.orientation?.angle??0)===90;const roll=landscape?(screen.orientation.angle===90?e.beta:-e.beta):e.gamma;tiltSteer=tiltToSteer(roll);});

$('leave').onclick=async()=>{const r=room;room=null;await r?.leave();for(const k of Object.keys(held))held[k]=false;status('You left the room.');pickBear();};
async function keepAwake(){try{wakeLock=await navigator.wakeLock?.request('screen');}catch{}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&room)keepAwake();else for(const k of Object.keys(held))held[k]=false;});

if(params.code)pickBear();else askForCode();
