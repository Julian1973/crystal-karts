import {polishDriverMaterial} from './film-look.js?v=75';
import {Box3,Group,Vector3,Float32BufferAttribute} from './assets/three.module.js?v=75';
import {GLTFLoader} from './assets/loaders/GLTFLoader.js?v=75';
const templates=new Map();
export async function loadDrivers(characters,onProgress=()=>{}){
 const loader=new GLTFLoader();let completed=0;
 await Promise.all(characters.map(async c=>{
  if(!templates.has(c.id)){
   const gltf=await loader.loadAsync('assets/models/'+c.id+'.glb');
   const scene=gltf.scene;scene.updateMatrixWorld(true);
   const bounds=new Box3().setFromObject(scene),size=bounds.getSize(new Vector3());
   if(!Number.isFinite(size.y)||size.y<=0)throw Error(c.name+' model has invalid dimensions');
   scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=Array.isArray(o.material)?o.material.map(polishDriverMaterial):polishDriverMaterial(o.material);}});
   templates.set(c.id,{scene,bounds});
  }
  onProgress(++completed,characters.length);
 }));
}
export function createDriver(c,{podium=false}={}){
 const entry=templates.get(c.id);if(!entry)return null;
 const root=new Group(),model=entry.scene.clone(true),center=entry.bounds.getCenter(new Vector3());
 // Inspected Companion meshes face +Z, matching kart forward (README states -Z).
 // Game-specific bee sizes requested by Julian; source assets remain unchanged.
 const sourceHeight=entry.bounds.max.y-entry.bounds.min.y;
 const match=templates.get(c.id==='fuzzby'?'keen':c.id==='zenny'?'amie':c.id);
 const targetHeight=match.bounds.max.y-match.bounds.min.y;
 const scale=1.62*targetHeight/sourceHeight,verticalScale=Math.min(scale,2.6/sourceHeight);model.scale.set(scale,verticalScale,scale);
 model.position.set(-center.x*scale,.38-entry.bounds.min.y*verticalScale,-center.z*scale-.15);
 const height=Math.min(targetHeight*1.62,2.6),radius=height*.23;
 root.userData.wheel={radius,y:.38+height*.41,z:.83};
 // Independent morph geometry keeps the uploaded files and other drivers untouched.
 model.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone(),pos=g.attributes.position,h=entry.bounds.max.y-entry.bounds.min.y,head=[],wave=[],cheer=[];
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 // Locate the two lower-arm clusters, then blend their reach towards the rim.
 const hand=({aida:[.34,.53],luna:[.17,.24],keen:[.29,.32],howey:[.25,.30],misty:[.24,.30],amie:[.26,.32],sunny:[.24,.32],fuzzby:[.24,.34],zenny:[.25,.34]})[c.id];
 const anchors=[-1,1].map(side=>{const v=new Vector3();let n=0;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),yn=(y-entry.bounds.min.y)/h;if(x*side>h*(hand[0]-.045)&&Math.abs(yn-hand[1])<.045){v.add(new Vector3(x,y,pos.getZ(i)));n++;}}return n?v.divideScalar(n):new Vector3(side*h*hand[0],h*hand[1],0);});
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),yn=(y-entry.bounds.min.y)/h,side=x<0?-1:1;
 const w=(podium?0:1)*smooth(h*(hand[0]-.10),h*(hand[0]-.045),Math.abs(x))*smooth(hand[1]-.14,hand[1]-.05,yn)*(1-smooth(hand[1]+.05,hand[1]+.22,yn));
 const target=new Vector3(center.x+side*radius/scale,(root.userData.wheel.y-.38)/verticalScale+entry.bounds.min.y,(root.userData.wheel.z+.15)/scale+center.z);
 const delta=target.sub(anchors[side<0?0:1]).multiplyScalar(w);pos.setXYZ(i,x+delta.x,y+delta.y,z+delta.z);
 }pos.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),yn=(y-entry.bounds.min.y)/h,w=smooth(.55,.76,yn),angle=.28*w;head.push(Math.cos(angle)*x+Math.sin(angle)*z,y,-Math.sin(angle)*x+Math.cos(angle)*z);
 const nod=.18*w,py=h*.60;wave.push(x,py+(y-py)*Math.cos(nod)-z*Math.sin(nod),(y-py)*Math.sin(nod)+z*Math.cos(nod));
 const arm=smooth(h*.12,h*.22,x)*smooth(.12,.20,yn)*(1-smooth(hand[1]+.18,hand[1]+.34,yn))*(podium?0:1),sx=h*.15,sy=entry.bounds.min.y+h*.58,dx=x-sx,dy=y-sy,a=1.35*arm;cheer.push(sx+dx*Math.cos(a)-dy*Math.sin(a),sy+dx*Math.sin(a)+dy*Math.cos(a),z);
 }if(podium){for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),yn=(y-entry.bounds.min.y)/h;
 const w=smooth(h*.12,h*.25,x)*(1-smooth(.48,.66,yn))*smooth(.17,.3,yn);
 const pivotX=h*.15,pivotY=entry.bounds.min.y+h*.46,angle=1.6*w;
 wave[i*3]=pivotX+(x-pivotX)*Math.cos(angle)-(y-pivotY)*Math.sin(angle);
 wave[i*3+1]=pivotY+(x-pivotX)*Math.sin(angle)+(y-pivotY)*Math.cos(angle);wave[i*3+2]=z;}}
 g.morphAttributes.position=[new Float32BufferAttribute(head,3),new Float32BufferAttribute(wave,3),new Float32BufferAttribute(cheer,3)];o.geometry=g;o.updateMorphTargets();});
 root.add(model);root.userData.suppliedModel=c.id;return root;
}

export function animateDriver(root,time,turn=0,celebrate=false,cheer=false){root.traverse(o=>{if(o.isMesh&&o.morphTargetInfluences){o.morphTargetInfluences[0]=celebrate?Math.sin(time*2.8):Math.max(-1,Math.min(1,turn));o.morphTargetInfluences[1]=celebrate?.6+Math.sin(time*5)*.4:0;if(o.morphTargetInfluences.length>2)o.morphTargetInfluences[2]=cheer?Math.max(0,Math.sin(time*9))*.9:0;}});}
