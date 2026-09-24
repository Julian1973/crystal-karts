import * as T from './assets/three.module.js?v=75';
const COURSES=new Set(['wood','river','night','honey','moon','coast','rose','blossom','zen','cove','showcase']);
const pending=new Map();
export async function loadCourseBackdrop(id,maxSize=4096){
 if(!COURSES.has(id))throw Error('Unknown course backdrop');
 const key=id+':'+maxSize;
 if(!pending.has(key))pending.set(key,(async()=>{
  const response=await fetch('assets/scenery/backdrops/'+id+'.webp');
  if(!response.ok)throw Error('Course backdrop unavailable');
  const blob=await response.blob();let bitmap=await createImageBitmap(blob,{imageOrientation:'flipY'});
  if(bitmap.width>maxSize){const width=maxSize,height=Math.round(bitmap.height*width/bitmap.width);bitmap.close();bitmap=await createImageBitmap(blob,{imageOrientation:'flipY',resizeWidth:width,resizeHeight:height,resizeQuality:'high'});}
  const texture=new T.Texture(bitmap);texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=T.RepeatWrapping;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
 })().catch(error=>{pending.delete(key);throw error;}));
 return pending.get(key);
}
export function applyCourseBackdrop(scene,texture,id){
 const sky=scene.getObjectByName('race-sky');if(!sky)throw Error('Sky not ready');
 const skyColors={wood:0xc8d2cd,night:0x211b50,rose:0xa49dc2,blossom:0x92bcf2,cove:0xd9b9a4,coast:0x7e9cc5,moon:0x243863,honey:0xb2ccde,river:0x78c0fc,zen:0xfbd78f,showcase:0xa7c7da};
 const zenith=new T.Color(skyColors[id]||0x80b9df);
 sky.material.dispose();
 const material=new T.MeshBasicMaterial({map:texture,side:T.BackSide,depthWrite:false,fog:false,toneMapped:false});
 material.onBeforeCompile=shader=>{
  shader.uniforms.backdropZenith={value:zenith};
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 backdropZenith;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   vec2 panoramaUv=vec2(vMapUv.x,clamp(.5+(vMapUv.y-.5)*1.2,0.001,.999));
   vec4 panorama=texture2D(map,panoramaUv);
   float seam=min(panoramaUv.x,1.0-panoramaUv.x);
   vec4 opposite=texture2D(map,vec2(1.0-panoramaUv.x,panoramaUv.y));
   panorama=mix(panorama,opposite,.5*(1.0-smoothstep(0.0,.025,seam)));
   diffuseColor*=panorama;
   diffuseColor.rgb=mix(diffuseColor.rgb,backdropZenith*diffuse,smoothstep(.72,.98,panoramaUv.y));
  `);
 };
 material.customProgramCacheKey=()=> 'course-panorama-v1';sky.material=material;sky.userData.courseBackdrop=id;
}
