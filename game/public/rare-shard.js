import * as T from './assets/three.module.js?v=75';
export function shardAttempt(previous,current,lane,speed,lap,target){
 if(lap!==2||previous>=target||current<target)return null;
 return current-previous<12&&Math.abs(lane)<.7&&speed>=22;
}
export function readShards(storage){
 try{const value=JSON.parse((storage||globalThis.localStorage).getItem('crystal-course-shards-v1')||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}
}
export function rushGate(previous,current,target,lane,speed){
 if(previous>=target||current<target)return null;
 return current-previous<12&&Math.abs(lane)<1.1&&speed>=18;
}
export function createRareShard({scene,track,toast,audio}){
 const b=track.rushRoute,group=new T.Group();group.name='crystal-rush';scene.add(group);group.visible=false;
 const material=new T.MeshStandardMaterial({color:0xffdf81,emissive:0xffb52e,emissiveIntensity:.7,roughness:.35});
 const positions=[],indices=[];
 for(let i=0;i<=100;i++){const f=track.frame(b.a+(b.b-b.a)*i/100,0,90);for(const side of [-1,1]){const p=f.p.clone().addScaledVector(f.right,side*9.4);positions.push(p.x,p.y+.05,p.z);}if(i<100){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const road=new T.Mesh(geo,new T.MeshStandardMaterial({color:0x846c46,roughness:.9,side:T.DoubleSide}));road.receiveShadow=true;group.add(road);
 const gates=[{u:0,lane:5},{u:.25,lane:3},{u:.52,lane:0},{u:.80,lane:-3}].map(({u,lane},i)=>{
  const at=b.a+(b.b-b.a)*u,f=track.frame(at,lane,90),ring=new T.Mesh(new T.TorusGeometry(i?2.2:2.5,.12,8,32),material.clone());ring.position.copy(f.p);ring.position.y+=2.3;ring.rotation.y=Math.atan2(f.t.x,f.t.z);group.add(ring);return {at,lane,ring};
 });
 for(let i=0;i<28;i++){const f=track.frame(b.a+(b.b-b.a)*i/27,i%2?9:-9,90);const gem=new T.Mesh(new T.OctahedronGeometry(.35),material);gem.position.copy(f.p);gem.position.y+=.65;group.add(gem);}
 let enabled=false,previous=0,announced=false,done=false,collected=false,clean=true,next=1,oldMusic;
 const restore=()=>{if(oldMusic!==undefined&&audio.music){audio.music.volume=oldMusic;oldMusic=undefined;}};
 return {
 reset(active){restore();enabled=active;previous=0;announced=done=collected=false;clean=true;next=1;group.visible=false;gates.forEach(g=>g.ring.material.color.setHex(0xffdf81));},
 update(player,time){
  player.rushEligible=enabled&&!done&&player.completedLaps===2;
  if(!enabled||done){previous=player.s;return;}
  const entry=2*track.length+b.a,exit=2*track.length+b.b,distance=entry-player.s;
  group.visible=player.completedLaps===2&&distance<135&&(distance>0||player.route===90);
  gates.forEach((g,i)=>g.ring.scale.setScalar(1+Math.sin(time*3+i)*.035));
  if(!announced&&group.visible){announced=true;toast('CRYSTAL RUSH · LEFT golden gate · enter at speed!');audio.effect('crystal');if(audio.music&&!audio.guideClip){oldMusic=audio.music.volume;audio.music.volume=.12;}}
  if(player.route===90){
   if(player.hitCooldown>0||player.spinTime>0||player.speed<10)clean=false;
   const g=gates[next];if(g){const ok=rushGate(previous,player.s,2*track.length+g.at,player.lane-g.lane,player.speed);if(ok!==null){clean=clean&&ok;g.ring.material.color.setHex(ok?0x91ffa6:0xff8878);next++;if(ok)audio.tone(660+next*180,.18,'sine',.075);toast(ok?'Crystal Rush · '+(next-1)+' / 3 gates':'Gate missed · keep racing!');}}
  }
  if((previous<entry&&player.s>=entry&&player.route!==90)||player.s>=exit){
   collected=player.s>=exit&&player.rushAttempted&&next===4&&clean&&!player.rushFailed;done=true;group.visible=false;restore();
   toast(collected?'CRYSTAL RUSH COMPLETE! Finish to keep your shard.':'Crystal Rush missed · another chance next race.');if(collected){audio.effect('boost');player.rushBoost=2;}
  }
  previous=player.s;
 },
 hide(){group.visible=false;restore();},
 finish(){group.visible=false;restore();if(!collected)return '';const owned=readShards();owned[track.id]=true;try{localStorage.setItem('crystal-course-shards-v1',JSON.stringify(owned));const count=Object.values(owned).filter(v=>v===true).length;return '◆ '+track.name+' shard!'+(count===1?' Crystal trail unlocked.':count===3?' Rare rose gold unlocked.':count===5?' Victory dance unlocked.':'');}catch{return '◆ Shard won · device storage unavailable';}}
 };
}
