import * as THREE from './assets/three.module.js?v=75';
import {createDriver,animateDriver} from './models.js?v=75';
// One live 3D winner, using the supplied character meshes and approved voice.
export function createWinnerStage(){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x123849);
 const camera=new THREE.PerspectiveCamera(40,1,.1,50);
 camera.position.set(0,2.3,7.4);camera.lookAt(0,1.9,0);
 scene.add(new THREE.HemisphereLight(0xe3ffff,0x416e66,3));
 const light=new THREE.DirectionalLight(0xffdf9f,4);light.position.set(-3,5,4);scene.add(light);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.48,.55,48),new THREE.MeshStandardMaterial({color:0xf1e2b9,roughness:.4,metalness:.25}));base.position.y=.275;scene.add(base);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.36,.045,8,48),new THREE.MeshStandardMaterial({color:0xffd56f,metalness:.65,roughness:.2}));rim.rotation.x=Math.PI/2;rim.position.y=.53;scene.add(rim);
 const jewel=new THREE.Mesh(new THREE.OctahedronGeometry(.16),new THREE.MeshStandardMaterial({color:0x56e7ff,emissive:0x198ea8,emissiveIntensity:.6}));jewel.position.set(0,.3,1.4);scene.add(jewel);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(15,48),new THREE.MeshStandardMaterial({color:0x24505c,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
 const vertices=[];for(let i=0;i<70;i++)vertices.push(Math.sin(i*2.4)*3,1+(i%13)*.3,Math.cos(i*3.1)*2-1);
 const sparkles=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)),new THREE.PointsMaterial({color:0xffd778,size:.055,transparent:true,opacity:.7}));scene.add(sparkles);
 let actor=null,start=0,pose='wave';
 return {
  show(character,time,choice='wave'){pose=choice;
   if(actor){scene.remove(actor);actor.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}
   actor=createDriver(character,{podium:true});if(!actor)return;
   const bounds=new THREE.Box3().setFromObject(actor),size=bounds.getSize(new THREE.Vector3());
   actor.scale.setScalar(2.7/size.y);actor.position.y=.55-bounds.min.y*actor.scale.y;actor.userData.baseY=actor.position.y;
   scene.add(actor);start=time;
  },
  render(renderer,time,width,height,y=0){
   const age=Math.max(0,time-start);
   if(actor){animateDriver(actor,time,0,true);actor.rotation.z=pose==='dance'?Math.sin(age*5)*.13:0;actor.rotation.y=pose==='dance'?Math.sin(age*3)*.4:pose==='turn'&&age<2?age*Math.PI:Math.sin(age*2)*.08;
    actor.position.y=actor.userData.baseY+((pose==='hop'||pose==='dance')?Math.abs(Math.sin(age*3))*.16:age<1?Math.sin(age*Math.PI)*.1:0);}
   sparkles.rotation.y=time*.08;camera.aspect=width/height;camera.updateProjectionMatrix();
   renderer.setViewport(0,y,width,height);renderer.setScissor(0,y,width,height);renderer.setScissorTest(true);renderer.render(scene,camera);renderer.setScissorTest(false);
  }
 };
}
