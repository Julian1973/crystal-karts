// Kids' Track Builder page: drag points on a top-down map, check the loop, race it or share it.
import {Vector3,CatmullRomCurve3} from './assets/three.module.js?v=75';
import {BUILDER_THEMES,LIMITS,templateTrack,normaliseTrack,validateTrack,encodeTrack,decodeTrack,cleanName} from './custom-track.js?v=78';

const $=id=>document.getElementById(id);
const canvas=$('map'),ctx=canvas.getContext('2d'),SIZE=canvas.width,WORLD=LIMITS.extent+30;
const DRAFT='crystal-track-builder-draft-v1';
const THEME_COLOURS={wood:'#2f5e3b',honey:'#6b6a2c',moon:'#243b5c',coast:'#2a5d6b',night:'#1b2340',blossom:'#5e3b55'};
const fromShare=decodeTrack(new URLSearchParams(location.search).get('custom')||'');
let draft=null;try{draft=normaliseTrack(JSON.parse(localStorage.getItem(DRAFT)||'null'));if(draft.points.length<LIMITS.minPoints)draft=null;}catch{}
let track=fromShare||draft||templateTrack(),selected=0,dragging=-1,check=validateTrack(track.points);

const toCanvas=([x,,z])=>[(x+WORLD)/(2*WORLD)*SIZE,(z+WORLD)/(2*WORLD)*SIZE];
const toWorld=(cx,cy)=>[Math.round(cx/SIZE*2*WORLD-WORLD),Math.round(cy/SIZE*2*WORLD-WORLD)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function pointer(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width*SIZE,(e.clientY-r.top)/r.height*SIZE];}

// Handles stay finger-sized (about 20 CSS px) however small the map is drawn.
const px=()=>SIZE/Math.max(1,canvas.getBoundingClientRect().width||SIZE);
function save(){try{localStorage.setItem(DRAFT,JSON.stringify(track))}catch{}}
function changed(){check=validateTrack(track.points);save();render();}

function render(){
 ctx.fillStyle=THEME_COLOURS[track.theme]||'#2f5e3b';ctx.fillRect(0,0,SIZE,SIZE);
 ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;for(let g=0;g<=SIZE;g+=SIZE/12){ctx.beginPath();ctx.moveTo(g,0);ctx.lineTo(g,SIZE);ctx.moveTo(0,g);ctx.lineTo(SIZE,g);ctx.stroke();}
 if(track.points.length>=3){
  const curve=new CatmullRomCurve3(track.points.map(p=>new Vector3(...p)),true,'catmullrom',.35),pts=curve.getSpacedPoints(240).map(p=>toCanvas([p.x,0,p.z]));
  const road=(width,colour)=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.lineWidth=width;ctx.strokeStyle=colour;ctx.lineJoin='round';ctx.stroke();};
  road(19/(2*WORLD)*SIZE+6,check.ok?'#f3e2b8':'#ff8fa3');road(19/(2*WORLD)*SIZE,check.ok?'#d9c28f':'#c9606f');road(2,'rgba(255,255,255,.55)');
  const [sx,sy]=pts[0],[nx,ny]=pts[2],ang=Math.atan2(ny-sy,nx-sx);ctx.save();ctx.translate(sx,sy);ctx.rotate(ang);for(let i=-3;i<3;i++){ctx.fillStyle=i%2?'#111':'#fff';ctx.fillRect(-3,i*6,6,6);}ctx.restore();
  ctx.fillStyle='#fff';ctx.font='bold 22px system-ui';ctx.fillText('START',sx+14,sy-12);
 }
 const k=Math.max(1,px());track.points.forEach((p,i)=>{const [x,y]=toCanvas(p),r=(i===selected?24:19)*Math.max(1,k*.85);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=`hsl(${190-p[1]*6} 90% ${55+p[1]}%)`;ctx.fill();ctx.lineWidth=i===selected?5:3;ctx.strokeStyle=i===selected?'#ffd66e':'#0d1b30';ctx.stroke();ctx.fillStyle='#0d1b30';ctx.font='bold '+Math.round(20*Math.max(1,k*.85))+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),x,y);ctx.textAlign='start';ctx.textBaseline='alphabetic';});
 $('check').className=check.ok?'ok':'bad';
 $('check').innerHTML=check.ok?'✓ Ready to race! Length '+Math.round(check.length)+' m':'Almost there:<ul>'+check.problems.map(p=>'<li>'+p+'</li>').join('')+'</ul>';
 $('race').disabled=$('share').disabled=!check.ok;
 $('point-no').textContent=String(selected+1);$('height').value=String(track.points[selected]?.[1]??0);
 $('remove').disabled=track.points.length<=LIMITS.minPoints;
}

function nearestPoint(cx,cy){const reach=Math.max(40,28*px());let best=-1,bestD=reach*reach;track.points.forEach((p,i)=>{const [x,y]=toCanvas(p),d=(x-cx)**2+(y-cy)**2;if(d<bestD){best=i;bestD=d;}});return best;}
function nearestSegment(cx,cy){const reach=Math.max(30,22*px());let best=-1,bestD=reach*reach;for(let i=0;i<track.points.length;i++){const a=toCanvas(track.points[i]),b=toCanvas(track.points[(i+1)%track.points.length]);const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((cx-a[0])*dx+(cy-a[1])*dy)/(dx*dx+dy*dy||1),0,1),d=(a[0]+t*dx-cx)**2+(a[1]+t*dy-cy)**2;if(d<bestD){best=i;bestD=d;}}return best;}

canvas.addEventListener('pointerdown',e=>{const [cx,cy]=pointer(e),hit=nearestPoint(cx,cy);
 if(hit>=0){selected=dragging=hit;canvas.setPointerCapture(e.pointerId);render();return}
 const seg=nearestSegment(cx,cy);if(seg>=0&&track.points.length<LIMITS.maxPoints){const [x,z]=toWorld(cx,cy),a=track.points[seg],b=track.points[(seg+1)%track.points.length];track.points.splice(seg+1,0,[x,Math.round((a[1]+b[1])/2),z]);selected=dragging=seg+1;canvas.setPointerCapture(e.pointerId);changed();}
});
canvas.addEventListener('pointermove',e=>{if(dragging<0)return;const [cx,cy]=pointer(e),[x,z]=toWorld(clamp(cx,0,SIZE),clamp(cy,0,SIZE));track.points[dragging]=[clamp(x,-LIMITS.extent,LIMITS.extent),track.points[dragging][1],clamp(z,-LIMITS.extent,LIMITS.extent)];changed();});
for(const t of ['pointerup','pointercancel'])canvas.addEventListener(t,()=>{dragging=-1;});

$('height').addEventListener('input',e=>{if(track.points[selected]){track.points[selected][1]=Number(e.target.value);changed();}});
$('remove').onclick=()=>{if(track.points.length<=LIMITS.minPoints)return;track.points.splice(selected,1);selected=Math.min(selected,track.points.length-1);changed();};
$('reset').onclick=()=>{track=templateTrack();selected=0;$('name').value=track.name;$('theme').value=track.theme;changed();};
$('theme').replaceChildren(...Object.entries(BUILDER_THEMES).map(([id,name])=>{const o=document.createElement('option');o.value=id;o.textContent=name;return o;}));
$('theme').value=track.theme;$('theme').onchange=e=>{track.theme=e.target.value;changed();};
$('name').value=track.name;$('name').oninput=e=>{track.name=e.target.value;save();};$('name').onchange=e=>{track.name=cleanName(e.target.value);e.target.value=track.name;save();};

const raceURL=()=>{const u=new URL('./',location.href);u.searchParams.set('track',track.theme);u.searchParams.set('custom',encodeTrack(track));u.searchParams.set('step','track');return u;};
$('race').onclick=()=>{if(!check.ok)return;const u=raceURL();u.searchParams.set('race','1');location.href=u.href;};
$('share').onclick=async()=>{if(!check.ok)return;const link=raceURL().href;try{await navigator.clipboard.writeText(link);$('share-status').textContent='Link copied! Send it to a friend.';}catch{$('share-status').textContent=link;}};

addEventListener('resize',render);
render();
