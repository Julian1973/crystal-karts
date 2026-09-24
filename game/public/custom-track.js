// Kids' Track Builder: a custom course is a loop of control points drawn on a top-down map.
// It borrows a real course's world (scenery, sky, music) and is shared as a link.
import {Vector3,CatmullRomCurve3} from './assets/three.module.js?v=75';
export const BUILDER_THEMES=Object.freeze({wood:'Whisper Wood',honey:'Honey Hill',moon:'Moonlight Pool',coast:'Crystal Coast',night:'Starlight Forest',blossom:'Blossom Trail'});
export const LIMITS=Object.freeze({minPoints:6,maxPoints:16,extent:220,maxHeight:24,minLength:520,maxLength:1500,gap:30,maxBend:.15});
export function templateTrack(){return {v:1,name:'My Crystal Track',theme:'wood',points:[[0,1,120],[95,2,100],[150,4,30],[130,6,-60],[60,4,-120],[-40,3,-120],[-125,4,-70],[-150,2,20],[-105,1,95]]};}
const clampInt=(v,lo,hi)=>Math.max(lo,Math.min(hi,Math.round(Number(v)||0)));
export function cleanName(name){return String(name||'').replace(/[<>&"'`]/g,'').replace(/\s+/g,' ').trim().slice(0,24)||'My Crystal Track';}
export function normaliseTrack(t){
 const points=Array.isArray(t?.points)?t.points.slice(0,LIMITS.maxPoints).map(p=>[clampInt(p?.[0],-LIMITS.extent,LIMITS.extent),clampInt(p?.[1],0,LIMITS.maxHeight),clampInt(p?.[2],-LIMITS.extent,LIMITS.extent)]):[];
 return {v:1,name:cleanName(t?.name),theme:Object.hasOwn(BUILDER_THEMES,t?.theme)?t.theme:'wood',points};
}
const toB64=s=>typeof btoa==='function'?btoa(s):Buffer.from(s,'binary').toString('base64'),fromB64=s=>typeof atob==='function'?atob(s):Buffer.from(s,'base64').toString('binary');
export function encodeTrack(t){const n=normaliseTrack(t),json=JSON.stringify({v:1,n:n.name,t:n.theme,p:n.points});return toB64(unescape(encodeURIComponent(json))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function decodeTrack(code){try{if(typeof code!=='string'||code.length>1600||!/^[A-Za-z0-9_-]+$/.test(code))return null;const json=decodeURIComponent(escape(fromB64(code.replace(/-/g,'+').replace(/_/g,'/'))));const d=JSON.parse(json);if(d?.v!==1)return null;const t=normaliseTrack({name:d.n,theme:d.t,points:d.p});return validateTrack(t.points).ok?t:null;}catch{return null}}
// A course is raceable when it is long enough, bends are drivable and no two parts of the road overlap.
export function validateTrack(points){
 const problems=[];if(!Array.isArray(points)||points.length<LIMITS.minPoints)return {ok:false,problems:['Add at least '+LIMITS.minPoints+' points'],length:0};
 if(points.length>LIMITS.maxPoints)problems.push('Use at most '+LIMITS.maxPoints+' points');
 const curve=new CatmullRomCurve3(points.map(p=>new Vector3(...p)),true,'catmullrom',.35),length=curve.getLength();
 if(length<LIMITS.minLength)problems.push('Make the loop bigger');if(length>LIMITS.maxLength)problems.push('Make the loop smaller');
 const N=Math.max(80,Math.round(length/6)),pts=curve.getSpacedPoints(N).slice(0,N),step=length/N;
 let sharp=false;for(let i=0;i<N;i++){const a=pts[(i-1+N)%N],b=pts[i],c=pts[(i+1)%N];const y1=Math.atan2(b.x-a.x,b.z-a.z),y2=Math.atan2(c.x-b.x,c.z-b.z);if(Math.abs(Math.atan2(Math.sin(y2-y1),Math.cos(y2-y1)))/step>LIMITS.maxBend)sharp=true;}
 if(sharp)problems.push('Smooth out a tight corner');
 const skip=Math.ceil(70/step);let overlap=false;for(let i=0;i<N&&!overlap;i++)for(let j=i+skip;j<N;j++){if(N-(j-i)<skip)continue;const dx=pts[i].x-pts[j].x,dz=pts[i].z-pts[j].z;if(dx*dx+dz*dz<LIMITS.gap*LIMITS.gap){overlap=true;break;}}
 if(overlap)problems.push('Two parts of the road are too close');
 return {ok:!problems.length,problems,length};
}
