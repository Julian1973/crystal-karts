import * as T from './assets/three.module.js?v=75';

// A continuous verge joins the existing driving surface to the woodland floor.
// All representational scenery is supplied by the textured Meshy assets.
export const WOODLAND_FLOOR=-1.2;
export function showcaseGround(roadY,lane){
 const blend=Math.min(1,Math.max(0,(Math.abs(lane)-11.4)/10.6));
 return T.MathUtils.lerp(roadY-.1,WOODLAND_FLOOR,blend);
}
export function buildShowcase({scene,track,roadMat,edgeMat,grassMat,sun,water,oak,frame}){
 const group=new T.Group();group.name='crystal-bears-showcase';scene.add(group);
 oak.visible=false;water.visible=false;
 roadMat.color.setHex(0xb4a083);edgeMat.color.setHex(0x67734d);grassMat.color.setHex(0x526744);
 sun.color.setHex(0xffdfad);sun.intensity=3.1;sun.shadow.radius=2;
 for(const side of [-1,1]){
  const positions=[],uvs=[],indices=[],steps=600;
  for(let i=0;i<=steps;i++){
   const f=frame(i/steps*track.length);
   for(const lane of [11.4,16,22]){const p=f.p.clone().addScaledVector(f.right,side*lane);positions.push(p.x,showcaseGround(f.p.y,lane),p.z);uvs.push(p.x/6,-p.z/6);}
   if(i<steps)for(let j=0;j<2;j++){const k=i*3+j;indices.push(k,k+3,k+1,k+1,k+3,k+4);}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=grassMat.clone();material.side=T.DoubleSide;
  const verge=new T.Mesh(geometry,material);verge.name='woodland-bank';verge.receiveShadow=true;group.add(verge);
 }
 return {sky:0xc0def0,light:3.1,animate(){}};
}

let surfaces;
export async function loadShowcaseSurfaces(){
 if(!surfaces)surfaces=Promise.all(['ground','trail'].map(async name=>{
  const response=await fetch('assets/scenery/'+name+'-albedo.png');if(!response.ok)throw Error('Woodland texture failed: '+name);
  const bitmap=await createImageBitmap(await response.blob(),{imageOrientation:'flipY'});
  const texture=new T.Texture(bitmap);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;texture.needsUpdate=true;return texture;
 })).catch(error=>{surfaces=null;throw error;});
 return surfaces;
}
export function applyShowcaseSurfaces(scene,ground,trail,roadMat,edgeMat,grassMat){
 const apply=(material,map)=>{material.map=map;material.color.setHex(0xffffff);material.roughness=.9;material.bumpMap=map;material.bumpScale=.055;material.needsUpdate=true;};
 apply(roadMat,trail);apply(edgeMat,ground);apply(grassMat,ground);
 scene.getObjectByName('crystal-bears-showcase').traverse(o=>{if(o.name==='woodland-bank')apply(o.material,ground);});
}

let backdrop;
export async function loadShowcaseBackdrop(){
 if(!backdrop)backdrop=(async()=>{
  const response=await fetch('assets/scenery/coastal-panorama-v2.png');if(!response.ok)throw Error('Backdrop failed to load');
  const bitmap=await createImageBitmap(await response.blob(),{imageOrientation:'flipY'});
  const texture=new T.Texture(bitmap);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;return texture;
 })().catch(error=>{backdrop=null;throw error;});
 return backdrop;
}
export function applyShowcaseBackdrop(scene,texture){
 const sky=scene.getObjectByName('race-sky');if(!sky)throw Error('Sky not ready');
 // Repeat a distant panorama twice rather than magnifying one small image around 360°.
 // Mirrored wrap keeps the horizon joined at both seams; the upper sky fades to blue.
 const reflection=texture.clone();reflection.mapping=T.EquirectangularReflectionMapping;reflection.needsUpdate=true;
 scene.environment?.dispose();scene.environment=reflection;scene.environmentIntensity=.65;
 texture.wrapS=T.MirroredRepeatWrapping;texture.repeat.set(2,1.3);texture.offset.y=-.10;
 texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
 sky.material.dispose();sky.material=new T.MeshBasicMaterial({map:texture,side:T.BackSide,depthWrite:false,fog:false,toneMapped:false});
 sky.material.onBeforeCompile=shader=>{
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.18,.44,.78),smoothstep(.83,1.0,vMapUv.y));');
 };sky.material.customProgramCacheKey=()=> 'coastal-horizon-v2';
}
