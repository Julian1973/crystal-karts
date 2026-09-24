import * as T from './assets/three.module.js?v=75';
import {showcaseGround,WOODLAND_FLOOR} from './showcase.js?v=75';
import {GLTFLoader} from './assets/loaders/GLTFLoader.js?v=75';

const names=['oak','canopy','bee-cottage','flowers','rose-crystals','boulder'];
const templates=new Map();
export async function loadMeshyScenery(){
 const loader=new GLTFLoader();
 await Promise.all(names.map(async name=>{
  if(templates.has(name))return;
  const {scene}=await loader.loadAsync('assets/scenery/'+name+'.glb');scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(scene),size=bounds.getSize(new T.Vector3()),centre=bounds.getCenter(new T.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)throw Error('Invalid scenery: '+name);
  const parts=[];
  scene.traverse(mesh=>{if(!mesh.isMesh)return;
   const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);geometry.translate(-centre.x,-bounds.min.y,-centre.z);geometry.scale(1/size.y,1/size.y,1/size.y);
   const tune=source=>{const m=source.clone();m.metalness=name==='rose-crystals'?.25:0;m.roughness=name==='rose-crystals'?.22:Math.max(.65,m.roughness);if(name==='rose-crystals'){m.emissive.setHex(0xb753c5);m.emissiveIntensity=.16;m.envMapIntensity=1.2;}if(m.map)m.map.anisotropy=4;return m;};
   parts.push({geometry,material:Array.isArray(mesh.material)?mesh.material.map(tune):tune(mesh.material)});
  });
  templates.set(name,{parts,width:size.x/size.y,depth:size.z/size.y});
 }));
}

export function placeMeshyScenery(scene,track){
 const group=new T.Group();group.name='meshy-showcase-assets';const placements=new Map(names.map(n=>[n,[]]));
 const add=(name,u,lane,height,yaw=0)=>{const f=track.frame(u*track.length,lane);f.p.y=showcaseGround(f.p.y,lane);placements.get(name).push({p:f.p,height,yaw});};
 add('oak',.12,38,43);
 for(let i=0;i<48;i++){const u=(i+.5)/48;for(const side of [-1,1]){if(side===1&&((u>.07&&u<.18)||(u>.55&&u<.83)))continue;add('canopy',u,side*(32+(i%3)*4),16+(i%3)*2,i*2.4);}}
 for(let i=0;i<3;i++){const u=.36+i*.045,side=i%2?-1:1,f=track.frame(u*track.length);add('bee-cottage',u,side*25,15,Math.atan2(-side*f.right.x,-side*f.right.z));}
 for(let i=0;i<90;i++){
  const u=(i+.5)/90,side=i%2?1:-1;
  add('flowers',u,side*(22+(i%3)),1.7+(i%3)*.3,i*2.4);
  if(i%3===0)add('rose-crystals',u,side*25,3.0+(i%4)*.55,i);
  if(i%4===0)add('boulder',u,side*23,1.6+(i%3)*.3,i*1.7);
 }
 const dummy=new T.Object3D();
 for(const [name,instances] of placements){const template=templates.get(name);if(!template)throw Error('Scenery not loaded: '+name);
  for(const part of template.parts){const batch=new T.InstancedMesh(part.geometry,part.material,instances.length);batch.name='meshy-'+name;batch.castShadow=true;batch.receiveShadow=true;
   instances.forEach(({p,height,yaw},i)=>{dummy.position.copy(p);dummy.scale.setScalar(height);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});
   batch.computeBoundingSphere();group.add(batch);
  }
 }
 scene.add(group);return group;
}

// Textured near/middle-distance layers retain each course's existing landmarks.
export function placeCourseScenery(scene,track){
 const themes={
 wood:[0x8edcf5,48,3],river:[0x77e7ff,30,0],night:[0xb6a0ff,40,1],
 honey:[0xffd771,24,7],moon:[0xcbd9ff,20,0],coast:[0x83eef4,16,0],
 rose:[0xff9ecb,30,1],blossom:[0xf4b2df,26,1],zen:[0xc1efc7,18,1],cove:[0xc9b4ff,26,3]
 };
 const [crystalColour,trees,cottages]=themes[track.id]||themes.wood;
 const group=new T.Group();group.name='meshy-course-depth';
 const roadSamples=Array.from({length:300},(_,i)=>track.frame(i/300*track.length).p);
 for(const route of [...track.shortcuts,track.rushRoute].filter(Boolean))for(let i=0;i<=100;i++)roadSamples.push(route.path.getPointAt(i/100));
 const placements=new Map(names.map(n=>[n,[]]));
 const add=(name,u,lane,height,yaw=0)=>{
  const f=track.frame(u*track.length,lane);
  const template=templates.get(name);const radius=template?Math.hypot(template.width,template.depth)*height/2:0;
  const clearance=11.4+radius+1.5;
  if(roadSamples.some(p=>Math.hypot(p.x-f.p.x,p.z-f.p.z)<clearance))return;
  f.p.y=WOODLAND_FLOOR;
  placements.get(name).push({p:f.p,height,yaw});
 };
 for(let i=0;i<trees;i++)add('canopy',(i+.4)/trees,(i%2?1:-1)*(34+i%3*7),13+i%4*3,i*2.4);
 if(track.id==='wood')add('oak',.12,48,40);
 for(let i=0;i<cottages;i++)add('bee-cottage',.2+i*.6/Math.max(1,cottages),i%2?27:-27,8,Math.PI*i);
 for(let i=0;i<48;i++){
  const side=i%2?1:-1,u=(i+.5)/48;
  add('flowers',u,side*(18+i%3),1.5+i%3*.35,i*2.4);
  if(i%4===0)add('rose-crystals',u,side*23,2.5+i%3*.5,i);
  if(i%3===0)add('boulder',u,side*26,1.8+i%3*.4,i);
 }
 const dummy=new T.Object3D();
 for(const [name,instances] of placements){
  if(!instances.length)continue;
  const template=templates.get(name);if(!template)throw Error('Scenery not loaded: '+name);
  for(const part of template.parts){
   const tune=source=>{const m=source.clone();if(name==='rose-crystals'){m.color.setHex(crystalColour);m.emissive.setHex(crystalColour);m.emissiveIntensity=track.night||track.id==='moon'?.35:.12;}return m;};
   const material=Array.isArray(part.material)?part.material.map(tune):tune(part.material);
   const batch=new T.InstancedMesh(part.geometry,material,instances.length);batch.name='course-'+name;batch.castShadow=true;batch.receiveShadow=true;
   instances.forEach(({p,height,yaw},i)=>{dummy.position.copy(p);dummy.scale.setScalar(height);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});
   batch.computeBoundingSphere();group.add(batch);
  }
 }
 scene.add(group);return group;
}
