import * as T from './assets/three.module.js?v=75';

// Preserve the supplied colour/normal maps; add a soft fabric-like grazing highlight.
export function polishDriverMaterial(source){
 const m=new T.MeshStandardMaterial().copy(source);
 m.metalness=0;m.roughness=.86;m.envMapIntensity=.38;
 if(m.map)m.map.anisotropy=4;
 if(m.normalMap){m.normalMap.anisotropy=4;m.normalScale.multiplyScalar(.65);}
 return m;
}

// A reusable bevelled unit box keeps the kart's existing dimensions and hitbox.
export function roundedBox(){
 const g=new T.BoxGeometry(1,1,1,6,6,6),p=g.attributes.position,n=g.attributes.normal,v=new T.Vector3(),core=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);core.copy(v).clampScalar(-.40,.40);v.sub(core).normalize();n.setXYZ(i,v.x,v.y,v.z);v.multiplyScalar(.10).add(core);p.setXYZ(i,v.x,v.y,v.z);}
 return g;
}

export function createFilmLook({scene,renderer,camera,sun,track,leafMats,trunkMat,grassMat,treePositions,frame,length,water}){
 const night=track.night||track.id==='moon';
 renderer.toneMappingExposure=night?1.12:track.id==='showcase'?1.08:1.02;
 // Concentrate the shadow texture around the racer instead of covering the whole map.
 Object.assign(sun.shadow.camera,{left:-62,right:62,top:62,bottom:-62});
 sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00015;sun.shadow.normalBias=.045;
 const hemi=scene.children.find(o=>o.isHemisphereLight);hemi.intensity=night?.85:1.15;hemi.color.set(night?0x9dbce8:0xd2e5ef);hemi.groundColor.set(0x475637);
 const rim=new T.DirectionalLight(night?0x94baff:0xc0e2ff,night?.6:.8);scene.add(rim);scene.add(rim.target);
 // A small equirectangular studio sky supplies broad reflections to paint and water.
 const pixels=new Uint8Array(256*128*4),top=new T.Color(night?0x0b1632:0x82b7da),horizon=new T.Color(night?0x34496a:0xffe8c2),ground=new T.Color(0x354438),c=new T.Color();
 for(let y=0;y<128;y++)for(let x=0;x<256;x++){
  const t=y/127;c.copy(t<.5?top:horizon).lerp(t<.5?horizon:ground,t<.5?t*2:(t-.5)*2);
  const glow=Math.exp(-((x/256-.32)**2/.005+(t-.38)**2/.009))*(night?.12:.65);
  const i=(y*256+x)*4;pixels.set([Math.min(255,(c.r+glow)*255),Math.min(255,(c.g+glow*.85)*255),Math.min(255,(c.b+glow*.6)*255),255],i);
 }
 const environment=new T.DataTexture(pixels,256,128);environment.mapping=T.EquirectangularReflectionMapping;environment.needsUpdate=true;scene.environment=environment;scene.environmentIntensity=.55;
 const uniforms={top:{value:top},horizon:{value:horizon},rain:{value:0},nightMode:{value:night?1:0},time:{value:0}};
 water.material.metalness=.18;water.material.envMapIntensity=1.1;
 water.material.onBeforeCompile=shader=>{
  shader.uniforms.waterTime=uniforms.time;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vWater;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWater=position.xy;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float waterTime;varying vec2 vWater;').replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(sin(vWater.x*.9+waterTime)*.10,cos(vWater.y*.7+waterTime*.8)*.10,0.0));');
 };water.material.customProgramCacheKey=()=> 'water-ripples';water.material.needsUpdate=true;
 const sky=new T.Mesh(new T.SphereGeometry(900,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms,
 vertexShader:'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:`uniform vec3 top;uniform vec3 horizon;uniform float rain;uniform float nightMode;varying vec3 vDirection;
 void main(){vec3 d=normalize(vDirection);float h=pow(max(d.y,0.0),.55);vec3 colour=mix(horizon,top,h);float sunGlow=pow(max(dot(d,normalize(vec3(-.5,.7,.35))),0.0),96.0);colour+=vec3(1.0,.75,.4)*sunGlow*.35*(1.0-nightMode);colour=mix(colour,vec3(.22,.29,.36),rain*.8);gl_FragColor=vec4(colour,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));sky.name='race-sky';sky.renderOrder=-100;sky.frustumCulled=false;scene.add(sky);
 // World-space surface variation avoids stretching over the large terrain disc.
 function organic(material,kind){
  material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOrganic;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOrganic=position;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vOrganic;');
   const detail=kind==='bark'?'sin(vOrganic.y*2.0+sin(vOrganic.x*24.0)*3.0)*sin(vOrganic.x*38.0+vOrganic.z*29.0)':kind==='grass'?'sin(vOrganic.x*.31)*sin(vOrganic.y*.27)+.3*sin(vOrganic.x*4.1+vOrganic.y*2.7)':'sin(vOrganic.x*14.0+vOrganic.y*9.0)*sin(vOrganic.z*17.0-vOrganic.y*13.0)';
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat organicGrain=${detail};diffuseColor.rgb*=.94+organicGrain*.09;`);
  };material.customProgramCacheKey=()=>`organic-${kind}`;material.needsUpdate=true;
 }
 organic(trunkMat,'bark');organic(grassMat,'grass');leafMats.forEach(m=>{organic(m,'leaf');m.roughness=.95;});
 // Small leaf clusters break up the large canopy silhouettes without extra draw calls.
 const leafGeo=new T.SphereGeometry(1,5,3),leaves=new T.InstancedMesh(leafGeo,leafMats[2],treePositions.length*36),dummy=new T.Object3D();
 treePositions.forEach((t,i)=>{for(let j=0;j<36;j++){const a=j*2.39996,r=t.r*(.6+(j%5)*.13);dummy.position.set(t.x+Math.sin(a)*r,t.h+Math.sin(j*1.71)*t.r*.6,t.z+Math.cos(a)*r);dummy.scale.set(t.r*.20,t.r*.10,t.r*.28);dummy.rotation.set(Math.sin(j),a,.4);dummy.updateMatrix();leaves.setMatrixAt(i*36+j,dummy.matrix);}});leaves.receiveShadow=true;scene.add(leaves);
 const verge=new T.InstancedMesh(leafGeo,leafMats[1],1200);
 for(let i=0;i<1200;i++){const f=frame(i/1200*length,(i%2?1:-1)*(13+Math.sin(i*17.3)**2*6));dummy.position.copy(f.p);dummy.position.y+=.35;dummy.rotation.set(.3, i*2.4, Math.sin(i)*.6);dummy.scale.set(.13,.45+(i%7)*.08,.32);dummy.updateMatrix();verge.setMatrixAt(i,dummy.matrix);}verge.receiveShadow=true;if(track.id!=='showcase')scene.add(verge);
 // Rounded cloud banks, positioned beyond the race rather than across the camera.
 const clouds=new T.InstancedMesh(new T.SphereGeometry(1,16,10),new T.MeshStandardMaterial({color:night?0x687b9d:0xfff5e8,roughness:1}),54);
 for(let i=0;i<54;i++){const cluster=Math.floor(i/6),a=cluster/9*Math.PI*2,j=i%6;dummy.position.set(Math.sin(a)*470+(j-3)*18,95+Math.sin(cluster*2)*15+Math.sin(j)*6,Math.cos(a)*470);dummy.scale.set(25,9+(j%3)*4,17);dummy.rotation.set(0,a,0);dummy.updateMatrix();clouds.setMatrixAt(i,dummy.matrix);}scene.add(clouds);
 // Soft ground contact remains visible below the kart when directional shadows soften.
 const contactPixels=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5),i=(y*64+x)*4;contactPixels.set([12,18,22,Math.round(Math.max(0,1-r)**2*130)],i);}
 const contactTexture=new T.DataTexture(contactPixels,64,64);contactTexture.needsUpdate=true;
 const contacts=Array.from({length:9},()=>{const m=new T.Mesh(new T.PlaneGeometry(4.6,5.6),new T.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));m.rotation.x=-Math.PI/2;scene.add(m);return m;});
 const stars=new T.Group();sky.add(stars);
 if(night){const positions=[];for(let i=0;i<650;i++){const a=i*2.39996,y=.12+((i*37)%650)/650*.87,r=Math.sqrt(1-y*y);positions.push(Math.sin(a)*r*820,y*820,Math.cos(a)*r*820);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const points=new T.Points(g,new T.PointsMaterial({color:0xd7eaff,size:1.6,sizeAttenuation:true,transparent:true,opacity:.85,depthWrite:false}));stars.add(points);}
 const right=new T.Vector3(),forward=new T.Vector3(),normal=new T.Vector3(),basis=new T.Matrix4(),rimOffset=new T.Vector3(40,24,-35),frameTargets=Array.from({length:9},()=>({p:new T.Vector3(),t:new T.Vector3(),right:new T.Vector3()}));
 return {update(time,weather,racers){
  sky.position.copy(camera.position);if(sky.material.isMeshBasicMaterial)sky.material.color.setScalar(1-weather.rain*.45);uniforms.rain.value=weather.rain;uniforms.time.value=time;clouds.visible=!sky.userData.courseBackdrop&&track.id!=='showcase'&&!night&&weather.rain<.8;stars.visible=!sky.userData.courseBackdrop&&weather.rain<.35;
  rim.position.copy(camera.position).add(rimOffset);rim.target.position.copy(camera.position);
  racers.forEach((r,i)=>{const m=contacts[i];if(!m)return;const f=frame(r.s,r.lane,r.route||0,frameTargets[i]);m.position.copy(f.p);m.position.y+=.065;normal.crossVectors(f.t,f.right).normalize();forward.set(Math.sin(r.heading),0,Math.cos(r.heading)).projectOnPlane(normal).normalize();right.crossVectors(forward,normal).normalize();basis.makeBasis(right,forward,normal);m.quaternion.setFromRotationMatrix(basis);m.material.opacity=Math.max(0,1-(r.airHeight||0)/5);m.visible=r.kart.group.visible;});
 }};
}
