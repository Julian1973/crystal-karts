// Party mode helpers shared by the big screen and the phone controller.
export const PARTY_BEARS=Object.freeze([['keen','Keen','#19b9dd'],['aida','Aida','#be7ee9'],['sunny','Sunny','#ffc347'],['misty','Misty','#b8d9ef'],['amie','Amie','#f27da8'],['howey','Howey','#83a2a8'],['luna','Luna','#b698dc'],['zenny','Zenny','#f5c447'],['fuzzby','Fuzzby','#e5a52a']]);
export const PARTY_TRACKS=Object.freeze(['wood','river','honey','moon','coast','night','rose','blossom','zen','cove','showcase']);
export const validRoomCode=code=>/^[A-Z2-9]{6}$/.test(String(code||'').toUpperCase());
export function controllerURL(base,code,track){const u=new URL('controller.html',base);u.searchParams.set('room',String(code).toUpperCase());u.searchParams.set('track',PARTY_TRACKS.includes(track)?track:'wood');return u.href;}
export function readControllerParams(search){const q=new URLSearchParams(search||'');const code=(q.get('room')||'').toUpperCase(),track=q.get('track');return {code:validRoomCode(code)?code:'',track:PARTY_TRACKS.includes(track)?track:'wood'};}
// Tilt (degrees of phone roll) becomes the same left/right buttons the room server accepts.
export function tiltToSteer(gamma,dead=9){if(!Number.isFinite(gamma)||Math.abs(gamma)<dead)return {left:false,right:false};return {left:gamma<0,right:gamma>0};}
// Split-screen layout for 1-4 racers on one screen: [x,y,w,h] in CSS pixels, origin bottom-left (WebGL).
export function partyViewports(count,w,h){
 const n=Math.max(1,Math.min(4,count|0));
 if(n===1)return [[0,0,w,h]];
 if(n===2)return w>=h?[[0,0,w/2,h],[w/2,0,w/2,h]]:[[0,h/2,w,h/2],[0,0,w,h/2]];
 const hw=w/2,hh=h/2;return [[0,hh,hw,hh],[hw,hh,hw,hh],[0,0,hw,hh],[hw,0,hw,hh]].slice(0,n);
}
export function qrSVG(qrcode,text,cellSize=5){const qr=qrcode(0,'M');qr.addData(text);qr.make();return qr.createSvgTag({cellSize,margin:2,scalable:true});}
