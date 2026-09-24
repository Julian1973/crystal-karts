// Cache course projection once; only the racer markers change during a race.
export function createRaceMap(canvas,track){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height,pad=24;
 const main=Array.from({length:181},(_,i)=>track.curve.getPointAt(i/180));
 const shortcuts=track.shortcuts.map(b=>Array.from({length:41},(_,i)=>b.path.getPointAt(i/40)));
 const all=[...main,...shortcuts.flat()],xs=all.map(p=>p.x),zs=all.map(p=>p.z);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 const scale=Math.min((width-pad*2)/(maxX-minX||1),(height-pad*2)/(maxZ-minZ||1));
 const project=p=>[width/2+(p.x-(minX+maxX)/2)*scale,height/2+(p.z-(minZ+maxZ)/2)*scale];
 const paths=[main,...shortcuts].map(path=>path.map(project));
 const finish=track.frame(0),finishPath=[project(finish.p.clone().addScaledVector(finish.right,-9)),project(finish.p.clone().addScaledVector(finish.right,9))],racerFrameTargets=Array.from({length:9},()=>track.frame(0));
 function path(points,color,lineWidth){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
 return {project,draw(player,rivals,characters){
  ctx.clearRect(0,0,width,height);ctx.lineJoin='round';ctx.lineCap='round';
  for(const points of paths){path(points,'#071f2a',18);path(points,'#bad6c8',9);}
  path(finishPath,'#ffffff',5);
  const leader=[player,...rivals].reduce((best,r)=>r.s>best.s?r:best,player);
  for(const [i,r] of [...rivals,player].entries()){
   const [x,y]=project(track.frame(r.s,r.lane,r.route||0,racerFrameTargets[i]).p),own=r===player;
   ctx.beginPath();ctx.arc(x,y,own?13:8,0,Math.PI*2);ctx.fillStyle=own?'#c5ff80':'#'+(characters[r.ci]?.color??0xffbd83).toString(16).padStart(6,'0');ctx.fill();ctx.strokeStyle='#102d38';ctx.lineWidth=4;ctx.stroke();
   if(r===leader&&!own){ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.strokeStyle='#ffe49a';ctx.lineWidth=3;ctx.stroke();}
   if(own){ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.stroke();}
  }
 }};
}
