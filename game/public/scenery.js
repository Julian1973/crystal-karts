import * as T from './assets/three.module.js?v=75';
import {WOODLAND_FLOOR,buildShowcase} from './showcase.js?v=75';
const PALETTES={night:{sky:0x111d3c,ground:0x263e42,road:0x8b97b0,leaves:[0x19394a,0x255048,0x3e6965,0x233b53],sun:0xb5d6ff,light:1.8},wood:{sky:0xb2d6d2,ground:0x477f57,road:0xc6ad86,leaves:[0x285b39,0x457b43,0x76a559,0x325f45],sun:0xffdfac,light:3.1},river:{sky:0xaedbe7,ground:0x4b8969,road:0xb7b298,leaves:[0x235f4a,0x387d61,0x72ad76,0x3a7156],sun:0xffe2b8,light:3.2},honey:{sky:0xf1d6a0,ground:0x9d9d47,road:0xd6b477,leaves:[0x7e8837,0xa7a04c,0xc4ae54,0x657339],sun:0xffcb82,light:3.4},moon:{sky:0x394965,ground:0x3d5c69,road:0x989ab8,leaves:[0x314658,0x3b5e69,0x55788b,0x4a506f],sun:0xb7d0ff,light:1.6},coast:{sky:0x9edced,ground:0xd9c58c,road:0xe4cda1,leaves:[0x38735b,0x548756,0x83aa62,0x306b55],sun:0xffedc5,light:3.5}};

Object.assign(PALETTES,{
 rose:{sky:0xf1d4da,ground:0x54816b,road:0xdac7b3,leaves:[0x789e73,0xb48aa3,0x719c81,0xd69caa],sun:0xffd9bd,light:2.8},
 blossom:{sky:0xc9ddf5,ground:0x71a476,road:0xd7bda2,leaves:[0xe1a3bf,0xc97ead,0x9679b3,0xf0bed5],sun:0xffe3cc,light:2.9},
 zen:{sky:0xbfded8,ground:0x497e6a,road:0xc0c8a4,leaves:[0x477865,0x639b79,0x87b886,0x326957],sun:0xffe7b8,light:2.7},
 cove:{sky:0xaedcf1,ground:0x5a9673,road:0xd8c7a1,leaves:[0x639a79,0x80b58c,0xb297c5,0x70adb1],sun:0xffdca4,light:3.1}
});
export function dressCourse({scene,track,roadMat,edgeMat,grassMat,leafMats,sun,water,oak,frame,rand,lowPower=false}){
 if(track.id==='showcase'){const base=buildShowcase({scene,track,roadMat,edgeMat,grassMat,leafMats,sun,water,oak,frame,rand}),fx=buildRoadFX(scene,track,frame,lowPower,0xb9a4ff);return {...base,...fx,animate(time){base.animate?.(time);fx.animate(time)}};}
 const roadFrame=frame;frame=(s,lane=0)=>{const f=roadFrame(s,lane);if(Math.abs(lane)>11.4)f.p.y=WOODLAND_FLOOR;return f;};
 const p=PALETTES[track.id]||PALETTES.wood,group=new T.Group();scene.add(group);group.name='course-scenery';
 roadMat.color.setHex(p.road);grassMat.color.setHex(p.ground);edgeMat.color.setHex((track.night||track.id==='moon')?0xbac7d4:0xe4d5b0);leafMats.forEach((m,i)=>m.color.setHex(p.leaves[i]));sun.color.setHex(p.sun);sun.intensity=p.light;sun.shadow.radius=3;oak.visible=['wood','river','night'].includes(track.id);
 if(track.night){roadMat.emissive.setHex(0x17263d);roadMat.emissiveIntensity=.22;edgeMat.emissive.setHex(0x83d9e3);edgeMat.emissiveIntensity=.35;}
 const pixels=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const seam=(x%16<1||y%12<1)?18:0,n=Math.max(0,Math.min(255,220+Math.floor(rand()*25)-seam)),i=(y*128+x)*4;pixels.set([n,Math.max(0,n-7),Math.max(0,n-16),255],i)}const tex=new T.DataTexture(pixels,128,128);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(5,2);tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;roadMat.map=tex;roadMat.bumpMap=tex;roadMat.bumpScale=.055;roadMat.needsUpdate=true;
 const ball=new T.SphereGeometry(1,20,12),box=new T.BoxGeometry(1,1,1),rock=new T.IcosahedronGeometry(1,2),stem=new T.CylinderGeometry(.12,.18,1,8),materials={};
 const material=(color,emissive=false)=>materials[color+'-'+emissive]??=(new T.MeshStandardMaterial({color,roughness:.66,emissive:emissive?color:0,emissiveIntensity:emissive?.55:0}));
 const put=(geo,color,pos,scale,glow=false)=>{const m=new T.Mesh(geo,material(color,glow));m.position.copy(pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;group.add(m);return m};
 // Distant hills provide a layered horizon without obstructing the race surface.
 for(let i=0;i<22;i++){const a=i/22*Math.PI*2,r=370+rand()*130;put(ball,p.leaves[i%4],new T.Vector3(Math.sin(a)*r,-25,Math.cos(a)*r),[70+rand()*60,45+rand()*75,80+rand()*60]);}
 // Painted kerbs make the playable road edge explicit. Instancing keeps this cheap.
 // The road edge is already defined by the continuous edge ribbon; omit the
 // decorative raised kerb blocks and roadside lamp pegs from every course.
 const dummy=new T.Object3D();
 if(track.id==='honey'){
  for(let i=0;i<38;i++){const f=frame(i/38*track.length,(i%2?1:-1)*(17+rand()*9)),h=2+rand()*2;put(stem,0x668348,f.p.clone().add(new T.Vector3(0,h/2,0)),[2,h,2]);const centre=f.p.clone().add(new T.Vector3(0,h,0));put(ball,0x815732,centre,[.4,.4,.25]);for(let j=0;j<7;j++){const a=j/7*Math.PI*2;put(ball,0xffcf56,centre.clone().add(new T.Vector3(Math.sin(a)*.62,Math.cos(a)*.62,0)),[.34,.48,.20]);}}
  for(let i=0;i<5;i++){const f=frame((i+.25)/5*track.length,23);put(ball,0xd18d34,f.p.clone().add(new T.Vector3(0,4,0)),[2,3,2]);for(let j=0;j<4;j++){const ring=new T.Mesh(new T.TorusGeometry(1.8,.13,6,20),material(0x9e6729));ring.rotation.x=Math.PI/2;ring.position.copy(f.p).add(new T.Vector3(0,2.5+j*.8,0));group.add(ring);}}
 }
 if(track.id==='moon'){
  water.geometry=new T.CircleGeometry(64,80);water.position.set(0,-.7,0);water.material.color.setHex(0x526baf);water.material.emissive.setHex(0x192d52);water.material.emissiveIntensity=.6;
  put(ball,0xf0efd9,new T.Vector3(50,125,-260),[15,15,15],true);
  for(let i=0;i<35;i++){const f=frame(i/35*track.length,(i%2?1:-1)*(17+rand()*8)),h=1+rand()*2;put(stem,0xb3c0d1,f.p.clone().add(new T.Vector3(0,h/2,0)),[3,h,3]);put(ball,i%2?0x89c8d7:0x9b87bf,f.p.clone().add(new T.Vector3(0,h,0)),[1.3,.5,1.3],true);}
 }
 if(track.id==='coast'){
  water.geometry=new T.CircleGeometry(360,96);water.position.set(350,-.9,0);water.material.color.setHex(0x32bbc4);water.material.roughness=.2;
  for(let i=0;i<24;i++){const f=frame(i/24*track.length,(i%2?1:-1)*22);put(rock,0xb6a27d,f.p.clone().add(new T.Vector3(0,-3,0)),[7,5,6]);const top=f.p.clone().add(new T.Vector3(0,8,0));put(stem,0x997653,f.p.clone().add(new T.Vector3(0,4,0)),[4,8,4]);for(let j=0;j<5;j++){const a=j/5*Math.PI*2,leaf=put(ball,0x43846b,top.clone().add(new T.Vector3(Math.sin(a)*2,-.4,Math.cos(a)*2)),[.75,.3,3]);leaf.rotation.y=a;leaf.rotation.x=.2;}}
 }

 // Character gardens: smooth petal meshes are instanced to keep mobile draw calls low.
 if(['rose','blossom','zen','cove'].includes(track.id)){
  const colors=track.id==='rose'?[0xffbdd1,0xf5dfd2]:track.id==='blossom'?[0xe1a3f4,0xffb2d0]:track.id==='zen'?[0xf4d68b,0xf4cfe3]:[0x6fefff,0xffc95a,0xcaa2ef,0xf29ec4];
  const petals=new T.InstancedMesh(ball,material(colors[0]),180),centres=new T.InstancedMesh(ball,material(0xffd57a),30);
  for(let i=0;i<30;i++){
   const f=frame((i+.35)/30*track.length,(i%2?1:-1)*(18+rand()*9));
   const height=track.id==='zen'?.35:1.3+rand()*1.5;
   if(track.id!=='zen')put(stem,0x45835e,f.p.clone().add(new T.Vector3(0,height/2,0)),[1,height,1]);
   dummy.position.copy(f.p).add(new T.Vector3(0,height,0));dummy.scale.set(.4,.23,.4);dummy.rotation.set(0,0,0);dummy.updateMatrix();centres.setMatrixAt(i,dummy.matrix);
   for(let j=0;j<6;j++){const a=j/6*Math.PI*2;dummy.position.copy(f.p).add(new T.Vector3(Math.sin(a)*.65,height,Math.cos(a)*.65));dummy.scale.set(.38,.18,.66);dummy.rotation.y=a;dummy.updateMatrix();petals.setMatrixAt(i*6+j,dummy.matrix);petals.setColorAt(i*6+j,new T.Color(colors[i%colors.length]));}
  }
  petals.castShadow=true;centres.castShadow=true;group.add(petals,centres);
  if(track.id==='zen'){water.geometry=new T.CircleGeometry(52,64);water.position.set(0,-.6,0);water.material.color.setHex(0x53a7a0);
   const bamboo=new T.InstancedMesh(stem,material(0x68985d),84);
   for(let i=0;i<84;i++){const f=frame(i/84*track.length,26+(i%3)*2);dummy.position.copy(f.p).add(new T.Vector3(0,4,0));dummy.scale.set(2,8+(i%3),2);dummy.rotation.set(0,0,.05*Math.sin(i));dummy.updateMatrix();bamboo.setMatrixAt(i,dummy.matrix);}bamboo.castShadow=true;group.add(bamboo);}
  for(let i=0;i<5;i++){const f=frame((i+.5)/5*track.length,track.id==='rose'?0:-24),arch=put(new T.TorusGeometry(3.5,.42,8,24,Math.PI),colors[i%colors.length],f.p.clone(),[1,1,1]);arch.rotation.y=Math.atan2(f.t.x,f.t.z);}
 }
 const accent=({wood:0x8da9ad,river:0x19b9dd,honey:0xe5a52a,moon:0xb8d9ef,coast:0xffc347,night:0xb698dc,rose:0xbe7ee9,blossom:0xf27da8,zen:0xf5c447,cove:0x83e9ff})[track.id]||0x83e9ff;
 addSignature(scene,track,frame,group,ball,stem,material,put,accent,lowPower,water);
 const fx=buildRoadFX(scene,track,frame,lowPower,accent);
 return {...p,...fx,animate(time){water.material.roughness=.22+Math.sin(time*.45)*.025;fx.animate(time);track.animateSignature?.(time);}};
}

// Shared low-draw road accents: one instanced tyre set, boost-pad set, chevron batch,
// and a small optional point cloud per course. Gameplay checks the returned pad list.
function buildRoadFX(scene,track,frame,lowPower,accent){
 const Tm=track.length,box=new T.BoxGeometry(1,1,1),dummy=new T.Object3D(),count=lowPower?110:220;
 const tyreMat=new T.MeshBasicMaterial({color:0x382f28,transparent:true,opacity:.20,depthWrite:false}),tyres=new T.InstancedMesh(box,tyreMat,count*2);let n=0;
 for(let i=0;i<count;i++)for(const lane of [-3.1,3.1]){const s=(i+.5)/count*Tm,f=frame(s,lane);dummy.position.copy(f.p);dummy.position.y+=.035;dummy.rotation.set(0,Math.atan2(f.t.x,f.t.z),0);dummy.scale.set(.42,.018,1.12);dummy.updateMatrix();tyres.setMatrixAt(n++,dummy.matrix);}tyres.frustumCulled=false;scene.add(tyres);
 const boostPads=[.13,.39,.66,.87].map(t=>({s:t*Tm,lane:0,index:Math.round(t*100)})),padMat=new T.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:.48,roughness:.3,metalness:.18}),pads=new T.InstancedMesh(box,padMat,boostPads.length*3);n=0;
 for(const pad of boostPads){const f=frame(pad.s,pad.lane);for(const offset of [-.72,0,.72]){dummy.position.copy(f.p).addScaledVector(f.t,offset);dummy.position.y+=.10;dummy.rotation.set(0,Math.atan2(f.t.x,f.t.z),0);dummy.scale.set(6,.07,.18);dummy.updateMatrix();pads.setMatrixAt(n++,dummy.matrix);}}pads.frustumCulled=false;scene.add(pads);
 const puddles=new T.InstancedMesh(new T.SphereGeometry(1,8,5),new T.MeshStandardMaterial({color:0x9feeff,metalness:.58,roughness:.055,transparent:true,opacity:.4,depthWrite:false}),10);puddles.material.visible=false;
 for(let i=0;i<10;i++){const f=frame((i+.37)/10*Tm,(i%2?1:-1)*(2.6+(i%3)*1.55));dummy.position.copy(f.p);dummy.position.y+=.075;dummy.rotation.set(-Math.PI/2,0,Math.atan2(f.t.x,f.t.z));dummy.scale.set(1.2+(i%3)*.42,.42+(i%2)*.2,.018);dummy.updateMatrix();puddles.setMatrixAt(i,dummy.matrix);}puddles.visible=false;scene.add(puddles);
 const bends=[];for(let i=2;i<18;i++){const s=i/20*Tm,a=frame(s-.012*Tm),b=frame(s+.012*Tm),turn=a.t.z*b.t.x-a.t.x*b.t.z;if(Math.abs(turn)>.17)bends.push({s,lane:turn>0?13.2:-13.2,turn})}
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#173745';ctx.fillRect(0,0,128,64);ctx.fillStyle='#ffe47a';for(let i=-2;i<6;i++){ctx.save();ctx.translate(i*28,0);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(28,0);ctx.lineTo(64,32);ctx.lineTo(28,64);ctx.lineTo(0,64);ctx.lineTo(36,32);ctx.closePath();ctx.fill();ctx.restore();}const signTex=new T.CanvasTexture(canvas),signMat=new T.MeshBasicMaterial({map:signTex,transparent:true,side:T.DoubleSide}),signs=new T.InstancedMesh(new T.PlaneGeometry(2.8,1.1),signMat,bends.length);
 bends.forEach((bend,i)=>{const f=frame(bend.s,bend.lane);dummy.position.copy(f.p);dummy.position.y+=2;dummy.rotation.set(0,Math.atan2(f.t.x,f.t.z)+(bend.turn>0?Math.PI:0),0);dummy.updateMatrix();signs.setMatrixAt(i,dummy.matrix);});if(bends.length)scene.add(signs);
 let dust=null;if(!lowPower){const points=new Float32Array(168*3);for(let i=0;i<168;i++){const f=frame((i/168)*Tm,(i%2?1:-1)*(10.5+((i*17)%9)*.12));points.set([f.p.x,f.p.y+.2,f.p.z],i*3);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(points,3));dust=new T.Points(geo,new T.PointsMaterial({color:accent,size:.23,transparent:true,opacity:.42,depthWrite:false}));scene.add(dust);}
 return {boostPads,puddles,setWetness(value){puddles.visible=value>.15;puddles.material.visible=value>.15;puddles.material.opacity=.18+value*.34;},animate(time){padMat.emissiveIntensity=.42+Math.sin(time*5)*.08;if(dust)dust.material.opacity=.30+Math.sin(time*2.2)*.08;}};
}

function addSignature(scene,track,frame,group,ball,stem,material,put,accent,lowPower=false,water){
 const Tm=track.length,dummy=new T.Object3D();
 if(track.id==='night'){const caps=new T.InstancedMesh(ball,material(0x8fe9ff,true),36),stems=new T.InstancedMesh(stem,material(0x83cfcf),36);caps.name='night-glowing-mushrooms';for(let i=0;i<36;i++){const f=frame((i/36)*Tm,(i%2?1:-1)*(13+(i%4)*1.4));dummy.position.copy(f.p);dummy.position.y+=.34;dummy.scale.set(.86,.3,.86);dummy.updateMatrix();caps.setMatrixAt(i,dummy.matrix);dummy.position.y-=.58;dummy.scale.set(.18,.78,.18);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);}scene.add(caps,stems);const ps=[];for(let i=0;i<32;i++){const f=frame(i/32*Tm,(i%2?1:-1)*11.8);ps.push(f.p.x,f.p.y+1.9+(i%5)*.42,f.p.z);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));const fireflies=new T.Points(g,new T.PointsMaterial({color:0xffe47a,size:.42,transparent:true,opacity:.88,depthWrite:false}));fireflies.name='night-fireflies';scene.add(fireflies);track.animateSignature=time=>{fireflies.material.opacity=.62+Math.sin(time*2.7)*.2;};}
 if(track.id==='river'){
  const f=frame(.49*Tm,0),yaw=Math.atan2(f.t.x,f.t.z),waterY=Math.max(-.8,f.p.y-2.35),waterGeo=new T.PlaneGeometry(48,72),waterMesh=new T.Mesh(waterGeo,new T.MeshStandardMaterial({color:0x199ab1,emissive:0x075466,emissiveIntensity:.3,roughness:.24,metalness:.22}));
  waterMesh.name='river-sparkling-water';waterMesh.position.copy(f.p);waterMesh.position.y=waterY;waterMesh.rotation.set(-Math.PI/2,yaw,0);waterMesh.receiveShadow=false;scene.add(waterMesh);
  const deck=new T.InstancedMesh(new T.BoxGeometry(20,.24,.48),material(0x805a38),18),rails=new T.InstancedMesh(new T.BoxGeometry(.26,.72,1),material(0x67472f),36),posts=new T.InstancedMesh(new T.BoxGeometry(.32,1.15,.38),material(0x705033),8),side=new T.Vector3(f.t.z,0,-f.t.x);
  for(let i=0;i<18;i++){dummy.position.copy(f.p).addScaledVector(f.t,-4.25+i*.5);dummy.position.y+=.12;dummy.rotation.set(0,yaw,0);dummy.scale.set(1,1,1);dummy.updateMatrix();deck.setMatrixAt(i,dummy.matrix);}
  let railIndex=0;for(const x of [-10.35,10.35])for(let i=0;i<18;i++){dummy.position.copy(f.p).addScaledVector(side,x).addScaledVector(f.t,-4.25+i*.5);dummy.position.y+=.62;dummy.rotation.set(0,yaw,0);dummy.updateMatrix();rails.setMatrixAt(railIndex++,dummy.matrix);}
  for(let i=0;i<8;i++){const x=i%2?-9.5:9.5,z=Math.floor(i/2)*4-6;dummy.position.copy(f.p).addScaledVector(side,x).addScaledVector(f.t,z);dummy.position.y-=.82;dummy.rotation.set(0,yaw,0);dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);}
  deck.name='river-wooden-bridge';scene.add(deck,rails,posts);const count=lowPower?8:20,points=new Float32Array(count*3);for(let i=0;i<count;i++){const across=((i*7)%17-8)*2.25,along=((i*11)%15-7)*4.1;const q=f.p.clone().addScaledVector(side,across).addScaledVector(f.t,along);points.set([q.x,waterY+.08+((i%3)*.03),q.z],i*3);}const sparkGeo=new T.BufferGeometry();sparkGeo.setAttribute('position',new T.Float32BufferAttribute(points,3));const sparkles=new T.Points(sparkGeo,new T.PointsMaterial({color:0xa6fbff,size:lowPower?.28:.38,transparent:true,opacity:.78,depthWrite:false}));sparkles.name='river-water-sparkles';scene.add(sparkles);track.animateSignature=time=>{sparkles.material.opacity=.48+Math.sin(time*3.5)*.23;};
 }
 if(track.id==='honey'){const hex=new T.InstancedMesh(new T.CylinderGeometry(1.2,1.2,.15,6),material(0xffc95a,true),20);for(let i=0;i<20;i++){const f=frame((i/20)*Tm,i%2?16:-16);dummy.position.copy(f.p);dummy.position.y+=4.2+(i%3)*.4;dummy.rotation.set(Math.PI/2,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();hex.setMatrixAt(i,dummy.matrix);}scene.add(hex);const bees=new T.InstancedMesh(new T.SphereGeometry(.23,8,6),material(0x37291b),10);for(let i=0;i<10;i++){const f=frame((i/10)*Tm,i%2?15:-15);dummy.position.copy(f.p);dummy.position.y+=3+(i%3)*.6;dummy.scale.set(1.5,1,1);dummy.updateMatrix();bees.setMatrixAt(i,dummy.matrix);}scene.add(bees);}
 if(track.id==='coast'){const f=frame(.57*Tm,0),arch=put(new T.TorusGeometry(9,.8,7,24,Math.PI),0xc4b189,f.p.clone().add(new T.Vector3(0,1,0)),[1,1,1]);arch.rotation.y=Math.atan2(f.t.x,f.t.z)+Math.PI/2;}
 if(track.id==='moon'){water.material.metalness=.85;water.material.roughness=.08;const reflection=put(new T.PlaneGeometry(13,85),0x9fbaff,new T.Vector3(50,-.48,-155),[1,1,1],true);reflection.rotation.x=-Math.PI/2;reflection.material.transparent=true;reflection.material.opacity=.19;}
 if(track.id==='blossom'){const petal=new T.InstancedMesh(new T.SphereGeometry(1,6,4),material(0xf7b2d2),42);petal.userData.base=[];for(let i=0;i<42;i++){const f=frame(i/42*Tm,i%2?13:-13),x=f.p.x,y=f.p.y+2+(i%6)*.65,z=f.p.z;petal.userData.base.push([x,y,z]);dummy.position.set(x,y,z);dummy.scale.set(.14,.05,.22);dummy.rotation.set(i*.6,i*1.3,i*.4);dummy.updateMatrix();petal.setMatrixAt(i,dummy.matrix);}scene.add(petal);petal.userData.animate=time=>{for(let i=0;i<42;i++){const [x,y,z]=petal.userData.base[i];dummy.position.set(x+Math.sin(time+i)*.25,y+Math.sin(time*1.4+i*2)*.35,z+Math.cos(time+i)*.2);dummy.rotation.set(i*.6+time*.2,i*1.3,i*.4+time*.3);dummy.updateMatrix();petal.setMatrixAt(i,dummy.matrix);}petal.instanceMatrix.needsUpdate=true;};track.animateSignature=petal.userData.animate;}
 if(track.id==='zen'){const lanterns=new T.InstancedMesh(new T.SphereGeometry(.42,8,6),material(0xffd875,true),20);for(let i=0;i<20;i++){const f=frame(i/20*Tm,i%2?16:-16);dummy.position.copy(f.p);dummy.position.y+=5+(i%3)*.8;dummy.scale.set(.7,1.1,.7);dummy.updateMatrix();lanterns.setMatrixAt(i,dummy.matrix);}scene.add(lanterns);const lily=new T.InstancedMesh(new T.CircleGeometry(1,8),material(0x54b88b),14);for(let i=0;i<14;i++){dummy.position.set(-48+(i%4)*7,-.45,20+Math.floor(i/4)*8);dummy.rotation.x=-Math.PI/2;dummy.scale.set(1.5+(i%3)*.3,1,1);dummy.updateMatrix();lily.setMatrixAt(i,dummy.matrix);}scene.add(lily);}
 if(track.id==='cove'){const tunnel=new T.InstancedMesh(new T.TorusGeometry(10,.42,6,20,Math.PI),material(accent,true),7);for(let i=0;i<7;i++){const f=frame((.35+i*.045)*Tm);dummy.position.copy(f.p);dummy.position.y+=.1;dummy.rotation.set(0,Math.atan2(f.t.x,f.t.z)+Math.PI/2,0);dummy.scale.set(1,1,1);dummy.updateMatrix();tunnel.setMatrixAt(i,dummy.matrix);}scene.add(tunnel);}
 if(track.id==='showcase'){const f=frame(.47*Tm,0);put(new T.TorusGeometry(8,.5,6,20,Math.PI),accent,f.p.clone().add(new T.Vector3(0,1,0)),[1,1,1],true);}
}
