import {DIFFICULTIES,readDifficulty} from './difficulty.js?v=76';
import {RaceHighlight} from './race-highlight.js?v=75';
import {nextGoal,nearestRival} from './replay-goal.js?v=75';
import {createRareShard,readShards} from './rare-shard.js?v=75';
import {coursePreview} from './menu-art.js?v=75';
import {createRaceMap} from './race-map.js?v=75';
import {loadShowcaseSurfaces,applyShowcaseSurfaces} from './showcase.js?v=75';
import {loadCourseBackdrop,applyCourseBackdrop} from './course-backdrop.js?v=75';
import {TRIAL_RULES,displayTime,cleanProgress} from './trial-rules.js?v=75';
import {loadMeshyScenery,placeMeshyScenery,placeCourseScenery} from './meshy-scenery.js?v=75';
import {recoverStalledRival,driftTier,driftBoost,rivalPlan,racingLineLane,cornerSpeedLimit,shouldUseAIItem,ACHIEVEMENTS,readCollection,award,interpolateGhost,validGhost} from './race-extras.js?v=76';
import {createTrialUI,trialAPI} from './trial-ui.js?v=75';
import {createWinnerStage} from './winner-stage.js?v=75';
import {createQualityGovernor} from './mobile-quality.js?v=75';
import {createMobileControls} from './mobile-controls.js?v=75';
import {createFilmLook,roundedBox} from './film-look.js?v=75';
import {updateProgress,displayedLap} from './race-progress.js?v=75';
import {KART_STYLES,impactPenalty} from './kart-style.js?v=75';
import {dressCourse} from './scenery.js?v=77';
import {createWinnerVideo} from './winner-video.js?v=75';
import {newCup,validCup,validCupId,scoreRound,standings,tourTracks,CUP_TRACKS,CUP_POINTS,CUPS} from './cup.js?v=75';
import {TRACKS,makeTrack,routeStep,jumpStep} from './tracks.js?v=78';
import {loadProgress,saveProgress,SHOP,buy as buyItem,equip as equipItem,awardRace,dailyFor,completeDaily,awardShard,cupMedal} from './progression.js?v=75';
import * as THREE from './assets/three.module.js?v=75';
import {advance,advanceManual,syncManualContact,solveContacts,wrapDelta,findRecoverySpot,KART} from './physics.js?v=75';
import {CRYSTALS,PICKUP_COUNT,collectCrystal,activateSkill,skillEffects} from './skills.js?v=75';
import {createWeather,stepWeather,traction} from './weather.js?v=75';
import {launchCrystal,advanceShots} from './combat.js?v=75';
import {ITEM_POWERS,selectItem,comebackBoost,crystalRollBoost,kartStats,slipstreaming} from './gameplay.js?v=75';
import {loadDrivers,createDriver,animateDriver} from './models.js?v=75';
import {RaceRoom} from './network.js?v=75';
import {RaceAudio} from './audio.js?v=78';
import {startHeart,pressHeart,heartExpired,heartReward,createHeartUI} from './crystal-heart.js?v=78';
import {stepResonance,playerResonance} from './resonance.js?v=78';
const audio=new RaceAudio();
let countdownVoiceForRun=null,countdownVoiceGoAt=0;
let heart=null;const heartUI=createHeartUI();
let resonanceState={},resonanceHinted=false,resonanceBeam=null;
let difficulty=readDifficulty();
let timeTrial=new URLSearchParams(globalThis.location?.search||'').get('tt')==='1',trialAttempt=null,trialStart=0,trialSplits=[],trialUI=null,trialTarget=null,trialLoading=false,trialGeneration=0,trialSlowFrames=0;
let cosmetics={};try{cosmetics=JSON.parse(localStorage.getItem('kart-looks')||'{}')}catch{}
let rival=null,rivalGap=0,rivalCueAt=0;
let rareShard;let shardCollection=readShards();
let ghostMode=false,ghostKart=null,ghostData=null,ghostSamples=[],lastGhostSample=-1,runStats=null;
let collection=readCollection(),newStickers=[],personalMessage='';
let roundB=loadProgress();for(const [id,won] of Object.entries(readShards()))if(won===true&&!roundB.shards.includes(id))roundB.shards.push(id);if(roundB.shards.length>=11&&!roundB.owned.includes('golden-kart'))roundB.owned.push('golden-kart');
const winnerStage=createWinnerStage();
function resetRun(){raceHighlight.reset();rival=null;rivalGap=0;rivalCueAt=0;runStats={lapStart:0,lapHits:0,clean:false,shortcut:false,enteredShortcut:false,types:new Set(),gold:false,worst:1,lapTimes:[],eligible:true};ghostSamples=[];lastGhostSample=-1;newStickers=[];personalMessage='';}
function loadGhost(){try{const d=JSON.parse(localStorage.getItem((timeTrial?'kart-trial-ghost-v1-':'kart-ghost-v1-')+trackId)||'null');return validGhost(d)?d:null;}catch{return null;}}
function recordGhost(force=false){if(room||practice||!runStats?.eligible||elapsed>600)return;if(!force&&elapsed-lastGhostSample<.1)return;
 const t=player.time??elapsed;if(ghostSamples.length&&t<=ghostSamples.at(-1)[0])return;
 ghostSamples.push([t,player.s,player.lane,player.heading,player.airHeight||0,player.route||0]);lastGhostSample=elapsed;}
function clearGhost(){if(ghostKart){scene.remove(ghostKart.group);disposeObjectTree(ghostKart.group);ghostKart=null;}}
function prepareGhost(){clearGhost();ghostData=loadGhost();if(!ghostMode||!ghostData||room)return;
 ghostKart=makeKart(characters[ghostData.ci]);ghostKart.group.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();const tint=m=>{const c=m.clone();c.transparent=true;c.opacity=.24;c.depthWrite=false;return c;};o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);o.castShadow=false;}});
 ghostKart.shield.visible=false;ghostKart.flames.forEach(f=>f.visible=false);}
function updateGhost(dt){if(!ghostKart)return;const state=interpolateGhost(ghostData.samples,elapsed,length);ghostKart.group.visible=!!state&&mode==='racing';if(!state)return;
 const f=frame(state.s,state.lane,state.route,ghostFrameTarget);ghostKart.group.position.copy(f.p);ghostKart.group.position.y+=.1+state.airHeight;ghostKart.group.rotation.y=state.heading;
 ghostKart.wheels.forEach(w=>w.spin.rotation.x+=dt*25/.56);}
function saveRunRewards(rank){if(practice||!runStats)return;const ids=[];
 if(player.time!==null){ids.push('racer:'+characters[selected].id,'track:'+trackId);
 if(runStats.clean)ids.push('clean');if(runStats.shortcut)ids.push('shortcut');if(runStats.types.size>=3)ids.push('crystals');if(runStats.gold)ids.push('drift');
 if(!ghostMode&&runStats.worst-rank>=3)ids.push('comeback');
 if(cup&&cup.results.length===tourTracks(cup).length&&cup.stats?.length===tourTracks(cup).length&&cup.stats.every(round=>round.find(x=>x.ci===selected)?.time!=null))ids.push('tour');
 const best=loadGhost();if(!room&&runStats.eligible){recordGhost(true);if(!best||player.time<best.time){
  if(best)ids.push('best');const data={version:1,time:player.time,ci:selected,samples:ghostSamples};
  if(validGhost(data))try{localStorage.setItem((timeTrial?'kart-trial-ghost-v1-':'kart-ghost-v1-')+trackId,JSON.stringify(data));}catch{toast('This device could not save the ghost.');}
 }}
 const lap=Math.min(...runStats.lapTimes),old=collection.bestLaps[trackId];
 if(Number.isFinite(lap)&&lap>0&&(!old||lap<old)){collection.bestLaps[trackId]=lap;personalMessage=old?'Your best lap yet!':'First lap record set!';}
 }
 newStickers=award(collection,ids);
 if(ids.includes('comeback'))personalMessage='Brilliant comeback!';else if(ids.includes('shortcut'))personalMessage='You found a new route!';else if(ids.includes('clean'))personalMessage='A beautifully clean lap!';
 try{localStorage.setItem('crystal-stickers-v1',JSON.stringify(collection));}catch{toast('Stickers will stay here until you close the game.');}
 $('race-achievement').textContent=[personalMessage,newStickers.length?newStickers.length+' new stickers!':''].filter(Boolean).join(' · ');
}

let menuStep=null,raceRequested=false,pendingTour=0;
let practice=false,stuckSeconds=0,lastHUD=0;
const paints=[null,0x39cde5,0xffc64d,0xce8bff,0xff9ded];
const shardCount=()=>Object.keys(TRACKS).filter(id=>shardCollection[id]===true).length;
let raceRewards=0,paintChoice=0;
try{raceRewards=Math.max(0,Number(localStorage.getItem('kart-finishes'))||0);paintChoice=Math.min(4,Math.max(0,Number(localStorage.getItem('kart-paint'))||0));if(paintChoice===4?shardCount()<3:paintChoice>raceRewards)paintChoice=0;}catch{}

let weather=createWeather();
let modelsReady=false;
let shots=[];const shotMeshes=[],honeyPuddles=[],honeyPool=[];
let room=null,onlineStarted=false,remoteSkill=0,remoteRecover=0,networkReady=false,lastSnapshotElapsed=-1;
const $=id=>document.getElementById(id),TAU=Math.PI*2;
const characters=[{id:'keen',name:'Keen',trait:'Courage',color:0x19b9dd,fur:0x16aed1,note:'Courage in every corner'},{id:'aida',name:'Aida',trait:'Confidence',color:0xbe7ee9,fur:0xc4a1d4,note:'Believe in your next move'},{id:'sunny',name:'Sunny',trait:'Joy',color:0xffc347,fur:0xf8b631,note:'A little sunshine at full speed'},{id:'misty',name:'Misty',trait:'Trust',color:0xb8d9ef,fur:0xe3e8fa,note:'Trust yourself through the turns'},{id:'amie',name:'Amie',trait:'Understanding',color:0xf27da8,fur:0xe86a9a,note:'Every adventure is better together'},{id:'howey',name:'Howey',trait:'Kindness',color:0x83a2a8,fur:0x68757a,note:'A big heart on the starting line'},{id:'luna',name:'Luna',trait:'Calm',color:0xb698dc,fur:0xb89bd1,note:'A calm mind in every corner'}];
characters.push({id:'zenny',name:'Zenny',trait:'Bee racer',color:0xf5c447,fur:0xf0bc35,bee:true},{id:'fuzzby',name:'Fuzzby',trait:'Bee racer',color:0xe5a52a,fur:0xe0ab2e,bee:true});
characters.forEach(c=>c.power=CRYSTALS[c.id]);const crystalCharacters=characters.filter(c=>['keen','misty','amie'].includes(c.id));
let selected=0,mode='menu',elapsed=0,countTime=0,lastCount=0,totalCrystals=0,toastUntil=0,driftCharge=0,wasDrifting=false,finished=[],player,bots=[],karts=[],boostTime=0,recoverUntil=0,steer=0,seed=47291,momentUntil=0,finishSlowUntil=0;
try{const saved=Number(sessionStorage.getItem('kart-racer'));if(Number.isInteger(saved)&&saved>=0&&saved<characters.length)selected=saved;}catch{}
let cup=null;const cupRequested=new URLSearchParams(globalThis.location?.search||'').get('cup')==='1';try{const saved=JSON.parse(sessionStorage.getItem('crystal-cup')||localStorage.getItem('crystal-tour-save')||'null');if(cupRequested&&validCup(saved))cup=saved;}catch{}if(cup)selected=cup.bear;
function saveCup(){try{sessionStorage.setItem('crystal-cup',JSON.stringify(cup));localStorage.setItem('crystal-tour-save',JSON.stringify(cup));return true}catch{toast('Cup progress needs browser storage enabled.');return false}}
function saveRoundB(){if(!saveProgress(roundB))toast('Progress could not be saved on this device.')}
function roundBShardCount(){return roundB.shards.length}
const keys=new Set(),rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const fmt=t=>`${Math.floor(t/60)}:${(t%60).toFixed(1).padStart(4,'0')}`;
function tone(...args){audio.tone(...args)}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');toastUntil=performance.now()+2000}
function triggerBigMoment(color=0x9ffaff){momentUntil=performance.now()+360;const flash=$('moment-flash');flash.style.background='radial-gradient(circle at 50% 55%, #ffffffaa 0, #'+color.toString(16).padStart(6,'0')+'88 19%, transparent 60%)';flash.classList.remove('active');void flash.offsetWidth;flash.classList.add('active');document.body.classList.remove('race-jolt');void document.body.offsetWidth;document.body.classList.add('race-jolt');setTimeout(()=>{flash.classList.remove('active');document.body.classList.remove('race-jolt')},380);if(player&&player.kart){const f=racerFrame(player);for(let i=0;i<9;i++){const p=f.p.clone();p.y+=.7+(i%3)*.42;p.x+=(Math.random()-.5)*2.5;p.z+=(Math.random()-.5)*2.5;puff(p,color)}}}
function renderCharacters(){ $('characters').innerHTML=characters.map((c,i)=>{const stats=kartStats(i);return `<button class="character ${i===selected?'selected':''}" aria-pressed="${i===selected}" data-racer="${i}"><img src="assets/drivers/thumbs/${c.id}.webp?v=75" alt="${c.name} welcoming you to race" decoding="async" fetchpriority="high" style="--racer-accent:#${c.color.toString(16).padStart(6,'0')}"><div><strong>${c.name}</strong><small>${c.trait}</small><span class="racer-stats" aria-label="Speed, acceleration, handling, weight">${stats.map((v,n)=>`<span title="${['Speed','Acceleration','Handling','Weight'][n]}">${['SPD','ACC','HND','WT'][n]} ${'★'.repeat(v)}${'☆'.repeat(5-v)}</span>`).join('')}</span><span class="racer-go">Let’s race →</span></div>${i===selected?'<span class="check">✓</span>':''}</button>`}).join('');const chosen=characters[selected];$('racer-note').textContent=chosen.power.crystal+' · '+chosen.trait+' · '+chosen.power.skill;$('skill-description').textContent=chosen.power.skill+' charges after three crystal boxes. Boxes also spin up a friendly surprise power.';document.querySelectorAll('[data-racer]').forEach(b=>b.onclick=()=>{if(cup){toast('Your Cup racer is '+characters[cup.bear].name+'. Return to the garage to change.');return}selected=Number(b.dataset.racer);try{sessionStorage.setItem('kart-racer',String(selected))}catch{}renderCharacters();makeRacers();if(pendingTour){const count=pendingTour;pendingTour=0;beginCup(count);}else if(menuStep)menuStep('track');tone(440)})}
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});}catch{$('error').classList.remove('hidden');throw Error('WebGL unavailable')}
const mobileDevice=matchMedia('(any-pointer:coarse)').matches||navigator.maxTouchPoints>0;
const highlightButton=document.createElement('button');highlightButton.className='secondary';highlightButton.hidden=true;highlightButton.textContent='Funny moment ▶';document.querySelector('.result-links').prepend(highlightButton);
const highlightDialog=document.createElement('dialog');highlightDialog.className='highlight-dialog';highlightDialog.innerHTML='<h2>Your race moment</h2><video controls playsinline muted></video><div><a download="crystal-karts-moment.webm">Save clip</a><button>Back to results</button></div>';document.body.append(highlightDialog);
const highlightVideo=highlightDialog.querySelector('video');highlightDialog.querySelector('button').onclick=()=>highlightDialog.close();highlightDialog.addEventListener('close',()=>highlightVideo.pause());
const raceHighlight=new RaceHighlight($('world'),clip=>{highlightButton.hidden=!clip;if(clip){highlightVideo.src=clip.url;highlightDialog.querySelector('h2').textContent=clip.label;const link=highlightDialog.querySelector('a');link.href=clip.url;link.download='crystal-karts-moment.'+clip.extension;}else{highlightVideo.removeAttribute('src');highlightDialog.close();}});
highlightButton.onclick=()=>{winnerVideo.stop();highlightDialog.showModal();highlightVideo.play().catch(()=>{});};
const lowEndDevice=mobileDevice&&(((navigator.deviceMemory||0)>0&&(navigator.deviceMemory||0)<=4)||((navigator.hardwareConcurrency||0)>0&&navigator.hardwareConcurrency<=4)),initialPixelRatio=Math.min(devicePixelRatio,mobileDevice?1:2);
renderer.setPixelRatio(initialPixelRatio);document.body.classList.toggle('reduced-effects',mobileDevice||lowEndDevice);
const qualitySample=createQualityGovernor(ratio=>renderer.setPixelRatio(Math.min(devicePixelRatio,ratio,mobileDevice?1:2)),initialPixelRatio);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=!lowEndDevice;renderer.shadowMap.type=mobileDevice?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9dcfcf);scene.fog=new THREE.FogExp2(0x9dcfcf,.0037);const camera=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,.1,1800),cameraTarget=new THREE.Vector3(),cameraLook=new THREE.Vector3(),cameraForward=new THREE.Vector3(),cameraAhead=new THREE.Vector3(),sunOffset=new THREE.Vector3(-90,150,60);
scene.add(new THREE.HemisphereLight(0xd5ffff,0x294544,2.5));const sun=new THREE.DirectionalLight(0xffe1ab,3.1);sun.position.set(-90,150,60);sun.castShadow=!lowEndDevice;sun.shadow.mapSize.set(...(mobileDevice?(lowEndDevice?[512,512]:[1024,1024]):[2048,2048]));Object.assign(sun.shadow.camera,{left:-200,right:200,top:200,bottom:-200,near:1,far:500});sun.shadow.bias=-.001;scene.add(sun);scene.add(sun.target);
const mat=(c,options={})=>new THREE.MeshStandardMaterial({color:c,roughness:.75,...options});const roadMat=mat(0xccb791),edgeMat=mat(0xe9dcc1),grassMat=mat(0x44836e),trunkMat=mat(0x685145),leafMats=[mat(0x2c735f),mat(0x3c9674),mat(0x5daa80),mat(0x226653)];
const drySky=new THREE.Color(0x558caa),rainSky=new THREE.Color(0x667c91),dryRoad=roadMat.color.clone(),wetRoad=new THREE.Color(0x756e61);
const rainVertices=new Float32Array(420*6),rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainVertices,3));
const rainMaterial=new THREE.LineBasicMaterial({color:0xcce9ff,transparent:true,opacity:0,depthWrite:false});
const rainLines=new THREE.LineSegments(rainGeometry,rainMaterial);rainLines.frustumCulled=false;scene.add(rainLines);
function updateWeatherVisuals(){
 scene.background.copy(drySky).lerp(rainSky,weather.rain);scene.fog.color.copy(scene.background);scene.fog.density=(trackId==='showcase'?.0017:.0037)+weather.rain*.0018;
 sun.intensity=(scenery?.light??3.1)*(1-weather.rain*.68);roadMat.color.copy(dryRoad).lerp(wetRoad,weather.wetness);roadMat.roughness=.75-weather.wetness*.5;scenery?.setWetness?.(weather.wetness);
 rainLines.visible=weather.rain>0;rainMaterial.opacity=weather.rain*.48;
 if(rainLines.visible&&player){const f=racerFrame(player,player.s,player.lane);rainLines.position.copy(f.p);
  for(let i=0;i<420;i++){const j=i*6,x=((i*17.31)%80)-40,z=((i*29.17)%80)-40,y=((i*7.13-elapsed*34)%38+38)%38;
   rainVertices[j]=x;rainVertices[j+1]=y;rainVertices[j+2]=z;rainVertices[j+3]=x+.45;rainVertices[j+4]=y-1.8;rainVertices[j+5]=z+.2;
  }rainGeometry.attributes.position.needsUpdate=true;
 }
 $('weather').textContent=weather.phase==='rain'?'RAIN · SLIPPERY TRACK':weather.phase==='drying'?(track.night?'MOONLIGHT · TRACK DRYING':'SUNSHINE · TRACK DRYING'):weather.started?(track.night?'MOONLIGHT · DRY TRACK':'SUNSHINE · DRY TRACK'):(track.night?'NIGHT RACE · RAIN AHEAD':'SUNSHINE · RAIN AHEAD');
}
const softBoxGeo=roundedBox();
const sphereGeo=new THREE.SphereGeometry(1,24,16),boxGeo=new THREE.BoxGeometry(1,1,1),gemGeo=new THREE.OctahedronGeometry(1,0),trunkGeo=new THREE.CylinderGeometry(.5,.8,1,12);
function mesh(geo,material,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,parent=scene){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m}
const requestedTrack=new URLSearchParams(globalThis.location?.search||'').get('track'),trackId=Object.hasOwn(TRACKS,requestedTrack)?requestedTrack:'wood';
const track=makeTrack(trackId),{curve,length}=track,finishDistance=length*3,frame=track.frame;
const createFrameTarget=()=>({p:new THREE.Vector3(),t:new THREE.Vector3(),right:new THREE.Vector3()}),racerFrameTargets=new WeakMap(),ghostFrameTarget=createFrameTarget(),powerFrameTarget=createFrameTarget();
const racerFrame=(r,s=r.s,lane=0)=>{let target=racerFrameTargets.get(r);if(!target){target=createFrameTarget();racerFrameTargets.set(r,target)}return frame(s,lane,r.route||0,target)};
if(cup&&tourTracks(cup)[cup.round]!==trackId){location.replace('?track='+tourTracks(cup)[cup.round]+'&cup=1');}
$('track-select').innerHTML=Object.entries(TRACKS).map(([id,t])=>'<option value="'+id+'">'+t.name+'</option>').join('');$('track-select').value=trackId;$('track-select').onchange=e=>{if(room||cup){toast('Finish or leave your race series before changing tracks.');e.target.value=trackId;return}location.href='?track='+e.target.value+'&step=track&race=1'+(timeTrial?'&tt=1':'')};
$('track-title').textContent=track.name;$('track-eyebrow').textContent=track.name.toUpperCase();$('map-title').textContent=track.name.toUpperCase();$('track-detail').textContent=track.description;$('track-number').textContent=String(Object.keys(TRACKS).indexOf(trackId)+1).padStart(2,'0')+' / '+Object.keys(TRACKS).length+' ADVENTURES';
function ribbon(width,height,material){const positions=[],uvs=[],indices=[],N=600;for(let i=0;i<=N;i++){const{p,right}=frame(i/N*length);for(const side of [-1,1]){positions.push(p.x+right.x*width*side,p.y+height,p.z+right.z*width*side);uvs.push(trackId==='showcase'?(side+1)*width/6:(side+1)/2,trackId==='showcase'?i/N*length/6:i/8)}if(i<N){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3)}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();const m=new THREE.Mesh(geo,material);m.receiveShadow=true;scene.add(m);return m}
// Earth banks support raised portions of the circuit.
if(trackId!=='showcase')for(const side of [-1,1]){const vertices=[],indices=[];for(let i=0;i<=500;i++){const f=frame(i/500*length,side*11.4);vertices.push(f.p.x,f.p.y-.1,f.p.z,f.p.x,-1.25,f.p.z);if(i<500&&!(trackId==='river'&&i/500>=.15&&i/500<=.29)){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();scene.add(new THREE.Mesh(g,mat(0x729780,{side:THREE.DoubleSide})))}
ribbon(11.4,-.1,edgeMat);ribbon(9.4,.02,roadMat);const land=mesh(new THREE.CircleGeometry(1100,100),grassMat,0,-1.2,0);land.rotation.x=-Math.PI/2;land.receiveShadow=true;if(trackId==='showcase'){const p=land.geometry.attributes.position,uv=land.geometry.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/6,p.getY(i)/6);uv.needsUpdate=true;}
const markerMat=mat(0xc6f1df,{emissive:0x4eaa8e,emissiveIntensity:.35});
function isNearTrack(x,z,margin){for(const b of [...track.shortcuts,track.rushRoute].filter(Boolean))for(let i=0;i<=40;i++){const p=b.path.getPointAt(i/40);if((p.x-x)**2+(p.z-z)**2<margin**2)return true}for(let i=0;i<140;i++){const p=curve.getPointAt(i/140);if((p.x-x)**2+(p.z-z)**2<margin**2)return true}return false}
// Instanced woodland: hundreds of real 3D trees, with clustered canopies.
const treePositions=[];for(let i=0;i<(trackId==='showcase'?0:trackId==='coast'?90:trackId==='honey'?180:350);i++){const x=(rand()-.5)*650,z=(rand()-.5)*600;if(isNearTrack(x,z,45))continue;treePositions.push({x,z,h:15+rand()*30,r:7+rand()*10})}
const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,treePositions.length),crowns=leafMats.map(m=>new THREE.InstancedMesh(new THREE.SphereGeometry(1,16,12),m,treePositions.length));const dummy=new THREE.Object3D();treePositions.forEach((t,i)=>{dummy.position.set(t.x,t.h/2-1,t.z);dummy.scale.set(t.r*.38,t.h,t.r*.38);dummy.rotation.set(0,rand()*TAU,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);for(let j=0;j<4;j++){dummy.position.set(t.x+Math.sin(j*2)*t.r*.43,t.h+(j%2)*t.r*.3,t.z+Math.cos(j*2)*t.r*.43);dummy.scale.set(t.r,t.r*.8,t.r);dummy.updateMatrix();crowns[j].setMatrixAt(i,dummy.matrix)}});scene.add(trunks);crowns.forEach(m=>{m.castShadow=true;m.receiveShadow=true;scene.add(m)});
// The Great Oak forms a landmark in the heart of the circuit.
const oak=new THREE.Group();scene.add(oak);oak.position.set(17,-1,-16);mesh(new THREE.CylinderGeometry(5,9,46,10),trunkMat,0,23,0,1,1,1,oak).castShadow=true;for(let i=0;i<12;i++){const a=i/12*TAU,r=12+rand()*13,m=mesh(new THREE.IcosahedronGeometry(1,2),leafMats[i%4],Math.sin(a)*r,40+rand()*17,Math.cos(a)*r,19,13,18,oak);m.castShadow=true;const branch=mesh(trunkGeo,trunkMat,Math.sin(a)*8,29+rand()*8,Math.cos(a)*8,4,22,4,oak);branch.rotation.z=Math.sin(a)*.8;branch.rotation.x=Math.cos(a)*.8}
const canopyPoints=[],canopyColors=[];for(let i=0;i<500;i++){const a=rand()*TAU,r=Math.sqrt(rand())*34;canopyPoints.push(17+Math.sin(a)*r,35+rand()*24,-16+Math.cos(a)*r);const c=new THREE.Color(i%3?0x83fff0:0xffd687);canopyColors.push(c.r,c.g,c.b)}
const glowGeometry=new THREE.BufferGeometry();glowGeometry.setAttribute('position',new THREE.Float32BufferAttribute(canopyPoints,3));glowGeometry.setAttribute('color',new THREE.Float32BufferAttribute(canopyColors,3));if(trackId!=='showcase')scene.add(new THREE.Points(glowGeometry,new THREE.PointsMaterial({size:.48,vertexColors:true,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false})));
const gemMats=[mat(0x6fefff,{metalness:.35,roughness:.16,emissive:0x23bdde,emissiveIntensity:.5}),mat(0xffa5d0,{metalness:.2,roughness:.18,emissive:0xf056a9,emissiveIntensity:.4}),mat(0xc5a0ff,{metalness:.25,roughness:.18,emissive:0x814bff,emissiveIntensity:.5})];
// Small flowers and stones along the verge.
// Keep the pastel verge flowers, but give each one a clear flower shape rather
// than a glowing-looking ball: a short stem, five petals and a small centre.
if(trackId!=='showcase'){
 const flowerCount=220,flowerDummy=new THREE.Object3D(),flowerGroup=new THREE.Group(),stemGeo=new THREE.CylinderGeometry(.035,.055,.4,5),stemMat=mat(0x538b58),petalGeo=new THREE.SphereGeometry(1,10,7),flowerMats=[mat(0xefacd7),mat(0xf7d66c),mat(0xaaa4ed)],flowerStems=new THREE.InstancedMesh(stemGeo,stemMat,flowerCount),flowerCentres=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,7),mat(0xffdf78),flowerCount),flowerPetals=flowerMats.map(m=>new THREE.InstancedMesh(petalGeo,m,Math.ceil(flowerCount/3)*5)),petalCounts=[0,0,0];
 flowerGroup.name='verge-flowers';
 for(let i=0;i<flowerCount;i++){
  const f=frame(rand()*length,(rand()>.5?1:-1)*(12+rand()*7)),kind=i%3,x=f.p.x,z=f.p.z;
  flowerDummy.position.set(x,-1.01,z);flowerDummy.rotation.set(0,0,0);flowerDummy.scale.set(1,1,1);flowerDummy.updateMatrix();flowerStems.setMatrixAt(i,flowerDummy.matrix);
  flowerDummy.position.set(x,-.78,z);flowerDummy.scale.set(.11,.08,.11);flowerDummy.updateMatrix();flowerCentres.setMatrixAt(i,flowerDummy.matrix);
  for(let j=0;j<5;j++){const a=j/5*TAU,idx=petalCounts[kind]++;flowerDummy.position.set(x+Math.sin(a)*.19,-.79,z+Math.cos(a)*.19);flowerDummy.rotation.set(0,-a,0);flowerDummy.scale.set(.12,.045,.19);flowerDummy.updateMatrix();flowerPetals[kind].setMatrixAt(idx,flowerDummy.matrix);}
 }
 flowerStems.receiveShadow=true;flowerCentres.castShadow=true;flowerPetals.forEach((m,i)=>{m.count=petalCounts[i];m.castShadow=true;flowerGroup.add(m)});flowerGroup.add(flowerStems,flowerCentres);scene.add(flowerGroup);
}
const water=mesh(new THREE.CircleGeometry(43,64),mat(0x57bac1,{metalness:.6,roughness:.2}),-58,-.8,12);water.rotation.x=-Math.PI/2;
// Starting arch and chequered grid.
const startF=frame(0),arch=new THREE.Group();arch.position.copy(startF.p);arch.rotation.y=Math.atan2(startF.t.x,startF.t.z);scene.add(arch);const archMat=mat(0x486d69);for(const x of [-12,12]){mesh(boxGeo,archMat,x,6,0,1,12,1,arch);mesh(sphereGeo,markerMat,x,13,0,1.2,1.2,1.2,arch)}mesh(boxGeo,archMat,0,11.5,0,25,1.8,1,arch);for(let i=0;i<12;i++)for(let j=0;j<2;j++)mesh(boxGeo,mat((i+j)%2?0x335c5b:0xfaf4df),-8.8+i*1.6,.08,j*1.5,1.6,.08,1.5,arch);
function label(text){const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#dcfff1';ctx.font='bold 70px sans-serif';ctx.textAlign='center';ctx.fillText(text,512,91);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide})}const sign=mesh(new THREE.PlaneGeometry(20,2.5),label('CRYSTAL KARTS'),0,11.5, .6,1,1,1,arch);sign.rotation.y=Math.PI;
if(trackId==='river'){
 const timber=mat(0x82593d),rail=mat(0xc39461),waterMat=mat(0x42a6bd,{metalness:.55,roughness:.18});
 const river=mesh(boxGeo,waterMat,120,-.5,0,65,.15,180);river.receiveShadow=true;
 for(let i=0;i<=44;i++){const f=frame(length*(.15+i/44*.14));const deck=mesh(boxGeo,timber,f.p.x,f.p.y+.07,f.p.z,19,.18,2.9);deck.rotation.y=Math.atan2(f.t.x,f.t.z);if(i%3===0)for(const side of [-1,1]){const p=f.p.clone().addScaledVector(f.right,10);mesh(boxGeo,rail,p.x,p.y+1.1,p.z,.35,2.2,.35);mesh(boxGeo,timber,p.x,(p.y-1)/2,p.z,.7,p.y+1,.7);const bar=mesh(boxGeo,rail,p.x,p.y+2,p.z,.22,.22,9);bar.rotation.y=deck.rotation.y;}}
 function board(at,lane,text){const f=frame(at,lane),g=new THREE.Group();g.position.copy(f.p);g.rotation.y=Math.atan2(f.t.x,f.t.z);scene.add(g);mesh(boxGeo,timber,0,2,0,.25,4,.25,g);const sign=mesh(new THREE.PlaneGeometry(8,1.2),label(text),0,4,0,1,1,1,g);sign.rotation.y=Math.PI;}
 for(const at of track.ramps){const g=new THREE.Group(),f=frame(at-4);g.position.copy(f.p);g.rotation.y=Math.atan2(f.t.x,f.t.z);scene.add(g);const ramp=mesh(boxGeo,rail,0,.8,0,18,.22,8,g);ramp.rotation.x=-Math.atan(1.6/8);for(const z of [-2,0,2])mesh(boxGeo,gemMats[0],0,1+z*.2,z,12,.1,.3,g);board(at-20,-11,'JUMP · 65 KM/H');}
 for(const b of track.shortcuts){const positions=[],indices=[];for(let i=0;i<=100;i++){const f=frame(b.a+(b.b-b.a)*i/100,0,b.id);for(const side of [-1,1])positions.push(f.p.x+f.right.x*side*9.4,f.p.y+.04,f.p.z+f.right.z*side*9.4);if(i<100){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3)}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const road=new THREE.Mesh(geo,mat(0x95bea3,{side:THREE.DoubleSide}));road.receiveShadow=true;scene.add(road);board(b.a-18,11,'LEFT · SHORTCUT');}
}
if(trackId!=='river')for(const b of track.shortcuts){const positions=[],indices=[];for(let i=0;i<=72;i++){const f=frame(b.a+(b.b-b.a)*i/72,0,b.id);for(const side of [-1,1])positions.push(f.p.x+f.right.x*side*9.4,f.p.y+.04,f.p.z+f.right.z*side*9.4);if(i<72){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3)}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const road=new THREE.Mesh(geo,mat(0x95bea3,{side:THREE.DoubleSide}));road.receiveShadow=true;scene.add(road);const f=frame(b.a-18,11);const sign=mesh(boxGeo,markerMat,f.p.x,f.p.y+3,f.p.z,7,.5,.35);sign.rotation.y=Math.atan2(f.t.x,f.t.z);}
const crystalMaterials=Object.fromEntries(crystalCharacters.map(c=>[c.id,mat(c.power.color,{metalness:.25,roughness:.2,emissive:c.power.color,emissiveIntensity:.38})]));
const pickups=[];for(let i=0;i<PICKUP_COUNT;i++){
 const owner=crystalCharacters[i%crystalCharacters.length],s=(.055+i/PICKUP_COUNT*.91)*length,lane=[-4,0,4][i%3],f=frame(s,lane),g=new THREE.Group();g.position.copy(f.p);
 const material=crystalMaterials[owner.id];const crystal=mesh(gemGeo,material,0,1.9,0,.85,1.45,.85,g);
 if(owner.id==='howey')crystal.scale.set(1.1,1.15,.85);
 const ring=mesh(new THREE.TorusGeometry(1.15,.055,6,24),material,0,.15,0,1,1,1,g);ring.rotation.x=Math.PI/2;
 const name=new THREE.Sprite(new THREE.SpriteMaterial({map:label(owner.power.symbol+' '+owner.power.skill).map,transparent:true,depthWrite:false}));name.position.y=3.6;name.scale.set(5,1,1);g.add(name);
 scene.add(g);pickups.push({s,lane,owner:owner.id,g,crystal,name,usedLap:-1});
}
const secretShardAt=length*(.19+(Object.keys(TRACKS).indexOf(trackId)%7)*.085),secretShardFrame=frame(secretShardAt,0),secretShardMaterial=new THREE.MeshStandardMaterial({color:0xffed9a,emissive:0xf9b844,emissiveIntensity:1.1,metalness:.12,roughness:.18}),secretShard=mesh(new THREE.OctahedronGeometry(.72,0),secretShardMaterial,secretShardFrame.p.x,secretShardFrame.p.y+2.1,secretShardFrame.p.z),secretShardRing=mesh(new THREE.TorusGeometry(1.05,.08,6,24),secretShardMaterial,secretShardFrame.p.x,secretShardFrame.p.y+2.1,secretShardFrame.p.z);secretShardRing.rotation.x=Math.PI/2;secretShard.visible=secretShardRing.visible=false;
const hazards=[];for(const [u,lane] of [[.19,4],[.34,-4],[.49,1],[.67,5],[.84,-3]]){const f=frame(u*length,lane),m=mesh(new THREE.DodecahedronGeometry(1,0),mat(0x7e9388),f.p.x,f.p.y+.8,f.p.z,1.8,1.1,1.5);hazards.push({s:u*length,lane,m,halfWidth:1.8,halfLength:1.5,height:2.2})}
// Solid shortcut gate posts are gameplay hazards; keep only the collision geometry.
for(const b of track.shortcuts){for(const lane of [2.5,7.5]){const at=b.a-3,f=frame(at,lane),m=mesh(boxGeo,mat(0x627e85),f.p.x,f.p.y+1.8,f.p.z,.8,3.6,1.4);m.rotation.y=Math.atan2(f.t.x,f.t.z);hazards.push({s:at,lane,m,halfWidth:.4,halfLength:.7,height:3.6});}}
for(const p of pickups){if(hazards.some(h=>Math.abs(wrapDelta(h.s-p.s,length))<12&&Math.abs(h.lane-p.lane)<4.5)){p.lane=p.lane<=0?5:-5;p.g.position.copy(frame(p.s,p.lane).p)}}
const guideMarkers=Array.from({length:16},()=>{const m=mesh(sphereGeo,mat(0xe6fcff,{emissive:0x84e6ff,emissiveIntensity:1.5}),0,0,0,.32,.15,.32);m.visible=false;return m});
const scenery=dressCourse({scene,track,roadMat,edgeMat,grassMat,leafMats,sun,water,oak,frame,rand,lowPower:mobileDevice||lowEndDevice});drySky.setHex(scenery.sky);dryRoad.copy(roadMat.color);scene.background.copy(drySky);scene.fog.color.copy(drySky);
const tyreMat=mat(0x233342),rimMat=mat(0xe5b957,{metalness:.72,roughness:.23}),whiteMat=mat(0xfff6e6),blackMat=mat(0x172635),muzzleMat=mat(0xe6d9c1);
const filmLook=createFilmLook({scene,renderer,camera,sun,track,leafMats,trunkMat,grassMat,treePositions,frame,length,water});
function addKartHat(bear,c){const id=roundB.equipped.hat;if(!id||c.id!==characters[selected].id)return;const bounds=new THREE.Box3().setFromObject(bear),hat=new THREE.Group();hat.position.y=bounds.max.y+.02;bear.add(hat);const crystal=c.power?.color||0x81eaff,base=mat(id==='hat-racing-cap'?crystal:0xffd76a,{roughness:.55});
 if(id==='hat-flower'){mesh(new THREE.TorusGeometry(.31,.055,5,18),base,0,.08,0,1,1,.82,hat);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;mesh(sphereGeo,mat(0xff83b8),Math.cos(a)*.31,.10,Math.sin(a)*.25,.12,.10,.12,hat);}}
 else if(id==='hat-crystal-crown'){mesh(new THREE.CylinderGeometry(.37,.42,.13,8),base,0,.07,0,1,1,.82,hat);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const tip=mesh(new THREE.ConeGeometry(.12,.31,4),base,Math.cos(a)*.32,.25,Math.sin(a)*.26,1,1,1,hat);tip.rotation.z=Math.cos(a)*-.22;mesh(gemGeo,mat(crystal,{emissive:crystal,emissiveIntensity:.28}),Math.cos(a)*.32,.39,Math.sin(a)*.26,.11,.15,.11,hat);}}
 else if(id==='hat-racing-cap'){mesh(new THREE.SphereGeometry(.39,12,7,0,Math.PI*2,0,Math.PI/2),base,0,.13,0,1,1,.82,hat);mesh(sphereGeo,base,0,.12,.28,.49,.065,.25,hat);}
 else if(id==='hat-bee-antennae'){const dark=mat(0x263642),tip=mat(0xffd64d,{emissive:0xffd64d,emissiveIntensity:.18});for(const x of [-.20,.20]){const stem=mesh(new THREE.CylinderGeometry(.035,.05,.34,6),dark,x,.28,0,1,1,1,hat);stem.rotation.z=x<0?-.23:.23;mesh(sphereGeo,tip,x*1.2,.47,0,.11,.12,.11,hat);}}
}
function makeKart(c){const group=new THREE.Group(),bodyMat=new THREE.MeshStandardMaterial({color:c.id===characters[selected].id&&paintChoice?paints[paintChoice]:c.fur,roughness:.20,metalness:.28,envMapIntensity:1.1}),furMat=mat(c.fur);const body=new THREE.Group();body.position.y=.65;group.add(body);
// Open tub: a low floor and separate walls leave room for the driver.
mesh(softBoxGeo,blackMat,0,-.25,0,2.3,.18,3.2,body).receiveShadow=true;
for(const side of [-1,1]){mesh(softBoxGeo,bodyMat,side*1.12,.20,-.1,.24,.95,2.55,body).castShadow=true;mesh(softBoxGeo,rimMat,side*1.12,.70,-.1,.27,.10,2.6,body);}
mesh(softBoxGeo,bodyMat,0,.10,-1.42,2.4,.75,.24,body).castShadow=true;
mesh(softBoxGeo,tyreMat,0,-.08,-.42,1.55,.22,1.18,body);
const seat=mesh(softBoxGeo,tyreMat,0,.52,-.96,1.6,1.25,.24,body);seat.rotation.x=-.10;
for(const side of [-1,1])mesh(softBoxGeo,tyreMat,side*.77,.42,-.77,.18,.95,.42,body);
const style=KART_STYLES[c.id];mesh(sphereGeo,bodyMat,0,.75,1.3,...style.hood,group).castShadow=true;mesh(softBoxGeo,rimMat,0,.52,1.97,2.5,.2,.3,group);mesh(softBoxGeo,bodyMat,0,1,-1.55,2.9,.15,.55,group);const wheels=[];const wheelRim=roundB.equipped.wheels==='wheels-pearl'?mat(0xf4f0dd,{metalness:.68,roughness:.2}):rimMat;for(const x of [-1.4,1.4])for(const z of [-1.08,1.08]){const pivot=new THREE.Group();pivot.position.set(x,.53,z);group.add(pivot);const spin=new THREE.Group();pivot.add(spin);const w=mesh(new THREE.CylinderGeometry(.56,.56,.5,24),tyreMat,0,0,0,1,1,1,spin);w.rotation.z=Math.PI/2;w.castShadow=true;mesh(new THREE.CylinderGeometry(.3,.3,.52,20),wheelRim,0,0,0,1,1,1,spin).rotation.z=Math.PI/2;wheels.push({pivot,spin,front:z>0})}
// Personal paint, crystal nose badge, bear-ear fenders and readable rear plate.
const accent=mat(c.power?.color||0xffd365,{roughness:.20,metalness:.35,emissive:c.power?.color||0xffc447,emissiveIntensity:.15});
mesh(softBoxGeo,accent,0,1.18,1.30,style.stripe,.045,1.22,group);
for(const side of [-1,1]){
 const fender=mesh(sphereGeo,bodyMat,side*1.20,.94,-1.08,.38,.32+style.fin,.55,group);fender.castShadow=true;
 mesh(sphereGeo,accent,side*1.20,1.04+style.fin,-1.10,.22,.17,.25,group);
 mesh(softBoxGeo,accent,side*1.255,.72,-.1,.035,.14,2.3,group);
}
const badge=mesh(c.bee?new THREE.CylinderGeometry(.29,.29,.13,6):gemGeo,accent,0,.98,2.10,c.bee?1:.46,c.bee?1:.60,c.bee?1:.22,group);
if(c.bee){badge.rotation.x=Math.PI/2;for(const z of [.94,1.28,1.62])mesh(softBoxGeo,blackMat,0,1.23,z,1.05,.04,.14,group);}
// Crystal shoulders frame the driver without obscuring the face or steering wheel.
for(const side of [-1,1]){
 const crystal=mesh(gemGeo,accent,side*1.13,1.35,-1.38,.23,.60,.23,group);crystal.rotation.z=-side*.27;crystal.castShadow=true;
 const lamp=mesh(gemGeo,accent,side*.86,.91,1.88,.18,.23,.12,group);lamp.rotation.x=.20;
}
const plate=mesh(softBoxGeo,blackMat,0,.91,-1.87,1.72,.45,.06,group);plate.material.transparent=true;plate.material.opacity=.58;
const nameMaterial=label(c.name.toUpperCase());nameMaterial.side=THREE.FrontSide;nameMaterial.toneMapped=false;nameMaterial.opacity=.76;
const namePlate=mesh(new THREE.PlaneGeometry(1.58,.34),nameMaterial,0,.91,-1.918,1,1,1,group);namePlate.rotation.y=Math.PI;
for(const x of [-1,1])mesh(softBoxGeo,accent,x,.65,-1.91,.15,.12,.05,group);
const bear=createDriver(c)||new THREE.Group();group.add(bear);addKartHat(bear,c);const fit=bear.userData.wheel||{radius:.36,y:1.12,z:.65};
const steeringWheel=mesh(new THREE.TorusGeometry(fit.radius,.055,8,24),rimMat,0,fit.y,fit.z,1,1,1,bear);steeringWheel.rotation.x=-.55;
// Dashboard faces the driver and is sized below their hands.
const dashY=Math.max(.98,fit.y-.20);
mesh(softBoxGeo,tyreMat,0,dashY,1.12,1.85,.28,.30,group);
const column=mesh(new THREE.CylinderGeometry(.06,.06,.48,8),rimMat,0,fit.y-.14,fit.z+.12,1,1,1,bear);column.rotation.x=-.8;
mesh(sphereGeo,blackMat,0,0,0,.13,.13,.05,steeringWheel);
for(const angle of [0,Math.PI*.66,Math.PI*1.33]){const spoke=mesh(softBoxGeo,rimMat,Math.sin(angle)*fit.radius*.45,Math.cos(angle)*fit.radius*.45,0,.04,fit.radius*.90,.04,steeringWheel);spoke.rotation.z=-angle;}
for(const x of [-.32,.32]){const dial=mesh(new THREE.CircleGeometry(.14,16),whiteMat,x,dashY, .958,1,1,1,group);dial.rotation.y=Math.PI;mesh(softBoxGeo,blackMat,x,dashY+.035,.95,.022,.10,.018,group);}


const shield=mesh(new THREE.SphereGeometry(2.3,20,14),new THREE.MeshStandardMaterial({color:0xffa9d5,transparent:true,opacity:.19,emissive:0xf86eb6,emissiveIntensity:.5,depthWrite:false}),0,1.3,0,1,1,1,group);shield.visible=false;const flames=[];for(const x of [-.75,.75]){const flame=mesh(new THREE.ConeGeometry(.4,2,8),gemMats[0],x,.6,-2.3,1,1,1,group);flame.rotation.x=-Math.PI/2;flame.visible=false;flames.push(flame)}scene.add(group);return{group,bear,wheels,shield,flames,body,steeringWheel,lastSpeed:0}}
function disposeObjectTree(root){const geometries=new Set(),materials=new Set(),textures=new Set(),visited=new Set();const collectTextures=value=>{if(!value||typeof value!=='object'||visited.has(value))return;if(value.isTexture){textures.add(value);return}visited.add(value);if(Array.isArray(value)){for(const item of value)collectTextures(item);return}const prototype=Object.getPrototypeOf(value);if(prototype===Object.prototype||prototype===null)for(const item of Object.values(value))collectTextures(item)};root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);const list=Array.isArray(object.material)?object.material:object.material?[object.material]:[];for(const material of list){materials.add(material);for(const value of Object.values(material))collectTextures(value)}});for(const texture of textures)texture.dispose();for(const material of materials)material.dispose();for(const geometry of geometries)geometry.dispose();}
function makeRacers(){clearGhost();for(const k of karts){scene.remove(k.group);disposeObjectTree(k.group)}karts=[];const humans=room&&onlineStarted?room.members.map(m=>m.bear):[];const order=humans.length?[...humans,...characters.map((_,i)=>i).filter(i=>!humans.includes(i))]:[selected,...characters.map((_,i)=>i).filter(i=>i!==selected)];const racers=order.map((ci,i)=>{const stats=kartStats(ci);return {ci,id:characters[ci].id,stats,crystals:0,powerCharge:0,heldPower:null,activePower:null,powerTime:0,itemPower:null,itemQueue:[],itemTime:0,bubbleTime:0,starTime:0,leaderSlowTime:0,friendTime:0,s:(mode==='menu'?length*.09:0)+(i===0?0:-5-i*4),lane:i===0?0:(i%2?4:-4),speed:0,driveSpeed:0,heading:0,manual:ci===selected||humans.includes(ci),reverseHold:0,completedLaps:0,nextCheckpoint:1,lateralSpeed:0,stun:0,hitCooldown:0,mass:1+(stats[3]-3)*.035,base:(27.5+(i%3)*.75)*(1+(stats[0]-3.5)*.025),phase:i*1.6,kart:makeKart(characters[ci]),time:null};});karts=racers.map(r=>r.kart);player=racers.find(r=>r.ci===selected);bots=racers.filter(r=>r!==player);for(const r of racers){const f=frame(r.s);r.heading=Math.atan2(f.t.x,f.t.z);r.steerAngle=0;placeKart(r,0)}}
function placeKart(r,dt){const f=racerFrame(r,r.s,r.lane),k=r.kart; k.group.position.copy(f.p);k.group.position.y+=.1+(r.airHeight||0);k.group.rotation.y=(r.manual?r.heading:Math.atan2(f.t.x,f.t.z))+(r.spinTime>0?(1-r.spinTime/(r.spinDuration||1.2))*TAU*2:0);
 const turn=r.manual?(r.steerAngle||0):r.remoteSteer||THREE.MathUtils.clamp((r.lateralSpeed||0)/7,-1,1),moving=Math.min(1,Math.abs(r.speed)/18),accel=dt>0?THREE.MathUtils.clamp((r.speed-k.lastSpeed)/dt,-25,25):0;k.lastSpeed=r.speed;
 const freshImpact=r.hitCooldown>0&&!(k.previousHit>0),landed=k.wasAirborne&&!r.airborne;
 if(landed&&r===player&&mode==='racing'){audio.effect('kart',.35);if(r.trickBoosted){boostTime=Math.max(boostTime,.9);player.boostTime=Math.max(player.boostTime||0,.9);r.trickBoosted=false;toast('Crystal trick!');audio.effect('boost');triggerBigMoment(characters[r.ci].color)}else if(r.speed>18&&!r.hitCooldown){boostTime=Math.max(boostTime,.6);toast('Clean landing!');audio.effect('boost');}}
 if(freshImpact)k.springVelocity=(k.springVelocity||0)-.7;if(landed)k.springVelocity=(k.springVelocity||0)-1.4;
 k.previousHit=r.hitCooldown;k.wasAirborne=r.airborne;
 k.springVelocity=(k.springVelocity||0)+(-(k.spring||0)*100-(k.springVelocity||0)*15)*dt;
 k.spring=THREE.MathUtils.clamp((k.spring||0)+k.springVelocity*dt,-.14,.1);
 const bump=k.spring;

 k.body.position.y=.65+Math.sin(elapsed*18+r.phase)*moving*.018+bump;k.body.rotation.z=THREE.MathUtils.damp(k.body.rotation.z,-turn*moving*.1,10,dt);k.body.rotation.x=THREE.MathUtils.damp(k.body.rotation.x,accel*.003,12,dt);
 k.bear.rotation.z=-turn*moving*.28+(r.slipTime>0?Math.sin(elapsed*20)*.18:0);k.bear.rotation.x=accel*.003+bump+(r.airborne&&r.trickBoosted?Math.sin(elapsed*26)*.22:0);k.bear.position.y=(r.time!==null?Math.abs(Math.sin(elapsed*7))*.18:0)+(characters[r.ci].bee?Math.sin(elapsed*9+r.phase)*.035:0)+bump*.65+moving*Math.sin(elapsed*8+r.phase)*.018;k.bear.rotation.y=r.time!==null?Math.sin(elapsed*5)*.15:0;
 k.steeringWheel.rotation.z=-turn*.5;
 const rolling=r.manual?r.driveSpeed:r.speed,air=r.airborne?1:0;
 for(const w of k.wheels){
  const side=Math.sign(w.pivot.position.x),rear=!w.front;
  const road=Math.sin(r.s*1.8+(rear?2.2:0)+side*.7)*moving*(rear?.045:.025);
  const load=turn*moving*side*(rear?.09:.055)+accel*(rear?-.002:.002);
  const suspension=THREE.MathUtils.clamp(road+load+bump*(rear?1:.65)-air*.12,-.18,.18);
  w.pivot.position.y=THREE.MathUtils.damp(w.pivot.position.y,.53+suspension,18,dt);
  w.pivot.rotation.y=THREE.MathUtils.damp(w.pivot.rotation.y,w.front?turn*.4:0,16,dt);
  w.spin.rotation.x+=rolling*dt/.56;
 }
 animateDriver(k.bear,performance.now()/1000,turn,mode==='menu'||mode==='countdown'||mode==='results',elapsed<(k.cheerUntil||0));k.bear.rotation.x+=(r.airborne?-.18:0);updateKartFeedback(r,dt);
}
const feedbackPool=[];let feedbackCursor=0;
function puff(position,color,mark=false){let v=feedbackPool[feedbackCursor];if(!v){const m=mesh(mark?boxGeo:sphereGeo,new THREE.MeshBasicMaterial({color,transparent:true,depthWrite:false}),0,0,0);v={m,age:0};feedbackPool[feedbackCursor]=v}feedbackCursor=(feedbackCursor+1)%220;v.m.geometry=mark?boxGeo:sphereGeo;v.m.material.color.setHex(color);v.m.position.copy(position);v.m.scale.set(mark?.22:.15,mark?.012:.15,mark?.8:.15);v.m.rotation.set(0,player?.heading||0,0);v.mark=mark;v.age=0;v.life=mark?3:.6;v.m.visible=true;}
function updateKartFeedback(r,dt){if(mode!=='racing'||dt<=0)return;const k=r.kart;k.emit=(k.emit||0)+dt;if(k.emit<.065)return;k.emit=0;const drifting=r===player?wasDrifting:r.wasDrifting,active=r.powerTime>0;
 if(r===player&&Math.abs(r.speed)>14&&!drifting&&((roundB.equipped.trail&&roundB.equipped.trail!=='')||(cosmetics.trail&&cosmetics.trail!=='default')||shardCount()>0)){const at=new THREE.Vector3(0,.25,-1.8).applyAxisAngle(new THREE.Vector3(0,1,0),k.group.rotation.y).add(k.group.position);puff(at,roundB.equipped.trail==='trail-rainbow'?[0xff8cc6,0x68eaff,0xffdb69][Math.floor(elapsed*14)%3]:{cyan:0x65eaff,gold:0xffd366,pink:0xd7a2ff}[cosmetics.trail]||(shardCount()>0?0x65eaff:0xc6d5cf));}
 if(Math.abs(r.speed)>8&&(drifting||r.slipTime>0||active)){for(const x of [-1.25,1.25]){const at=new THREE.Vector3(x,.08,-1.2).applyAxisAngle(new THREE.Vector3(0,1,0),k.group.rotation.y).add(k.group.position);if(drifting||r.slipTime>0){puff(at,0x253b37,true);at.y+=.25;puff(at,drifting?([0xc6d5cf,0x54deff,0xffc64d,characters[r.ci].color][driftTier(r===player?driftCharge:r.driftCharge||0)]):0xc6d5cf)}else{at.y+=.5;puff(at,CRYSTALS[r.activePower].color)}}}
 if(r.hitCooldown>0&&!(k.lastHit>0)){for(let i=0;i<8;i++){const at=k.group.position.clone();at.y+=.8;at.x+=(Math.random()-.5)*2;at.z+=(Math.random()-.5)*2;puff(at,0xffd34f)}}k.lastHit=r.hitCooldown;
}
function stepFeedback(dt){for(const v of feedbackPool){if(!v.m.visible)continue;v.age+=dt;v.m.visible=v.age<v.life;v.m.material.opacity=Math.max(0,(1-v.age/v.life)*(v.mark?.45:.65));if(!v.mark){v.m.position.y+=dt*.7;v.m.scale.addScalar(dt*.35)}}}

async function start(){if(trialLoading)return;clearHeart();resonanceState={};resonanceHinted=false;winnerVideo.stop();trialUI?.reset();trialSplits=[];trialAttempt=null;trialStart=0;trialSlowFrames=0;clearGhost();resetRun();rareShard?.reset(!practice&&!ghostMode&&!timeTrial&&!room);if(timeTrial){if(room||cup){toast('Return to the garage before starting a time trial.');return;}ghostMode=true;audio.unlock();toast('Getting your time trial ready…');trialLoading=true;const generation=++trialGeneration;try{const d=await trialAPI('start',{track:trackId,bear:selected,rules:TRIAL_RULES});if(generation!==trialGeneration)return;trialAttempt=d.attempt;}catch{toast('Offline time trial · your time will save on this device.');}finally{trialLoading=false;}if(generation!==trialGeneration)return;}if(cup&&cup.results.length>cup.round){showCupResults();return}$('cup-podium').classList.add('hidden');$('cup-table').innerHTML='';honeyPool.forEach(p=>{p.mesh.visible=false;p.active=false});honeyPuddles.length=0;feedbackPool.forEach(v=>v.m.visible=false);if(!modelsReady){toast('Character models are still loading.');return}finishSlowUntil=0;if(audio.music)audio.music.playbackRate=1;shots=[];shotMeshes.forEach(m=>m.visible=false);weather=createWeather();updateWeatherVisuals();audio.start();countdownVoiceForRun=audio.playCountdownVoice(characters[selected].id);countdownVoiceGoAt=countdownVoiceForRun?Math.max(2.6,countdownVoiceForRun.duration-.38):0;mode='countdown';elapsed=0;stuckSeconds=0;countTime=countdownVoiceForRun?countdownVoiceForRun.duration+.05:3;lastCount=0;finished=[];totalCrystals=0;boostTime=0;recoverUntil=0;steer=0;driftCharge=0;wasDrifting=false;keys.clear();makeRacers();if(practice||ghostMode){for(const b of bots)scene.remove(b.kart.group);bots=[];if(practice){player.heldPower=player.id;player.powerCharge=3;}}prepareGhost();recordGhost(true);$('ghost-start').textContent=loadGhost()?'Race your best · '+fmt(loadGhost().time):'Set your first ghost time';pickups.forEach(p=>{p.usedLap=-1;p.g.visible=true});$('menu').classList.add('hidden');$('results').classList.add('hidden');$('pause-screen').classList.add('hidden');$('hud').classList.remove('hidden');$('pause').classList.remove('hidden');$('recover').classList.remove('hidden');$('countdown').classList.remove('hidden');document.body.classList.add('racing');updateCamera(1,true);updateHUD();tone(330,.2)}
function garage(){clearHeart();raceHighlight.reset();rareShard?.hide();winnerVideo.stop();trialGeneration++;trialLoading=false;timeTrial=false;trialTarget=null;trialUI?.clearTarget();clearGhost();ghostMode=false;practice=false;cup=null;refreshPaints();try{sessionStorage.removeItem('crystal-cup')}catch{}$('cup-podium').classList.add('hidden');$('cup-table').innerHTML='';$('start').textContent='Let’s race';shots=[];shotMeshes.forEach(m=>m.visible=false);if(room){room.leave();room=null}onlineStarted=false;networkReady=false;$('again').textContent='Race again';$('pause').textContent='Pause';$('connection').classList.add('hidden');weather=createWeather();updateWeatherVisuals();audio.stop();if(audio.music)audio.music.playbackRate=1;mode='menu';guideMarkers.forEach(m=>m.visible=false);keys.clear();$('menu').classList.remove('hidden');for(const id of ['hud','results','pause-screen','pause','recover','countdown'])$(id).classList.add('hidden');document.body.classList.remove('racing');$('toast').classList.remove('show');makeRacers()}
function togglePause(){raceHighlight.stop();if(room&&onlineStarted){keys.clear();$('online-screen').classList.remove('hidden');$('room-entry').classList.add('hidden');$('room-lobby').classList.add('hidden');$('room-message').textContent='The race continues while this screen is open.';return}if(mode==='racing'||mode==='countdown'){pausedMode=mode;mode='paused';audio.pause();keys.clear();$('pause-screen').classList.remove('hidden')}else if(mode==='paused'){mode=pausedMode;audio.resume();$('pause-screen').classList.add('hidden')}}let pausedMode='racing';
// Pointer activation fires immediately; keyboard clicks retain the existing action.
$('boost').addEventListener('pointerdown',event=>{if($('boost').disabled)return;event.preventDefault();useSkill();});
$('boost').addEventListener('click',event=>{if(event.detail>0){event.stopImmediatePropagation();event.preventDefault();}},true);
// Crystal Heart: bounce back from a spin-out with the bear's own emotional tool. Offline races only,
// so time-trial leaderboards and host-run online races keep their existing rules.
function beginHeart(){if(room||timeTrial||practice)return;heart=startHeart(characters[player.ci].id,elapsed,{difficulty,restoreSpeed:(player.driveSpeed||0)/.72});if(heart)heartUI.show(heart,'#'+characters[player.ci].color.toString(16).padStart(6,'0'));}
function resolveHeart(){const result=pressHeart(heart,elapsed),reward=heartReward(result);if(reward.boost){player.spinTime=0;player.slipTime=0;player.driveSpeed=Math.max(player.driveSpeed||0,heart.restoreSpeed*reward.restore);boostTime=Math.max(boostTime,reward.boost);player.boostTime=Math.max(player.boostTime||0,reward.boost);player.kart.cheerUntil=elapsed+.8;triggerBigMoment(characters[player.ci].color);audio.effect('boost');audio.soundscape?.reaction(characters[player.ci].id,'cheer');toast((result==='perfect'?'Crystal Heart! ':'')+heart.tool.affirmation);if(runStats)runStats.heart=(runStats.heart||0)+1;heartUI.hide(heart.tool.affirmation);}else heartUI.hide('Keep going!');heart=null;}
function clearHeart(){heart=null;heartUI.hide();}
// A crystal beam grows between the player and the partner they are resonating with.
function updateResonanceBeam(){const link=mode==='racing'?playerResonance(resonanceState,player,[player,...bots]):null;if(!resonanceBeam){resonanceBeam=mesh(boxGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));resonanceBeam.visible=false;}
 if(!link){resonanceBeam.visible=false;return}if(!resonanceHinted&&link.charge>.3){resonanceHinted=true;toast('Stay close to '+characters[link.partner.ci].name+' — your crystals resonate!');}
 const a=racerFrame(player).p.clone(),b=racerFrame(link.partner).p.clone();a.y+=1.6;b.y+=1.6;resonanceBeam.position.copy(a).lerp(b,.5);resonanceBeam.lookAt(b);resonanceBeam.scale.set(.1+link.charge*.16,.1+link.charge*.16,a.distanceTo(b));resonanceBeam.material.color.setHex(characters[link.partner.ci].color);resonanceBeam.material.opacity=.25+link.charge*.6;resonanceBeam.visible=true;}
function useSkill(){
 if(mode!=='racing')return;if(heart&&!heart.resolved){resolveHeart();return}remoteSkill++;
 if(player.powerCharge>=3&&activateSkill(player,[player,...bots],length)){toast(CRYSTALS[player.activePower].skill+'!');player.kart.cheerUntil=elapsed+.8;triggerBigMoment(CRYSTALS[player.activePower].color);audio.effect(player.activePower==='keen'||player.activePower==='sunny'||player.activePower==='zenny'?'boost':'skill');return}
 if(player.itemPower&&player.itemTime<=0){useItem(player);return}
 toast('Collect crystals to charge your bear’s special!');
}
function useItem(r){if(r.itemTime>0)return false;const id=(r.itemQueue?.shift())||r.itemPower;if(!id)return false;r.itemPower=r.itemQueue?.[0]||null;r.itemTime=ITEM_POWERS[id]?.seconds||0;const accent=characters[r.ci]?.color||0x8feaff;
 if(id==='boost'||id==='triple'){r.boostTime=Math.max(r.boostTime||0,ITEM_POWERS[id].seconds);if(r===player)boostTime=Math.max(boostTime,ITEM_POWERS[id].seconds);}
 if(id==='bubble'){r.bubbleTime=ITEM_POWERS[id].seconds}
 if(id==='homing')r.pendingShot=true;
 if(id==='honey'){const f=frame(r.s-3,r.lane);let puddle=honeyPool.find(p=>!p.active);if(!puddle){const m=mesh(new THREE.CircleGeometry(1.7,16),mat(0xc27b2d,{transparent:true,opacity:.7,roughness:.55}),0,0,0);m.rotation.x=-Math.PI/2;puddle={mesh:m};honeyPool.push(puddle)}Object.assign(puddle,{s:r.s-3,lane:r.lane,owner:r.ci,route:r.route||0,until:elapsed+10,active:true});puddle.mesh.position.set(f.p.x,f.p.y+.08,f.p.z);puddle.mesh.visible=true;honeyPuddles.push(puddle);}
 if(id==='star'){r.activePower='rainbow';r.starTime=4;r.boostTime=Math.max(r.boostTime||0,1.6);if(r===player)boostTime=Math.max(boostTime,1.6)}
 if(id==='hug'){const leader=[player,...bots].sort((a,b)=>b.s-a.s)[0];if(leader!==r)leader.leaderSlowTime=ITEM_POWERS.hug.seconds;else r.leaderSlowTime=Math.max(r.leaderSlowTime||0,1.2);}
 r.kart.cheerUntil=elapsed+.8;if(r===player){const label=ITEM_POWERS[id].label;toast(label+'!');audio.effect('boost');triggerBigMoment(accent);document.body.classList.add('boost-pulse');setTimeout(()=>document.body.classList.remove('boost-pulse'),260)}return true;
}
function pickup(p,r=player){
 const lap=Math.floor(r.s/length);if(!collectCrystal(r,p,lap))return;
 if(r===player&&runStats)runStats.types.add(p.owner);
 p.g.visible=false;r.crystals=(r.crystals||0)+1;
 const rank=1+([player,...bots].filter(x=>x.s>r.s).length),rolled=selectItem(rank,bots.length+1);r.itemQueue??=[];if(r.itemQueue.length<3)r.itemQueue.push(rolled);else r.itemQueue[2]=rolled;r.itemPower=r.itemQueue[0]||null;r.lastRolledPower=rolled;r.slotUntil=elapsed+.65;
 if(r===player){runStats?.types.add(p.owner);totalCrystals=r.crystals;audio.effect('crystal');const item=ITEM_POWERS[rolled]?.label||'Power';$('power-label').textContent='◆ '+item.toUpperCase();$('power-label').classList.add('slot-spin');setTimeout(()=>$('power-label').classList.remove('slot-spin'),650);toast((r.powerCharge>=3?CRYSTALS[r.id].skill+' ready · ':'')+item+' added');}
}
function recoverKart(){if(runStats){runStats.eligible=false;runStats.lapHits++;}
 if(mode==='paused'&&pausedMode==='racing')togglePause();if(mode!=='racing')return;remoteRecover++;if(elapsed<recoverUntil){toast('Recovery is ready in '+Math.ceil(recoverUntil-elapsed)+'s');return}
 const spot=findRecoverySpot(player,hazards,[player,...bots],length);
 if(!spot){toast('No clear space yet. Hold brake to reverse.');return}
 Object.assign(player,spot,{speed:0,driveSpeed:0,lateralSpeed:0,stun:0,reverseHold:0,hitCooldown:0,halfWidth:KART.halfWidth,halfLength:KART.halfLength,powerTime:0,friendTime:0,route:0,airborne:false,airHeight:0,slipTime:0,spinTime:0,rushEligible:false,rushAttempted:true,rushFailed:true,phasing:false,pendingShot:false});
 const f=frame(player.s);player.heading=Math.atan2(f.t.x,f.t.z);player.steerAngle=0;boostTime=0;driftCharge=0;wasDrifting=false;steer=0;recoverUntil=elapsed+3;
 placeKart(player,0);updateCamera(1,true);updateHUD();audio.effect('recover');audio.guide('fuzzby-recover');toast('Back on track. Hold Go when you’re ready.');
}
function nextCrystal(r){return pickups.filter(p=>p.usedLap<Math.floor(r.s/length)&&p.s>(((r.s%length)+length)%length)).sort((a,b)=>a.s-b.s)[0]}
function updatePowerVisuals(){
 while(shotMeshes.length<shots.length){const m=mesh(gemGeo,crystalMaterials.amie,0,0,0,.45,.8,.45);shotMeshes.push(m)}
 shotMeshes.forEach((m,i)=>{m.visible=i<shots.length;if(!m.visible)return;const shot=shots[i];m.position.copy(frame(shot.s,shot.lane,shot.route||0,powerFrameTarget).p);m.position.y+=1+(shot.airHeight||0);m.rotation.y=elapsed*12;});
 for(const r of [player,...bots]){if(r!==player){const e=skillEffects(r),p=CRYSTALS[r.activePower]||CRYSTALS.howey;r.kart.shield.visible=e.phase||e.shield||e.calm||e.kindness||e.star;r.kart.shield.material.color.setHex(p.color);r.kart.flames.forEach(f=>{f.visible=e.burst||e.joy||r.boostTime>0;f.material=crystalMaterials[r.activePower]||crystalMaterials.keen})}}

 const effects=skillEffects(player),power=CRYSTALS[player.activePower]||characters[selected].power||CRYSTALS.sunny;
 player.kart.shield.visible=effects.shield||effects.calm||effects.kindness||effects.phase||effects.star;player.kart.shield.material.color.setHex(power.color);player.kart.shield.material.opacity=effects.phase&&player.powerTime<1?.12+Math.abs(Math.sin(elapsed*14))*.22:.19;
 player.kart.flames.forEach(f=>{f.visible=boostTime>0||effects.burst||effects.joy;f.material=crystalMaterials[player.activePower]||crystalMaterials[player.id]||crystalMaterials.keen;f.scale.y=1+Math.sin(elapsed*40)*.25});
 for(const p of pickups){const lap=Math.floor(player.s/length);p.g.visible=lap>=0&&lap<3&&p.usedLap<lap;p.name.visible=Math.abs(wrapDelta(p.s-player.s,length))<65}
 guideMarkers.forEach((m,i)=>{
  m.visible=effects.guide;if(!m.visible)return;
  const distance=5+i*3,at=player.s+distance;let lane=0;
  for(const h of hazards){const d=wrapDelta(h.s-at,length);if(Math.abs(d)<23){const target=h.lane>=0?-5.5:5.5;lane=target*Math.max(0,1-Math.abs(d)/23)}}
  m.position.copy(frame(at,lane,0,powerFrameTarget).p);m.position.y+=.25;
 });
}
function finish(){if(mode==='results')return;raceHighlight.stop();if(!practice){raceRewards++;try{localStorage.setItem('kart-finishes',String(raceRewards))}catch{}const won=awardRace(roundB,{rank:finished.includes(player)?finished.indexOf(player)+1:9,crystals:player.crystals||0});saveRoundB();const garageEntry=$('bear-garage-open');if(garageEntry)garageEntry.textContent='Bear Garage · '+roundB.coins+' ◆';const challenge=dailyFor();let dailyReward=0;if((challenge.id==='win-honey-sunny'&&trackId==='honey'&&selected===2&&finished[0]===player)||(challenge.id==='collect-crystals'&&(player.crystals||0)>=8))dailyReward=completeDaily(roundB,challenge.id);if(dailyReward)saveRoundB();$('race-achievement').textContent='+'+won+' crystal coins'+(dailyReward?' · Daily challenge +'+dailyReward+' coins!':'');}if(cup&&!room){const racers=[player,...bots],order=[...finished,...racers.filter(r=>!finished.includes(r)).sort((a,b)=>b.s-a.s)].map(r=>r.ci);scoreRound(cup,order,racers.map(r=>({ci:r.ci,crystals:r.crystals,time:r.time})));if(cup.results.length===tourTracks(cup).length&&!cup.rewarded){const table=standings(cup),you=table.find(x=>x.ci===cup.bear),medal=cupMedal(you.points,15*cup.results.length);cup.medal=medal;cup.rewarded=true;roundB.cups[cup.cupId||'tour']=medal;if(medal==='gold'){const item='gold-cup-'+(cup.cupId||'tour');if(!roundB.owned.includes(item))roundB.owned.push(item);}saveRoundB();}saveCup();}audio.finish();if(audio.music)audio.music.playbackRate=1;mode='results';keys.clear();const rank=finished.includes(player)?finished.indexOf(player)+1:1+bots.filter(b=>b.time!==null||b.s>player.s).length;saveRunRewards(rank);rareShard?.hide();const shardMessage=player.time!==null?rareShard?.finish():'';shardCollection=readShards();if(shardMessage)$('race-achievement').textContent=shardMessage;if(!room&&!cup&&!timeTrial)$('race-achievement').textContent+= ' '+nextGoal({hasShard:shardCollection[trackId]===true,trackName:track.name,best:loadGhost()?.time});if(timeTrial&&player.time!==null){const ms=Math.round(player.time*1000);trialSplits[trialSplits.length-1]=ms;trialUI?.finish({track:trackId,bear:selected,rules:TRIAL_RULES,ms,splits:trialSplits},!!runStats?.eligible,trialAttempt);}else trialUI?.sync();$('next-track').classList.toggle('hidden',!!room||!!cup);$('again').textContent=ghostMode?'Race your best again':'Race Again';const suffix=['st','nd','rd'][rank-1]||'th';$('finish-title').textContent=rank===1?'A crystal clear victory!':'What an adventure!';$('finish-summary').textContent=`${characters[selected].name} ${player.time===null?'placed':'finished'} ${rank}${suffix} in ${fmt(player.time??elapsed)} · ${totalCrystals} crystals collected`;if(timeTrial){$('finish-title').textContent='Your time trial';$('finish-summary').textContent=displayTime(Math.round((player.time??elapsed)*1000))+' · 3 laps · Dry track';}else if(ghostMode){$('finish-title').textContent=ghostData&&player.time<ghostData.time?'A new personal best!':'Your time trial';$('finish-summary').textContent=fmt(player.time??elapsed)+(ghostData?' · Previous best '+fmt(ghostData.time):' · Your first ghost run')+' · '+totalCrystals+' crystals';}const ordered=[...finished,...bots.filter(b=>!finished.includes(b)).sort((a,b)=>b.s-a.s)];$('leaderboard').innerHTML=ordered.map((r,i)=>`<div class="result-row ${r===player?'you':''}"><b>${i+1}</b><img src="assets/${characters[r.ci].id}.png" alt=""><strong>${characters[r.ci].name}${r===player?' · You':''}</strong><span>${r.time!==null?fmt(r.time):'Still racing'}</span></div>`).join('');$('results').classList.remove('hidden');const winnerId=ordered[0]?.ci??selected,winnerColor=characters[winnerId].color;$('results').style.setProperty('--winner-crystal','#'+winnerColor.toString(16).padStart(6,'0'));$('finish-confetti').classList.remove('active');void $('finish-confetti').offsetWidth;$('finish-confetti').classList.add('active');setTimeout(()=>$('finish-confetti').classList.remove('active'),2500);if(!cup)showVictory(winnerId);$('results-label').textContent=track.name+' · RACE COMPLETE';if(cup&&!room)showCupResults();tone(650,.4);}
const winnerVideo=createWinnerVideo({video:$('winner-video'),button:$('replay-victory'),status:$('victory-line'),container:$('results'),audio});
function showVictory(ci){winnerVideo.stop();winnerStage.show(characters[ci],performance.now()/1000,ci===selected&&shardCount()>=5?'dance':cosmetics.pose);$('winner-name').textContent=characters[ci].name+' wins!';$('replay-victory').classList.toggle('hidden',timeTrial);if(timeTrial){$('winner-name').textContent=characters[ci].name+' · Time Trial';$('victory-line').textContent=trialTarget&&player.time*1000<trialTarget.ms?'You beat the challenge!':'Every lap helps you improve.';return;}winnerVideo.show(characters[ci]);}
function showCupResults(){
 mode='results';$('next-track').classList.add('hidden');const table=standings(cup),complete=cup.results.length===tourTracks(cup).length;showVictory(complete?table[0].ci:cup.results.at(-1)[0]);
 $('menu').classList.add('hidden');$('results').classList.remove('hidden');$('results-label').textContent=(cup.cupName||'CRYSTAL CUP').toUpperCase()+' · '+(complete?'FINAL STANDINGS':'ROUND '+cup.results.length+' OF '+tourTracks(cup).length);
 $('finish-title').textContent=complete?characters[table[0].ci].name+' wins the '+(cup.cupName||'Crystal Cup')+'!':'Next stop: '+TRACKS[tourTracks(cup)[cup.results.length]].name;
 const you=table.find(r=>r.ci===cup.bear);$('finish-summary').textContent=you.crystals+' crystals collected · '+fmt(you.time)+' total racing time'+(you.unfinished?' · '+you.unfinished+' unfinished races':'')+' · '+cup.results.length+' / '+tourTracks(cup).length+' races. Points decide the winner; ties use the last finish.';
 $('leaderboard').innerHTML='';$('cup-table').innerHTML=table.map((r,i)=>'<div class="result-row '+(r.ci===cup.bear?'you':'')+'"><b>'+(i+1)+'</b><img src="assets/'+characters[r.ci].id+'.png" alt=""><strong>'+characters[r.ci].name+(r.ci===cup.bear?' · You':'')+'</strong><span>'+r.points+' pts<br><small>'+r.crystals+' crystals · '+fmt(r.time)+(r.unfinished?' + DNF':'')+'</small></span></div>').join('');
 $('cup-podium').classList.toggle('hidden',!complete);if(complete)$('cup-podium').innerHTML=table.slice(0,3).map((r,i)=>'<div class="podium-place podium-'+i+'"><img src="assets/'+characters[r.ci].id+'.png" alt="'+characters[r.ci].name+'"><strong>'+characters[r.ci].name+'</strong><div><b>'+['🥇 Gold','🥈 Silver','🥉 Bronze'][i]+'</b><span>'+r.points+' pts</span></div></div>').join('');if(complete)$('finish-summary').textContent+=' · Your '+(cup.medal||'bronze')+' trophy is saved in My progress.';
 $('again').textContent=complete?'Race a new Cup':'Continue to next course ➜';
}
function beginCup(id='whisper'){if(!validCupId(id))return false;timeTrial=false;ghostMode=false;practice=false;if(room){toast('Leave your online room to start a solo Cup.');return false}try{cup=newCup(selected,id);}catch{return false}if(saveCup()){location.href='?track='+tourTracks(cup)[0]+'&cup=1';return true}return false;}
function updateRace(dt){
 const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps;
 for(let i=0;i<steps&&mode==='racing';i++)physicsStep(h);
 for(const r of [player,...bots])placeKart(r,dt);updateGhost(dt);
 if(shots.some(s=>s.homing&&s.target===player.ci)&&elapsed>(player.nextCrystalWarning||0)){player.nextCrystalWarning=elapsed+.8;audio.tone(1200,.07,'sine',.025,900);}
 audio.update({speed:player.driveSpeed||player.speed,throttle:localInput().throttle,brake:localInput().brake,drift:wasDrifting,wetness:weather.wetness,airborne:player.airborne,player,bots,length});
 if(bots.length&&!practice&&!ghostMode){if(!rival||rival.time!==null)rival=nearestRival(player,bots);if(rival){const gap=rival.s-player.s;if(rivalGap>0&&gap<=0&&elapsed>rivalCueAt){toast(characters[player.ci].name+' zoomed past '+characters[rival.ci].name+'!');audio.effect('crystal');audio.soundscape?.reaction(characters[player.ci].id,'laugh');player.kart.cheerUntil=elapsed+.75;triggerBigMoment(characters[player.ci].color);rivalCueAt=elapsed+5;}rivalGap=gap;const chip=$('race-rival');chip.textContent=(gap>0?'Catch ':'Ahead of ')+characters[rival.ci].name+' · '+Math.abs(gap/Math.max(15,player.speed)).toFixed(1)+'s';chip.hidden=false;}}else $('race-rival').hidden=true;
 if(heart){if(heartExpired(heart,elapsed)||mode!=='racing')clearHeart();else heartUI.update(heart,elapsed);}
 updateResonanceBeam();
 stepFeedback(dt);updatePowerVisuals();updateWeatherVisuals();updateHUD();
}
function physicsStep(dt){
 elapsed=timeTrial&&trialStart?Math.max(elapsed,(performance.now()-trialStart)/1000):elapsed+dt;const priorWeather=weather.phase;if(!timeTrial)stepWeather(weather,dt,(room&&onlineStarted?[player,...bots].find(r=>r.ci===room.members.find(m=>m.host)?.bear)?.s??player.s:player.s)/length);if(priorWeather!==weather.phase)toast(weather.phase==='rain'?'Rain! Brake early and take bends gently.':weather.phase==='drying'?'The sun is out. Grip returns as the track dries.':'The track is dry again!');const racers=[player,...bots],previousPositions=new Map(racers.map(r=>[r,r.s]));
 boostTime=Math.max(0,boostTime-dt);if(player.rushBoost){boostTime=Math.max(boostTime,player.rushBoost);player.rushBoost=0;}
 for(const r of racers){if(!r.manual)r.boostTime=Math.max(0,(r.boostTime||0)-dt);r.powerTime=Math.max(0,r.powerTime-dt);r.itemTime=Math.max(0,(r.itemTime||0)-dt);r.bubbleTime=Math.max(0,(r.bubbleTime||0)-dt);r.starTime=Math.max(0,(r.starTime||0)-dt);r.leaderSlowTime=Math.max(0,(r.leaderSlowTime||0)-dt);r.honeyTime=Math.max(0,(r.honeyTime||0)-dt);r.friendTime=Math.max(0,r.friendTime-dt);r.spinTime=Math.max(0,(r.spinTime||0)-dt);r.slipTime=Math.max(0,(r.slipTime||0)-dt);r.phasing=skillEffects(r).phase||skillEffects(r).star}
 const effects=skillEffects(player);
 const input=localInput();
 player.slipstreamCooldown=Math.max(0,(player.slipstreamCooldown||0)-dt);
 const drafting=slipstreaming(player,racers);document.body.classList.toggle('slipstreaming',drafting);player.slipstreamCharge=drafting?Math.min(1.5,(player.slipstreamCharge||0)+dt):0;if(player.slipstreamCharge>=1.5&&player.slipstreamCooldown<=0){player.slipstreamCooldown=5;player.slipstreamCharge=0;boostTime=Math.max(boostTime,1.4);player.boostTime=Math.max(player.boostTime||0,1.4);toast('Slipstream boost!');audio.effect('boost');triggerBigMoment(characters[player.ci].color)}const dir=input.tiltSteer||((input.right?1:0)-(input.left?1:0));
 // Positive track lateral points left in the chase camera; screen-right is negative.
 steer=THREE.MathUtils.damp(steer,-dir,9,dt);
 const throttle=player.time===null&&input.throttle;
 if(player.rocketEarly){player.rocketReady=false;player.stun=Math.max(player.stun||0,.32);player.spinTime=.32;player.spinDuration=.32;player.rocketEarly=false;toast('Wait for GO!');audio.effect('kart',.35);}
 if(player.rocketReady&&performance.now()<=player.rocketReadyUntil&&throttle){boostTime=Math.max(boostTime,1.35);player.boostTime=Math.max(player.boostTime||0,1.35);audio.effect('boost');triggerBigMoment(characters[player.ci].color);puff(racerFrame(player).p,characters[player.ci].color);player.rocketReady=false;}else if(player.rocketReady&&performance.now()>player.rocketReadyUntil)player.rocketReady=false;

 const drifting=throttle&&(keys.has('ShiftLeft')||keys.has('ShiftRight')||(mobileDevice&&Math.abs(dir)>.55))&&dir!==0&&player.driveSpeed>14;
 const braking=player.time===null&&input.brake;if(player.time!==null){player.driveSpeed=player.speed=player.lateralSpeed=0;}
 if(!throttle||braking)boostTime=0;
 if(drifting){const oldTier=driftTier(driftCharge);driftCharge=Math.min(3.2,driftCharge+dt);if(driftTier(driftCharge)>oldTier)tone(driftTier(driftCharge)===3?1400:driftTier(driftCharge)===2?1100:800,.1);}
 else if(wasDrifting){if(driftBoost(driftCharge)&&throttle&&!braking){boostTime=Math.max(boostTime,driftBoost(driftCharge));player.kart.cheerUntil=elapsed+.7;if(driftTier(driftCharge)>=2&&runStats)runStats.gold=true;toast(driftTier(driftCharge)===3?'Crystal drift! Big boost':driftTier(driftCharge)===3?'Crystal drift! Big boost':driftTier(driftCharge)===2?'Gold drift! Super boost':'Blue drift! Mini boost');audio.effect('boost');triggerBigMoment(driftTier(driftCharge)===3?characters[player.ci].color:driftTier(driftCharge)===2?0xffc64d:0x5adfff)}driftCharge=0}
 wasDrifting=drifting;player.mass=effects.shield?1.8:1;
 const beforeFrame=racerFrame(player),nextFrame=racerFrame(player,player.s+.5),trackYaw=Math.atan2(beforeFrame.t.x,beforeFrame.t.z);
 const curvature=wrapDelta(Math.atan2(nextFrame.t.x,nextFrame.t.z)-trackYaw,TAU)/.5;
 const playerRank=1+bots.filter(b=>b.s>player.s).length,catchUp=comebackBoost(playerRank,bots.length+1),difficultyHelp=difficulty==='easy'?1.35:0;
 const playerTop=(practice?20:effects.burst||boostTime>0?48:effects.joy?36:effects.kindness?34:32)*(1+catchUp)*(1+(player.stats[0]-3.5)*.025)*(player.honeyTime>0?.78:1)+(player.leaderSlowTime>0?-2:0);
 advanceManual(player,dt,{throttle,brake:braking,steer,drift:drifting,boost:boostTime>0||effects.burst,topSpeed:playerTop,acceleration:effects.joy?24:effects.kindness?21:10+(player.stats[1]-3)*.65,grip:effects.calm?30:0,steeringScale:(effects.calm?.8:1)*(1+(player.stats[2]-3)*.035),easyAssist:difficultyHelp,traction:traction(weather,effects.calm)},trackYaw,curvature);
 for(const b of bots){
  b.itemTime=Math.max(0,(b.itemTime||0)-dt);b.bubbleTime=Math.max(0,(b.bubbleTime||0)-dt);b.starTime=Math.max(0,(b.starTime||0)-dt);b.honeyTime=Math.max(0,(b.honeyTime||0)-dt);b.leaderSlowTime=Math.max(0,(b.leaderSlowTime||0)-dt);
  if(b.manual){advanceRemote(b,dt,racers);continue}
  const tuning=DIFFICULTIES[room?'standard':difficulty];
  const incomingShot=shots.some(s=>s.homing&&s.target===b.ci),nearAhead=racers.some(o=>o!==b&&o.time===null&&(o.route||0)===(b.route||0)&&wrapDelta(o.s-b.s,length)>0&&wrapDelta(o.s-b.s,length)<44),nearBehind=racers.some(o=>o!==b&&o.time===null&&(o.route||0)===(b.route||0)&&wrapDelta(o.s-b.s,length)<0&&wrapDelta(o.s-b.s,length)>-15);
  if(b.powerCharge>=3&&b.powerTime===0&&b.speed>8){b.aiPowerWait=(b.aiPowerWait||0)+dt;const cornerProbe=[];for(let d=-24;d<tuning.lookahead;d+=8){const a=frame(b.s+d,0,b.route||0),z=frame(b.s+d+8,0,b.route||0),ya=Math.atan2(a.t.x,a.t.z),yz=Math.atan2(z.t.x,z.t.z);cornerProbe.push({distance:d+4,curvature:wrapDelta(yz-ya,TAU)/8});}const peak=cornerProbe.filter(x=>x.distance>-12&&x.distance<42).sort((a,z)=>Math.abs(z.curvature)-Math.abs(a.curvature))[0];const tactical=b.id==='amie'?nearAhead:b.id==='aida'||b.id==='fuzzby'?incomingShot:b.id==='luna'?!!peak&&Math.abs(peak.curvature)>.011:b.id==='misty'?hazards.some(h=>(h.route||0)===(b.route||0)&&wrapDelta(h.s-b.s,length)>0&&wrapDelta(h.s-b.s,length)<25):b.id==='howey'?racers.some(o=>o!==b&&o.time===null&&Math.abs(wrapDelta(o.s-b.s,length))<28):b.speed>15&&(!peak||Math.abs(peak.curvature)<.009);if(tactical&&b.aiPowerWait>=tuning.powerDelay){activateSkill(b,racers,length);b.aiPowerWait=0;}}else b.aiPowerWait=0;
  if(b.itemPower&&b.itemTime<=0&&b.speed>9&&shouldUseAIItem(b.itemQueue?.[0]||b.itemPower,b,racers,shots,length,wrapDelta))useItem(b);
  const effect=skillEffects(b);b.mass=effect.shield?1.8:1;
  const cornerProbe=[];for(let d=-24;d<tuning.lookahead;d+=8){const a=frame(b.s+d,0,b.route||0),z=frame(b.s+d+8,0,b.route||0),ya=Math.atan2(a.t.x,a.t.z),yz=Math.atan2(z.t.x,z.t.z);cornerProbe.push({distance:d+4,curvature:wrapDelta(yz-ya,TAU)/8});}
  const upcoming=cornerProbe.filter(x=>x.distance>-12&&x.distance<42).sort((a,z)=>Math.abs(z.curvature)-Math.abs(a.curvature))[0];b.aiInsideLane=upcoming&&Math.abs(upcoming.curvature)>.006?Math.sign(upcoming.curvature)*5.8:null;
  b.aiRacingLane=racingLineLane(cornerProbe,tuning.lookahead);
  const lap=Math.floor(b.s/length),box=b.powerCharge<3?pickups.filter(p=>p.usedLap<lap&&wrapDelta(p.s-b.s,length)>4&&wrapDelta(p.s-b.s,length)<tuning.lookahead).sort((a,z)=>wrapDelta(a.s-b.s,length)-wrapDelta(z.s-b.s,length))[0]:null;
  const pad=(scenery.boostPads||[]).filter(p=>{const d=wrapDelta(p.s-b.s,length),used=b.padLap?.[p.index]===lap;return !used&&d>4&&d<tuning.lookahead}).sort((a,z)=>wrapDelta(a.s-b.s,length)-wrapDelta(z.s-b.s,length))[0];
  const targetObject=box&&(!pad||wrapDelta(box.s-b.s,length)<wrapDelta(pad.s-b.s,length))?box:pad;if(targetObject){const d=wrapDelta(targetObject.s-b.s,length),weight=THREE.MathUtils.clamp(1-d/tuning.lookahead,.08,.68);b.aiRacingLane+=(targetObject.lane-b.aiRacingLane)*weight;}
  const plan=rivalPlan(b,racers,hazards,length,wrapDelta,tuning.lookahead);b.passLane=plan.lane;const desiredLane=plan.lane;
  const gap=b.s-player.s;const rivalEase=gap>65?.94:gap< -65?1.025:1;const rank=1+racers.filter(x=>x.s>b.s).length;const catchUp=comebackBoost(rank,racers.length);const personality=b.id==='keen'?1.012:b.id==='luna'?.994:1;const mistake=tuning.mistake*Math.sin(elapsed*1.65+b.phase*2.7);let target=b.base*tuning.pace*personality*rivalEase*(1+catchUp*.35)*(b.honeyTime>0?.78:1)+Math.sin(elapsed*.32+b.phase)*.45+THREE.MathUtils.clamp((player.s-b.s)*.018,-2,3);if(upcoming&&upcoming.distance<34)target=Math.min(target,cornerSpeedLimit(upcoming.curvature));if(tuning.lateBrake>0&&upcoming&&upcoming.distance<25&&Math.sin(elapsed*.17+b.phase*4)>.92)target-=tuning.lateBrake;
  const aiLane=THREE.MathUtils.clamp(desiredLane+mistake,-6.6,6.6);
  advance(b,dt,Math.min(plan.cap+(b.boostTime>0?10:0),(target+(effect.burst?13:effect.joy?4:effect.kindness?2:0)+(b.boostTime>0?9:0))*(1-weather.wetness*.12)*(b.leaderSlowTime>0?.84:1)),THREE.MathUtils.clamp((aiLane-b.lane)*tuning.steer*(b.id==='luna'?.9:1)+(b.slipTime>0?(b.slipSide||1)*2.5:0),-7,7),effect.joy?24:effect.kindness?21:tuning.acceleration*(1+(b.stats[1]-3)*.035),traction(weather,effect.calm)*(b.slipTime>0?.55:1));
 }
 for(const r of racers)if(r.spinTime>0){r.speed=(r.speed||0)*.998;r.driveSpeed=(r.driveSpeed||0)*.998;}
 for(const r of racers){const oldRoute=r.route,wasAirborne=r.airborne;routeStep(r,previousPositions.get(r),track);if(r===player&&runStats){if(!oldRoute&&r.route)runStats.enteredShortcut=true;if(oldRoute&&!r.route&&runStats.enteredShortcut){runStats.shortcut=true;runStats.enteredShortcut=false;}}jumpStep(r,previousPositions.get(r),dt,track);if(r===player&&r.airborne&&!r.trickBoosted&&r.jumpV>-3&&(drifting||keys.has('ShiftLeft')||keys.has('ShiftRight')||Math.abs(dir)>.55)){r.trickBoosted=true;audio.effect('crystal');toast('Crystal trick! Land it for a boost');}}
 for(const puddle of honeyPuddles){if(elapsed>puddle.until){puddle.mesh.visible=false;puddle.active=false;continue}for(const r of racers){if(r.ci===puddle.owner||r.time!==null||r.route!==puddle.route||r.starTime>0)continue;if(Math.abs(wrapDelta(r.s-puddle.s,length))<2.2&&Math.abs(r.lane-puddle.lane)<2.2)r.honeyTime=1.15;}}
 for(const r of racers){const oldS=previousPositions.get(r),oldLap=Math.floor(oldS/length),newLap=Math.floor(r.s/length);for(const pad of scenery.boostPads||[]){for(let lap=oldLap;lap<=newLap;lap++){const at=lap*length+pad.s;if(oldS<at&&r.s>=at&&Math.abs(r.lane-pad.lane)<3.4&&!r.airborne){r.padLap??=Object.create(null);if(r.padLap[pad.index]!==lap){r.padLap[pad.index]=lap;r.boostTime=Math.max(r.boostTime||0,1.25);if(r===player){boostTime=Math.max(boostTime,1.25);toast('Crystal boost pad!');audio.effect('boost');triggerBigMoment(0x8ff4ff)}r.kart.cheerUntil=elapsed+.7;}}}}}
 for(const r of racers){r.phasing=skillEffects(r).phase||skillEffects(r).star;if(r.pendingShot){r.pendingShot=false;const f=racerFrame(r);const shot=launchCrystal(r,Math.atan2(f.t.x,f.t.z),racers,length);shots.push(shot);if(r===player)audio.effect('shot');}}
 shots=advanceShots(shots,racers,hazards,dt,length,(r,shield,owner)=>{const at=racerFrame(r,r.s,r.lane).p;at.y+=1;for(let i=0;i<8;i++){const v=at.clone();v.x+=(Math.random()-.5)*2;v.z+=(Math.random()-.5)*2;puff(v,shield?0xffa5d0:0xac6bed)}if(r===player){if(!shield&&!skillEffects(r).star)raceHighlight.trigger((characters[owner]?.name||'A rival')+' sent you spinning!');toast(shield?'Shield blocked the crystal!':'Crystal hit! Spin-out!');audio.effect('shot');if(!shield&&!skillEffects(r).star){audio.soundscape?.reaction(characters[player.ci].id,'ouch');beginHeart();if(characters[owner])audio.soundscape?.reaction(characters[owner].id,'laugh',{reply:true,chance:.45,delay:.8})}}else if(owner===player.ci){toast(shield?'Their shield caught it!':'Direct hit! Crystal spin-out!');audio.effect('crystal');audio.soundscape?.reaction(characters[owner]?.id);if(!shield)audio.soundscape?.reaction(characters[r.ci]?.id,'ouch',{reply:true,chance:.5,delay:.8})}});
 solveContacts(racers,hazards,length,(r,kind,speed,instigator)=>{
  impactPenalty(r,kind,speed,skillEffects(r).shield||skillEffects(r).star);
  if(r!==player)return;
  if(runStats)runStats.lapHits++;
  if(kind==='rock'){boostTime=0;driftCharge=0;wasDrifting=false;toast('Rock! Hold DRIVE + steer to turn away, or brake to reverse.');audio.effect('rock',speed/25);audio.soundscape?.reaction(characters[player.ci].id,'whoops')}
  else if(kind==='kart'){if(speed>8)raceHighlight.trigger('Bump! Keep racing!');toast(effects.shield?'Shield cushions the bump!':'Bump! Keep racing!');audio.effect('kart',speed/20);audio.soundscape?.reaction(characters[player.ci].id,instigator&&instigator!==player?'ouch':'laugh')}
 });
 for(const [a,b] of stepResonance(resonanceState,racers,dt,length,wrapDelta)){for(const r of [a,b])puff(racerFrame(r).p,characters[r.ci].color);if(a===player||b===player){const partner=a===player?b:a;boostTime=Math.max(boostTime,player.boostTime);toast('Crystal Resonance! '+characters[player.ci].name+' & '+characters[partner.ci].name);audio.effect('boost');triggerBigMoment(characters[partner.ci].color);player.kart.cheerUntil=partner.kart.cheerUntil=elapsed+.8;if(runStats)runStats.resonance=(runStats.resonance||0)+1;}}
 for(const b of bots)if(recoverStalledRival(b,dt,hazards,racers,length)){const f=frame(b.s);b.heading=Math.atan2(f.t.x,f.t.z);}
 stuckSeconds=input.throttle&&Math.abs(player.driveSpeed)<2&&player.rockContactTime>0?stuckSeconds+dt:Math.max(0,stuckSeconds-dt*2);
 $('rescue-kart').classList.toggle('hidden',stuckSeconds<1.5);
 const afterFrame=racerFrame(player);syncManualContact(player,Math.atan2(afterFrame.t.x,afterFrame.t.z),curvature);
 for(const r of racers){const effect=skillEffects(r);for(const p of pickups){if(!r.route&&!r.airborne&&Math.abs(wrapDelta(p.s-r.s,length))<(effect.sense?14:2.3)&&Math.abs(p.lane-r.lane)<(effect.sense?8:2))pickup(p,r)}}
 for(const r of bots.filter(r=>r.manual)){const f=racerFrame(r);syncManualContact(r,Math.atan2(f.t.x,f.t.z),r.lastCurvature||0)}
 if(runStats){runStats.worst=Math.max(runStats.worst,1+bots.filter(b=>b.s>player.s).length);}recordGhost();
 const priorLaps=player.completedLaps||0,priorCheckpoint=player.nextCheckpoint;
 for(const r of racers)updateProgress(r,previousPositions.get(r),length);rareShard?.update(player,elapsed);if(!practice&&!ghostMode&&!timeTrial&&!room&&!roundB.shards.includes(trackId)){const shardAt=secretShardAt,was=previousPositions.get(player)??player.s;if(player.completedLaps>=1&&was<length+shardAt&&player.s>=length+shardAt&&Math.abs(player.lane)<1.35&&player.speed>12){awardShard(roundB,trackId);saveRoundB();const owned=readShards();owned[trackId]=true;try{localStorage.setItem('crystal-course-shards-v1',JSON.stringify(owned))}catch{}shardCollection=owned;secretShard.visible=secretShardRing.visible=false;toast(track.name+' secret shard found! '+roundBShardCount()+' / 11');audio.effect('crystal');if(roundBShardCount()===11){roundB.owned??=[];if(!roundB.owned.includes('golden-kart'))roundB.owned.push('golden-kart');saveRoundB();}}}
 if(timeTrial&&player.nextCheckpoint>priorCheckpoint){for(let n=priorCheckpoint;n<player.nextCheckpoint;n++)trialSplits.push(Math.round(elapsed*1000));}
 if(player.completedLaps>priorLaps&&runStats){runStats.lapTimes.push(elapsed-runStats.lapStart);runStats.lapStart=elapsed;if(!runStats.lapHits)runStats.clean=true;runStats.lapHits=0;}
 if(player.completedLaps>priorLaps&&player.completedLaps<3){toast(player.completedLaps===2?'Final lap! You’ve got this.':'Lap 2 · Keep your courage!');tone(700,.3);if(player.completedLaps===2&&audio.music)audio.music.playbackRate=1.07}
 if(practice){if(player.completedLaps>=1){player.completedLaps=0;player.s-=length;player.nextCheckpoint=1;pickups.forEach(p=>p.usedLap=-1);}if(player.powerCharge<3&&player.powerTime===0){player.heldPower=player.id;player.powerCharge=3;}return;}
 const crossings=racers.filter(r=>r.time===null&&r.completedLaps>=3).map(r=>({r,time:elapsed-dt+dt*THREE.MathUtils.clamp((finishDistance-previousPositions.get(r))/Math.max(.0001,r.s-previousPositions.get(r)),0,1)})).sort((a,b)=>a.time-b.time);
 const nearPhoto=crossings.some((entry,i)=>finished.some(r=>r.time!==null&&Math.abs(r.time-entry.time)<=.5)||(i>0&&entry.time-crossings[i-1].time<=.5));if(nearPhoto){finishSlowUntil=performance.now()+950;$('photo-finish').classList.add('active');setTimeout(()=>$('photo-finish').classList.remove('active'),1000)}for(const {r,time} of crossings){r.time=timeTrial&&r===player?elapsed:time;finished.push(r)}
 if(room&&onlineStarted){if(room.host&&(racers.filter(r=>r.manual).every(r=>r.time!==null)||elapsed>240))finish();}else if(player.time!==null&&(!cup||racers.every(r=>r.time!==null)||elapsed-player.time>45))finish();else if(cup&&player.time!==null)$('status').textContent='Finished! Waiting for the other racers…';
}
function updateHUD(){if(performance.now()-lastHUD<100)return;lastHUD=performance.now();
 const pos=1+bots.filter(b=>b.s>player.s).length,power=CRYSTALS[player.powerTime>0?player.activePower:player.heldPower||player.id],item=ITEM_POWERS[player.itemQueue?.[0]||player.itemPower],effects=skillEffects(player),positionEl=$('position');
 if(positionEl.dataset.rank!==String(pos)){if(positionEl.dataset.rank){positionEl.classList.remove('position-pop');void positionEl.offsetWidth;positionEl.classList.add('position-pop')}positionEl.dataset.rank=String(pos);tone(520+Math.max(0,10-pos)*35,.09,'sine',.035,700)}positionEl.innerHTML=pos+'<span>'+(['st','nd','rd'][pos-1]||'th')+'</span>';$('racer-count').textContent=timeTrial?'TIME TRIAL':ghostMode?'YOUR BEST GHOST':practice?'PRACTICE':'OF '+(bots.length+1)+' RACERS';
 let ahead=null,behind=null;for(const rival of bots){if(rival.s>player.s&&(!ahead||rival.s<ahead.s))ahead=rival;if(rival.s<=player.s&&(!behind||rival.s>behind.s))behind=rival;}for(const [id,r,where] of [['racer-ahead',ahead,'ahead'],['racer-behind',behind,'behind']]){const img=$(id);img.hidden=!r;if(r){const src='assets/drivers/thumbs/'+characters[r.ci].id+'.webp?v=75';if(!img.src.endsWith(src))img.src=src;img.alt=characters[r.ci].name+' '+where;}}
 $('lap').textContent=practice?'Practice':displayedLap(player)+' / 3';$('time').textContent=timeTrial?displayTime(Math.round(elapsed*1000)):fmt(elapsed);$('speed').textContent=Math.round(Math.abs(player.driveSpeed)*3.6);document.body.classList.toggle('speed-rush',Math.abs(player.driveSpeed)*3.6>40&&!mobileDevice);
 const rollLabels=['BOOST','TRIPLE','BUBBLE','HOMING','HONEY','RAINBOW','GROUP HUG'];$('power-label').textContent=player.slotUntil>elapsed?'◆ '+rollLabels[Math.floor(performance.now()/70)%rollLabels.length]+' ◆':item?'BOX POWER · '+item.label.toUpperCase():power?power.crystal+' · '+power.trait:'COLLECT ANY CRYSTAL';$('charges').innerHTML='<span class="'+(player.powerCharge>=1?'full':'')+'"></span><span class="'+(player.powerCharge>=2?'full':'')+'"></span><span class="'+(player.powerCharge>=3?'full':'')+'"></span>';
 const specialReady=player.powerCharge>=3&&player.powerTime<=0,itemReady=!!player.itemPower&&player.itemTime<=0;$('boost').disabled=!specialReady&&!itemReady||player.powerTime>0;$('boost').textContent=player.powerTime>0?power.skill+' · '+Math.ceil(player.powerTime)+'s':specialReady?'◆ BEAR MOVE · '+power.skill:itemReady?'◆ '+item.label+'! · USE':player.powerCharge?'◇ Bear move · '+player.powerCharge+'/3 crystals':'◇ Collect a crystal';
 $('boost').classList.toggle('power-ready',specialReady||itemReady);
 $('boost').setAttribute('aria-label',specialReady?'Use bear special move: '+power.skill:itemReady?'Use '+item.label:player.powerCharge?'Bear move charge '+player.powerCharge+' of 3':'Collect a crystal to get a power');
 $('power-icon').textContent=player.itemPower?({boost:'➜',triple:'»',bubble:'⬡',homing:'✦',honey:'●',star:'★',hug:'♥'}[player.itemPower]):power?({keen:'↟',aida:'⬡',sunny:'»',misty:'◌',amie:'➤',howey:'+',luna:'≈',zenny:'»',fuzzby:'⬡'}[player.powerTime>0?player.activePower:player.heldPower||player.id]):'◇';$('power-icon').style.color=power?'#'+power.color.toString(16).padStart(6,'0'):'#ffffff';$('power-timer').value=power&&player.powerTime>0?player.powerTime/power.duration:player.powerCharge/3;$('power-timer').setAttribute('aria-label',player.powerTime>0?'Power time remaining':'Power ready');$('drift-meter').value=Math.min(1,driftCharge/3.2);
 document.body.dataset.drift=String(wasDrifting?driftTier(driftCharge):0);
 $('power-summary').textContent=player.powerTime>0?power.description:item?item.label+' ready. Collect 3 crystals to charge '+characters[player.ci].name+'’s special.':power.description;$('crystal-rule').textContent=player.powerCharge>=3?'Bear special charged · use your glowing button!':player.powerCharge+' / 3 crystals · one surprise item slot';
 $('drift-info').textContent=wasDrifting?(driftTier(driftCharge)===3?'CRYSTAL · RELEASE':driftTier(driftCharge)===3?'CRYSTAL · RELEASE':driftTier(driftCharge)===2?'GOLD · RELEASE':driftTier(driftCharge)===1?'BLUE · RELEASE':'CHARGING…'):'HOLD DRIFT IN A TURN';
 const next=effects.sense?nextCrystal(player):null;
 $('status').textContent=cup&&player.time!==null?'Finished! Waiting for the other racers…':player.driveSpeed<-.3?'REVERSING':player.powerTime>0?power.skill.toUpperCase()+(next?' · '+CRYSTALS[next.owner].crystal.toUpperCase()+' '+Math.round(next.s-((player.s%length+length)%length))+'m':''):player.driveSpeed<.2?'↑ / W: DRIVE · ↓ / S: REVERSE · R: RECOVER':'';
 $('recover').disabled=elapsed<recoverUntil;
 drawMap();
}
const raceMap=createRaceMap($('map'),track);function drawMap(){raceMap.draw(player,bots,characters);$('map-title').textContent=practice?'YOU · PRACTICE':'YOU · LAP '+displayedLap(player)+'/3';}
function updateCamera(dt,snap=false){const f=racerFrame(player,player.s,player.lane);sun.position.copy(f.p).add(sunOffset);sun.target.position.copy(f.p);if(mode==='menu'){cameraTarget.copy(f.p).addScaledVector(f.right,7).addScaledVector(f.t,12);cameraTarget.y+=4.5;camera.position.lerp(cameraTarget,snap?1:1-Math.exp(-dt*3));cameraLook.copy(f.p);cameraLook.y+=1.4;camera.lookAt(cameraLook);return}cameraForward.set(Math.sin(player.heading),0,Math.cos(player.heading));cameraAhead.copy(f.p).addScaledVector(cameraForward,16);cameraTarget.copy(f.p).addScaledVector(cameraForward,-(boostTime>0||skillEffects(player).burst?13:11));cameraTarget.y+=6.5;camera.position.lerp(cameraTarget,snap?1:1-Math.exp(-dt*9));if(performance.now()<momentUntil){const power=(momentUntil-performance.now())/360;camera.position.x+=Math.sin(performance.now()*.075)*.12*power;camera.position.y+=Math.cos(performance.now()*.09)*.08*power;}cameraAhead.y+=1.7;camera.lookAt(cameraAhead);camera.fov=THREE.MathUtils.damp(camera.fov,boostTime>0||skillEffects(player).burst?69:57,4,dt);camera.updateProjectionMatrix()}

function advanceRemote(r,dt,racers){
 if(r.time!==null){r.driveSpeed=r.speed=r.lateralSpeed=0;return}
 const input=room?.inputFor(r.ci)||{},effect=skillEffects(r);
 if(input.skill>(r.skillSeq||0)){r.skillSeq=input.skill;if(r.powerCharge>=3)activateSkill(r,racers,length);else useItem(r)}
 if(input.recover>(r.recoverSeq||0)){r.recoverSeq=input.recover;if(elapsed>(r.recoverUntil||0)){const spot=findRecoverySpot(r,hazards,racers,length);if(spot){Object.assign(r,spot,{route:0,airborne:false,airHeight:0,driveSpeed:0,speed:0,lateralSpeed:0,stun:0,powerTime:0,friendTime:0,reverseHold:0});const f=frame(r.s);r.heading=Math.atan2(f.t.x,f.t.z);r.steerAngle=0;r.recoverUntil=elapsed+3;}}}
 const dir=-(input.tiltSteer||((input.right?1:0)-(input.left?1:0)));r.remoteSteer=THREE.MathUtils.damp(r.remoteSteer||0,dir,9,dt);
 const moving=r.time===null&&input.throttle,brake=r.time!==null||input.brake,drift=moving&&input.drift&&dir!==0&&r.driveSpeed>14;
 r.driftCharge=drift?Math.min(3.2,(r.driftCharge||0)+dt):r.driftCharge||0;
 r.boostTime=Math.max(0,(r.boostTime||0)-dt);if(!moving||brake)r.boostTime=0;
 if(!drift&&r.wasDrifting){if(driftBoost(r.driftCharge)&&moving&&!brake)r.boostTime=driftBoost(r.driftCharge);r.driftCharge=0}r.wasDrifting=drift;
 const f=racerFrame(r),f2=racerFrame(r,r.s+.5),yaw=Math.atan2(f.t.x,f.t.z),curveRate=wrapDelta(Math.atan2(f2.t.x,f2.t.z)-yaw,TAU)/.5;
 r.mass=effect.shield?1.8:1;r.lastCurvature=curveRate;
 advanceManual(r,dt,{throttle:moving,brake,steer:r.remoteSteer,drift,boost:effect.burst||r.boostTime>0,topSpeed:effect.burst||r.boostTime>0?48:effect.joy?36:effect.kindness?34:32,acceleration:effect.joy?24:effect.kindness?21:0,grip:effect.calm?30:0,steeringScale:effect.calm?.8:1,traction:traction(weather,effect.calm)},yaw,curveRate);
}
const syncFields=['itemPower','itemQueue','slotUntil','itemTime','bubbleTime','starTime','leaderSlowTime','honeyTime','playfulTime','completedLaps','nextCheckpoint','steerAngle','route','airborne','airHeight','jumpY','jumpV','landingTime','remoteSteer','wasDrifting','driftCharge','boostTime','spinTime','spinDuration','slipTime','slipSide','phasing','colliderAngle','pendingShot','crystals','s','lane','speed','driveSpeed','heading','lateralSpeed','stun','hitCooldown','mass','powerCharge','heldPower','activePower','powerTime','friendTime','time','reverseHold','halfWidth','halfLength','rockContactTime','skillSeq','recoverSeq','recoverUntil'];
function raceSnapshot(){if(!onlineStarted)return null;return {mode,elapsed,countTime,shots,honey:honeyPuddles.filter(p=>p.active&&elapsed<=p.until).map(({s,lane,owner,route,until})=>({s,lane,owner,route,until})),weather:{...weather},racers:[player,...bots].map(r=>Object.fromEntries(['ci',...syncFields].map(k=>[k,r[k]??null]))),pickups:pickups.map(p=>p.usedLap),finished:finished.map(r=>r.ci)};}
function syncHoneySnapshot(data){for(const p of honeyPool){p.active=false;p.mesh.visible=false}honeyPuddles.length=0;for(const item of data){let p=honeyPool.find(x=>!x.active);if(!p){const m=mesh(new THREE.CircleGeometry(1.7,16),mat(0xc27b2d,{transparent:true,opacity:.7,roughness:.55}),0,0,0);m.rotation.x=-Math.PI/2;p={mesh:m};honeyPool.push(p)}Object.assign(p,item,{active:true});const f=frame(item.s,item.lane,item.route||0);p.mesh.position.set(f.p.x,f.p.y+.08,f.p.z);p.mesh.visible=true;honeyPuddles.push(p)}}
function applySnapshot(s){
 if(!s||s.elapsed<lastSnapshotElapsed)return;lastSnapshotElapsed=s.elapsed;
 const racers=[player,...bots];for(const state of s.racers){const r=racers.find(r=>r.ci===state.ci);if(!r)continue;for(const k of syncFields)if(state[k]!==undefined)r[k]=state[k];}
 shots=(s.shots||[]).map(shot=>({...shot}));syncHoneySnapshot(s.honey||[]);totalCrystals=player.crystals||0;elapsed=s.elapsed;countTime=s.countTime;weather={...s.weather};pickups.forEach((p,i)=>p.usedLap=s.pickups[i]);finished=s.finished.map(ci=>racers.find(r=>r.ci===ci)).filter(Boolean);
 if(s.mode==='racing'&&mode==='countdown'){$('countdown').classList.add('hidden');mode='racing'}
 if(s.mode==='results'&&mode!=='results')finish();
 networkReady=true;updatePowerVisuals();updateWeatherVisuals();updateHUD();
}
function localInput(){const motion=mobile.read(),blocked=motion.blocked||mode==='paused'||!$('online-screen').classList.contains('hidden');if(blocked)return {throttle:false,brake:false,left:false,right:false,drift:false,tiltSteer:0,skill:remoteSkill,recover:remoteRecover};const brake=motion.brake||keys.has('KeyS')||keys.has('ArrowDown');return {throttle:!brake&&(motion.throttle||keys.has('KeyW')||keys.has('ArrowUp')),brake,left:motion.steer<-.12||keys.has('KeyA')||keys.has('ArrowLeft'),right:motion.steer>.12||keys.has('KeyD')||keys.has('ArrowRight'),tiltSteer:motion.steer,drift:keys.has('ShiftLeft')||keys.has('ShiftRight'),skill:remoteSkill,recover:remoteRecover};}
function showLobby(state){
 $('room-entry').classList.add('hidden');$('room-lobby').classList.remove('hidden');$('room-code-display').textContent=room.code;
 $('room-members').innerHTML=state.members.map(m=>`<div><img src="assets/${characters[m.bear].id}.png" alt=""><strong>${characters[m.bear].name}${m.bear===selected?' · You':''}</strong><span>${m.host?'Host · ':''}${!m.connected?'Disconnected':m.ready?'Ready':'Choosing'}</span></div>`).join('');
 $('ready-room').classList.toggle('hidden',room.host);$('start-room').classList.toggle('hidden',!room.host);$('start-room').disabled=state.members.length<2||state.members.some(m=>!m.ready||!m.connected);
 $('room-message').textContent=room.host?'Share this room code. Start when everyone is ready.':'Mark yourself ready, then wait for the host.';
}
async function openRoom(action){
 audio.start();$('room-message').textContent='Connecting…';$('create-room').disabled=$('join-room').disabled=true;
 if(room){const previous=room;room=null;await previous.leave();}
 const next=new RaceRoom();room=next;
 next.readInput=localInput;next.readSnapshot=raceSnapshot;
 next.onState=state=>{
  if(room!==next)return;
  if(state.phase==='lobby')showLobby(state);
  if(state.phase==='racing'&&!onlineStarted){onlineStarted=true;lastSnapshotElapsed=-1;remoteSkill=remoteRecover=0;networkReady=room.host;$('online-screen').classList.add('hidden');start();$('connection').classList.remove('hidden');$('again').textContent='Back to garage';$('pause').textContent='Leave';}
  if(state.phase==='racing'){if(!room.host)applySnapshot(state.snapshot);$('connection').textContent='ROOM '+room.code+' · '+state.members.filter(m=>m.connected).length+' FRIENDS';}
 };
 next.onError=e=>{if(room!==next)return;$('room-message').textContent=e.message;$('connection').textContent=e.message;if(e.status===410||e.status===403||e.status===404){networkReady=false;room=null;$('online-screen').classList.remove('hidden');$('room-lobby').classList.add('hidden');$('room-entry').classList.remove('hidden');keys.clear();}};
 try{await next.open(action,selected,$('room-code').value||'',trackId)}catch(e){if(room===next)room=null;$('room-message').textContent=e.message||'Connection hiccup - try again';}finally{$('create-room').disabled=$('join-room').disabled=false;}
}
$('online').onclick=()=>{if(!modelsReady)return;timeTrial=false;ghostMode=false;if(cup){toast('Return to the garage to leave the Cup before racing online.');return}$('online-screen').classList.remove('hidden');$('room-entry').classList.remove('hidden');$('room-lobby').classList.add('hidden');$('room-message').textContent='Racing as '+characters[selected].name;};
$('create-room').onclick=()=>openRoom('create');$('join-room').onclick=()=>openRoom('join');
$('ready-room').onclick=async()=>{try{await room.ready(true);$('room-message').textContent='Ready! Waiting for the host.'}catch(e){$('room-message').textContent=e.message}};
$('start-room').onclick=async()=>{try{await room.start()}catch(e){$('room-message').textContent=e.message}};
$('copy-code').onclick=async()=>{try{await navigator.clipboard.writeText(room.code);$('room-message').textContent='Room code copied.'}catch{$('room-message').textContent='Share this code: '+room.code}};
 $('close-online').onclick=()=>{const current=room;room=null;if(current)void current.leave();$('online-screen').classList.add('hidden')};
$('leave-room').onclick=()=>{$('online-screen').classList.add('hidden');garage()};
$('cup-start').onclick=()=>{menuStep('track')};$('start').onclick=()=>{if(!room){timeTrial=false;ghostMode=false;practice=false;start()}};$('again').onclick=()=>{if(room)garage();else if(cup){if(cup.results.length===tourTracks(cup).length)beginCup(cup.cupId||'whisper');else{cup.round=cup.results.length;if(saveCup())location.href='?track='+tourTracks(cup)[cup.round]+'&cup=1';}}else start()};$('garage').onclick=garage;$('quit').onclick=garage;$('pause').onclick=togglePause;$('resume').onclick=togglePause;$('boost').onclick=useSkill;$('recover').onclick=recoverKart;$('rescue-kart').onclick=()=>{recoverKart();stuckSeconds=0;$('rescue-kart').classList.add('hidden')};$('sound').onclick=()=>{const on=audio.toggleSfx();winnerVideo.setMuted(!on);$('sound').textContent=on?'SFX on':'SFX off';$('sound').setAttribute('aria-pressed',String(on));if(on)audio.effect('crystal')};
$('music').onclick=()=>{const on=audio.toggleMusic();$('music').textContent=on?'Music on':'Music off';$('music').setAttribute('aria-pressed',String(on));if(mode==='paused')audio.pause()};

addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(!e.repeat){if(e.code==='Space')useSkill();if(e.code==='KeyR')recoverKart();if(e.code==='Escape'||e.code==='KeyP')togglePause()}});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();if(mobileDevice&&(mode==='racing'||mode==='countdown'))togglePause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&timeTrial&&runStats)runStats.eligible=false;if(document.hidden&&(mode==='racing'||mode==='countdown'))togglePause()});document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('pressed');keys.add(b.dataset.key)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{b.classList.remove('pressed');keys.delete(b.dataset.key)})});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
async function prepareDrivers(){
 if(!scene.getObjectByName('race-sky')?.userData.courseBackdrop){
  $('model-status').textContent='Preparing course artwork…';
  try{const texture=await loadCourseBackdrop(trackId,Math.min(4096,renderer.capabilities.maxTextureSize));applyCourseBackdrop(scene,texture,trackId);}
  catch{toast('Course artwork could not load. Using the standard sky.');}
 }
 if(trackId!=='showcase'&&!scene.getObjectByName('meshy-course-depth')){
  $('model-status').textContent='Preparing course scenery…';
  try{await loadMeshyScenery();if(!scene.getObjectByName('meshy-course-depth'))placeCourseScenery(scene,track);if(trackId==='wood')oak.visible=false;}catch{toast('Using lightweight scenery for this race.');}
 }

 if(trackId==='showcase'&&!scene.getObjectByName('meshy-showcase-assets')){
  modelsReady=false;$('start').disabled=true;$('online').disabled=true;$('model-status').textContent='Loading Crystal Bears scenery...';
  try{const [,textures]=await Promise.all([loadMeshyScenery(),loadShowcaseSurfaces()]);applyShowcaseSurfaces(scene,...textures,roadMat,edgeMat,grassMat);dryRoad.copy(roadMat.color);if(!scene.getObjectByName('meshy-showcase-assets'))placeMeshyScenery(scene,track);}
  catch{$('model-status').textContent='Scenery could not load. Please retry.';$('retry-models').classList.remove('hidden');return;}
 }
 modelsReady=false;$('start').disabled=true;$('online').disabled=true;$('retry-models').classList.add('hidden');
 try{await loadDrivers(characters,(loaded,total)=>{$('model-status').textContent='Loading characters '+loaded+' / '+total;});modelsReady=true;makeRacers();if(!cup&&(raceRequested||new URLSearchParams(location.search).get('race')==='1')){history.replaceState(null,'','?track='+trackId+'&step=track');start();}if(cup){$('start').textContent=cup.results.length>cup.round?'View Cup standings':'Start Cup · round '+(cup.round+1)+' of '+tourTracks(cup).length;if(cup.results.length>cup.round)showCupResults();else start();}$('model-status').textContent='All nine 3D characters ready';$('start').disabled=false;$('online').disabled=false;}
 catch{$('model-status').textContent='A character model could not load. Please retry.';$('retry-models').classList.remove('hidden');}
}
$('retry-models').onclick=prepareDrivers;
const mobile=createMobileControls({guide:()=>audio.guide('aida-setup',true),stopGuide:()=>audio.stopGuide(),interrupt:()=>{keys.clear();if(mode==='racing'||mode==='countdown'){togglePause();return mode==='paused';}return false;},resume:()=>{if(mode==='paused')togglePause();}});

function refreshPaints(){
 const select=$('paint-select');select.innerHTML=['Your bear’s colours','Lagoon blue','Sunshine gold','Crystal purple','Rare rose gold'].map((name,i)=>{const locked=i===4?shardCount()<3:i>raceRewards;return '<option value="'+i+'" '+(locked?'disabled':'')+'>'+name+(locked?(i===4?' · collect 3 course shards':' · finish '+i+' races'):'')+'</option>'}).join('');select.value=String(paintChoice);
 $('paint-progress').textContent=raceRewards<3?'Finish '+(raceRewards+1)+' races to unlock your next paint.':'Standard paints unlocked · '+shardCount()+' / 3 shards for Rare rose gold';
}
$('paint-select').onchange=e=>{paintChoice=Number(e.target.value);try{localStorage.setItem('kart-paint',String(paintChoice))}catch{}makeRacers()};
$('practice-start').onclick=()=>{if(!room&&!cup){timeTrial=false;ghostMode=false;practice=true;start()}else toast('Return to the garage first to practise.')};
refreshPaints();

for(const event of ['pointerdown','touchend','click'])addEventListener(event,()=>{audio.unlock();if(mode==='racing'||mode==='countdown')audio.playMusic();},{passive:true,capture:true});
function setupMenuFlow(){
 const horn=document.createElement('button');horn.id='garage-horn';horn.className='secondary';horn.textContent='Crystal chime';horn.hidden=roundB.equipped.horn!=='horn-bell';document.body.append(horn);horn.onclick=()=>audio.effect('crystal');
 const menu=$('menu'),intro=menu.querySelector('.intro'),garagePanel=menu.querySelector('.garage');
 const home=document.createElement('section');home.className='flow-home';home.innerHTML='<div class="home-copy"><span class="menu-kicker">THE CRYSTAL BEARS</span><h1>CRYSTAL<br><em>KARTS</em></h1><p class="home-tagline">Little racers. Big adventures.</p><button id="flow-play" class="primary">Let’s race <span aria-hidden="true">➜</span></button><p class="home-hint">Choose a racer · Pick a circuit · Go!</p></div><div class="home-race-art"><img src="assets/crystal-karts-racing.webp" width="1672" height="941" fetchpriority="high" alt="Keen, Amie and Fuzzby racing their crystal-powered karts along the coast"></div><div id="flow-extras" aria-label="More ways to play"></div>';
 const nav=document.createElement('nav');nav.className='flow-nav';nav.innerHTML='<button id="flow-back">← Back</button><strong id="flow-heading"></strong>';
 const tracks=document.createElement('section');tracks.className='flow-tracks';tracks.innerHTML='<div class="track-heading"><div><span class="menu-kicker">FIND YOUR NEXT ADVENTURE</span><h2>Pick a circuit</h2></div><div id="selected-racer"></div></div><p class="track-hint">Choose a course to start racing · 3 laps</p><section class="cup-row" aria-labelledby="cup-row-title"><h3 id="cup-row-title">🏆 Cups</h3><div id="cup-cards"></div></section><div id="track-cards"></div>';
 const difficultyChoice=document.createElement('fieldset');difficultyChoice.className='difficulty-choice';difficultyChoice.innerHTML='<legend>Choose your difficulty</legend>'+Object.entries(DIFFICULTIES).map(([id,t])=>'<label><input type="radio" name="difficulty" value="'+id+'" '+(id===difficulty?'checked':'')+'><strong>'+t.label+'</strong><span>'+t.description+'</span></label>').join('');tracks.insertBefore(difficultyChoice,tracks.querySelector('#track-cards'));difficultyChoice.onchange=e=>{difficulty=e.target.value;try{localStorage.setItem('kart-difficulty',difficulty)}catch{}};
 menu.dataset.cupMode=cup?'yes':'no';menu.prepend(nav,home);menu.append(tracks);
 for(const id of ['practice-start','ghost-start','sticker-open','online','cup-start','phone-setup'])$('flow-extras').append($(id));
 const garageButton=document.createElement('button');garageButton.id='bear-garage-open';garageButton.textContent='Bear Garage · '+roundB.coins+' ◆';$('flow-extras').append(garageButton);
 const garageDialog=document.createElement('dialog');garageDialog.id='bear-garage';garageDialog.innerHTML='<h2>Bear Garage</h2><p id="garage-coins"></p><p id="daily-challenge"></p><div id="garage-shop"></div><p id="garage-owned"></p><button id="bear-garage-close" class="secondary">Done</button>';document.body.append(garageDialog);
 function drawBearGarage(){if(roundB.shards.length>=11&&!roundB.owned.includes('golden-kart')){roundB.owned.push('golden-kart');saveRoundB();}const challenge=dailyFor(),complete=roundB.daily.date===challenge.date&&roundB.daily.done;$('garage-coins').textContent='Crystal coins · '+roundB.coins+' ◆';$('daily-challenge').textContent='Daily · '+challenge.text+' · '+challenge.reward+' coins'+(complete?' · Complete ✓':'');$('garage-shop').innerHTML=SHOP.map(item=>{const owned=roundB.owned.includes(item.id),locked=item.gold==='all-shards'?roundB.shards.length<11:item.gold?roundB.cups[item.gold]!=='gold':false;const reason=item.gold==='all-shards'?'Find all 11 course shards':item.gold?'Win gold in '+item.gold+' cup':'';const label=owned?'Equip '+item.name+' · Owned':locked?reason:'Buy '+item.name+' · '+item.cost+' ◆';return '<button class="shop-item" data-shop="'+item.id+'" '+(locked?'disabled':'')+'>'+label+'</button>'}).join('');$('garage-owned').textContent='Cup trophies · '+Object.entries(roundB.cups).map(([id,medal])=>id+': '+medal).join(' · ')+' · Course shards '+roundBShardCount()+'/11'+(roundB.owned.includes('golden-kart')?' · Golden kart unlocked!':'');garageDialog.querySelectorAll('[data-shop]').forEach(button=>button.onclick=()=>{const id=button.dataset.shop;if(roundB.owned.includes(id)){equipItem(roundB,id);const hornButton=$('garage-horn');if(hornButton)hornButton.hidden=roundB.equipped.horn!=='horn-bell';toast('Equipped '+SHOP.find(i=>i.id===id)?.name);makeRacers();}else if(buyItem(roundB,id)){toast('Added to your Bear Garage!');if(SHOP.find(i=>i.id===id)?.kind==='hat')makeRacers();}else toast('Collect a few more crystal coins first.');saveRoundB();drawBearGarage();garageButton.textContent='Bear Garage · '+roundB.coins+' ◆';});}
 garageButton.onclick=()=>{drawBearGarage();garageDialog.showModal()};garageDialog.querySelector('#bear-garage-close').onclick=()=>garageDialog.close();
 tracks.append($('start'),$('model-status'),$('retry-models'));
 
 const shardBook=document.createElement('details');shardBook.className='shard-book';shardBook.innerHTML='<summary>◆ Course shards · '+shardCount()+' / 11</summary><p>Final lap. One chance. Take the golden Crystal Rush route at speed and thread all three gates cleanly. Finish the race to keep it. Collect 1 shard for a crystal trail, 3 for Rare rose gold paint and 5 for a victory dance. Saved on this device.</p><div>'+Object.entries(TRACKS).map(([id,t])=>'<span class="shard-stamp '+(shardCollection[id]?'owned':'')+'">'+(shardCollection[id]?'◆':'◇')+' '+t.name+'</span>').join('')+'</div>';garagePanel.append(shardBook);
 const paint=document.createElement('details');paint.innerHTML='<summary>Change kart paint</summary>';paint.append(menu.querySelector('.paint-choice'),$('paint-progress'));garagePanel.append(paint);
 $('cup-cards').innerHTML=Object.entries(CUPS).map(([id,c])=>{const best=roundB.cups[id],trophies={gold:'🥇 Gold trophy',silver:'🥈 Silver trophy',bronze:'🥉 Bronze trophy'};const courseNames=c.tracks.map(trackId=>TRACKS[trackId]?.name||trackId);return '<button class="cup-card" data-cup="'+id+'"><span class="cup-icon" aria-hidden="true">🏆</span><strong>'+c.name+'</strong><span class="cup-tracks">'+courseNames.join(' · ')+'</span><span class="cup-best">'+(trophies[best]||'No trophy yet')+'</span><span class="course-go">Race cup →</span></button>'}).join('');
 for(const button of document.querySelectorAll('.cup-card[data-cup]'))button.onclick=event=>{event.stopPropagation();beginCup(button.dataset.cup)};
 $('track-cards').innerHTML=Object.entries(TRACKS).map(([id,t],i)=>'<button class="track-card '+(id===trackId?'chosen':'')+'" data-course="'+id+'" aria-pressed="'+(id===trackId)+'"><span class="course-preview"><img class="course-feature" src="assets/scenery/backdrops/'+id+'.webp" alt="" loading="lazy">'+coursePreview(t)+'<span class="course-number">'+String(i+1).padStart(2,'0')+'</span></span><strong>'+t.name+'</strong><small>'+(t.owner==='all'?'All the Crystal Bears':characters.find(c=>c.id===t.owner)?.name)+'</small><span class="course-go">Race here →</span></button>').join('');
 for(const button of document.querySelectorAll('[data-course]'))button.onclick=()=>{if(button.dataset.course===trackId){ghostMode=false;practice=false;raceRequested=true;if(modelsReady)start();else $('model-status').textContent='Getting your racer ready…';return;}$('track-select').value=button.dataset.course;$('track-select').dispatchEvent(new Event('change'))};
 function show(step){if(step==='racer'){const book=menu.querySelector('.shard-book');book.querySelector('summary').textContent='◆ Course shards · '+shardCount()+' / 11';book.querySelectorAll('.shard-stamp').forEach((el,i)=>{const id=Object.keys(TRACKS)[i];el.classList.toggle('owned',!!shardCollection[id]);el.textContent=(shardCollection[id]?'◆':'◇')+' '+TRACKS[id].name;});}const racer=characters[selected];if(step==='track')audio.preloadCountdownVoice(racer.id);$('selected-racer').innerHTML='<img src="assets/drivers/'+racer.id+'.webp" alt=""><span>RACING AS<strong>'+racer.name+'</strong></span>';menu.dataset.step=step;$('flow-heading').textContent=step==='racer'?'1 · Choose your racer':step==='track'?'2 · Choose your track':'';menu.scrollTop=0;$('flow-heading').tabIndex=-1;if(step!=='home')$('flow-heading').focus({preventScroll:true});}
 $('flow-play').onclick=()=>{timeTrial=false;trialTarget=null;trialUI?.clearTarget();for(const b of document.querySelectorAll('[data-course]'))b.hidden=false;show('racer');};menuStep=show;
 $('flow-back').onclick=()=>show(menu.dataset.step==='track'?'racer':'home');
 show(cup||new URLSearchParams(location.search).get('step')==='track'?'track':'home');
}

const rivalChip=document.createElement('div');rivalChip.id='race-rival';rivalChip.hidden=true;$('hud').append(rivalChip);
rareShard=createRareShard({scene,track,hazards,toast,audio});
setupMenuFlow();
trialUI=createTrialUI({tracks:TRACKS,characters,choose:id=>{
 if(room||cup){toast('Return to the garage first.');return;}
 timeTrial=true;practice=false;trialTarget=null;trialUI?.clearTarget();for(const b of document.querySelectorAll('[data-course]'))b.hidden=false;
 if(id&&id!==trackId){location.href='?track='+id+'&tt=1&step=track';return;}
 menuStep('racer');$('menu').classList.remove('hidden');
},progress:()=>({earned:collection.earned,roundB}),onRestore:data=>{
 collection.earned=[...new Set([...collection.earned,...cleanProgress(data).earned])];if(data?.roundB&&typeof data.roundB==='object'){const remote=data.roundB;roundB.coins=Math.max(roundB.coins,Number(remote.coins)||0);roundB.owned=[...new Set([...roundB.owned,...(Array.isArray(remote.owned)?remote.owned:[])])];roundB.shards=[...new Set([...roundB.shards,...(Array.isArray(remote.shards)?remote.shards:[])])];roundB.cups={...roundB.cups,...(remote.cups||{})};if(roundB.shards.length>=11&&!roundB.owned.includes('golden-kart'))roundB.owned.push('golden-kart');saveRoundB();}
 try{localStorage.setItem('crystal-stickers-v1',JSON.stringify(collection));}catch{}
},onLook:looks=>{cosmetics=looks;}});
const challengeId=new URLSearchParams(globalThis.location?.search||'').get('challenge');
if(challengeId){trialLoading=true;trialAPI('read',{id:challengeId}).then(d=>{
 if(d.rules!==TRIAL_RULES||!TRACKS[d.track])throw Error('This challenge uses older rules. Start a new Time Trial.');
 if(d.track!==trackId){location.href='?track='+d.track+'&tt=1&challenge='+encodeURIComponent(challengeId);return;}
 timeTrial=true;trialTarget=d;trialUI.target(d);menuStep('racer');
 for(const b of document.querySelectorAll('[data-course]'))b.hidden=b.dataset.course!==d.track;
}).catch(e=>trialUI.unavailable(e.message)).finally(()=>trialLoading=false);}

$('sticker-open').onclick=()=>{renderStickers();$('sticker-book').showModal();};
$('close-stickers').onclick=()=>$('sticker-book').close();
$('result-stickers').onclick=()=>{renderStickers();$('sticker-book').showModal();};
$('next-track').onclick=()=>{const ids=Object.keys(TRACKS);location.href='?track='+ids[(ids.indexOf(trackId)+1)%ids.length]+'&step=track&race=1'+(timeTrial?'&tt=1':'');};
$('ghost-start').onclick=()=>{timeTrial=true;if(room||cup){toast('Return to the garage to race your best.');return;}ghostMode=true;practice=false;start();};
function renderStickers(){
 const stickers=[...characters.map(c=>({id:'racer:'+c.id,name:c.name,hint:'Finish a race as '+c.name,image:'assets/'+c.id+'.png'})),...Object.entries(TRACKS).map(([id,t])=>({id:'track:'+id,name:t.name,hint:'Finish this course',icon:'⚑'})),...ACHIEVEMENTS];
 $('sticker-count').textContent=collection.earned.filter(id=>stickers.some(s=>s.id===id)).length+' / '+stickers.length+' collected · saved on this device';
 $('sticker-grid').innerHTML=stickers.map(s=>{const earned=collection.earned.includes(s.id);return '<article class="sticker '+(earned?'earned':'locked')+'">'+(s.image?'<img src="'+s.image+'" alt="">':'<b aria-hidden="true">'+s.icon+'</b>')+'<strong>'+s.name+'</strong><small>'+(earned?'Collected ✓':s.hint)+'</small></article>';}).join('');
}

for(const button of document.querySelectorAll('[data-tour]'))button.onclick=()=>{pendingTour=button.dataset.tour;$('tour-picker').close();menuStep('racer');$('flow-heading').textContent='Choose your racer · '+button.textContent.trim().split('\n')[0];};
$('close-tour').onclick=()=>$('tour-picker').close();
$('resume-tour').onclick=()=>{try{const saved=JSON.parse(localStorage.getItem('crystal-tour-save')||'null');if(!validCup(saved)){toast('No saved tour yet. Choose a tour to begin.');return}sessionStorage.setItem('crystal-cup',JSON.stringify(saved));location.href='?track='+tourTracks(saved)[saved.round]+'&cup=1';}catch{toast('Your saved tour is unavailable.')}};

renderCharacters();makeRacers();prepareDrivers();updateCamera(1,true);let previous=performance.now();function tick(now){requestAnimationFrame(tick);const frameMs=now-previous;qualitySample(frameMs,mobileDevice&&mode==='racing'&&!document.hidden);if(timeTrial&&mode==='racing'&&runStats){trialSlowFrames=frameMs>250?trialSlowFrames+1:0;if(trialSlowFrames>=3)runStats.eligible=false}else trialSlowFrames=0;const rawDt=Math.min(.04,frameMs/1000),dt=rawDt*(now<finishSlowUntil?.32:1);previous=now;if(mode==='countdown'&&(!room||room.host||networkReady)){countTime-=dt;const voiceLive=countdownVoiceForRun&&audio.countdownVoice===countdownVoiceForRun&&audio.sfxEnabled;const voiceT=voiceLive?countdownVoiceForRun.currentTime:countdownVoiceForRun?Math.max(0,countdownVoiceForRun.duration+.05-countTime):0;const n=countdownVoiceForRun?(voiceT>=countdownVoiceGoAt?0:Math.max(1,3-Math.min(2,Math.floor(voiceT/(countdownVoiceGoAt/3))))):Math.ceil(countTime);$('countdown').innerHTML=n>0?'<span style="color:#'+([0,0xffd66e,0x74eaff,0xc7a2ff][n]||0x8ff4ff).toString(16).padStart(6,'0')+'">'+n+'</span>':'<span style="color:#baff82">GO!</span>';if(n!==lastCount){if(n===0){player.rocketReady=!player.rocketEarly;player.rocketReadyUntil=performance.now()+1200;}else if(localInput().throttle)player.rocketEarly=true;lastCount=n;tone(n>0?440:880,.18)}if(countTime<-.55){mode='racing';if(timeTrial)trialStart=performance.now();$('countdown').classList.add('hidden');if(practice)audio.guide('keen-practice',true);toast(practice?'Practice: hold Go, steer, then try your crystal!':mobile.enabled()?'Tilt to steer. Hold Go to drive.':'Slide your left thumb to steer. Hold Go to drive.')}}if(mode==='racing'&&(!room||networkReady)){if(room&&performance.now()-room.lastGood>2500){keys.clear();$('connection').textContent='Connection interrupted · waiting for room';}else updateRace(dt);}if(mode==='menu'||mode==='countdown')for(const r of [player,...bots]){animateDriver(r.kart.bear,now/1000,0,true);r.kart.bear.rotation.z=Math.sin(now*.002+r.phase)*.06;}if(mode==='results'){for(const r of [player,...bots])if(r.time!==null){animateDriver(r.kart.bear,now/1000,0,true);r.kart.bear.position.y=Math.abs(Math.sin(now*.007+r.phase))*.18;r.kart.bear.rotation.y=Math.sin(now*.005+r.phase)*.15;}stepFeedback(dt)}if(mode!=='paused'){scenery.animate(now/1000);for(const p of pickups){p.crystal.rotation.y+=dt*1.4;p.crystal.position.y=1.9+Math.sin(now*.002+p.s)*.25}secretShard.rotation.y+=dt*1.5;secretShardRing.rotation.z+=dt*.7;const shardDelta=((secretShardAt-(player.s%length)+length/2)%length)-length/2;secretShard.visible=secretShardRing.visible=mode==='racing'&&player.completedLaps>=1&&!roundB.shards.includes(trackId)&&Math.abs(shardDelta)<34;updateCamera(dt)}if(now>toastUntil)$('toast').classList.remove('show');filmLook.update(now/1000,weather,[player,...bots]);if(mode==='results'){renderer.setViewport(0,0,innerWidth,innerHeight);renderer.clear();winnerStage.render(renderer,now/1000,innerWidth*(innerWidth>innerHeight?.5:1),innerWidth>innerHeight?innerHeight:innerHeight*.5,innerWidth>innerHeight?0:innerHeight*.5);}else{renderer.setViewport(0,0,innerWidth,innerHeight);renderer.render(scene,camera);if(mode==='racing')raceHighlight.frame(now)}}requestAnimationFrame(tick);
