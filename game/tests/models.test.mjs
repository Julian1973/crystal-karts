import './model-runtime.mjs';
import assert from 'node:assert/strict';
import {Box3,Vector3} from '../public/assets/three.module.js';
import {loadDrivers,createDriver} from '../public/models.js';
const characters=['aida','amie','fuzzby','howey','keen','luna','misty','sunny','zenny'].map(id=>({id,name:id,bee:['fuzzby','zenny'].includes(id)}));
await loadDrivers(characters);const heights={};
for(const c of characters){const model=createDriver(c);assert.equal(model.userData.suppliedModel,c.id);let meshes=0;model.traverse(o=>{if(o.isMesh){meshes++;assert(o.geometry.attributes.position.count>1000);assert(o.material.map,'texture is loaded');}});assert(meshes>0);const box=new Box3().setFromObject(model);heights[c.id]=box.getSize(new Vector3()).y;assert(box.min.y>=.37&&box.max.y<3,'driver fits kart');assert.notEqual(model,createDriver(c),'each kart gets its own scene instance');}
assert(heights.howey>heights.keen&&heights.keen>heights.amie&&heights.fuzzby>heights.zenny,'supplied relative sizes preserved');
console.log('Passed: all nine GLBs parse with textures, cloned drivers fit karts and preserve relative height.');

const {animateDriver}=await import('../public/models.js');const animated=createDriver({id:'keen'});animateDriver(animated,1,1,true);let changed=false;animated.traverse(o=>{if(o.isMesh){assert(o.geometry.morphAttributes.position.length===3);changed ||= o.morphTargetInfluences.some(v=>v!==0);}});assert(changed,'driver greeting moves actual mesh');

assert(Math.abs(heights.fuzzby-heights.keen)<.01,'Fuzzby matches Keen height');assert(Math.abs(heights.zenny-heights.amie)<.01,'Zenny matches Amie height');
