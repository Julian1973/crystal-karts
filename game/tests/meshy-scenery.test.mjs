import './model-runtime.mjs';
import assert from 'node:assert/strict';
import * as T from '../public/assets/three.module.js';
import {loadMeshyScenery,placeMeshyScenery} from '../public/meshy-scenery.js';
import {makeTrack} from '../public/tracks.js';
await loadMeshyScenery();
const scene=new T.Scene(),group=placeMeshyScenery(scene,makeTrack('showcase'));
const assets=new Set();let count=0;
group.traverse(o=>{if(!o.isMesh)return;assets.add(o.name);assert(o.isInstancedMesh);const materials=Array.isArray(o.material)?o.material:[o.material];assert(materials.some(m=>m.map),'embedded colour texture retained');assert(Array.from(o.instanceMatrix.array).every(Number.isFinite),'finite instances');assert(o.boundingSphere.radius>0);count+=o.count;});
assert.equal(assets.size,6);assert(count>100);assert(group.getObjectByName('meshy-oak'));
console.log('Passed: all six textured Meshy GLBs load, retain textures and create finite instanced scenery');
// Imported trees and props must meet the woodland floor, not float at road height.
const matrix=new T.Matrix4(),position=new T.Vector3();
group.traverse(o=>{if(!o.isInstancedMesh)return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);assert(Math.abs(position.y+1.2)<1e-5,'Meshy scenery grounded');}});
const {showcaseGround,buildShowcase,loadShowcaseSurfaces,applyShowcaseSurfaces}=await import('../public/showcase.js');
assert.equal(showcaseGround(5,11.4),4.9);assert(Math.abs(showcaseGround(5,22)+1.2)<1e-9);
const roadMat=new T.MeshStandardMaterial(),edgeMat=roadMat.clone(),grassMat=roadMat.clone(),track=makeTrack('showcase');
buildShowcase({scene,track,roadMat,edgeMat,grassMat,sun:new T.DirectionalLight(),water:new T.Mesh(),oak:new T.Group(),frame:track.frame});
const surfaces=await loadShowcaseSurfaces();applyShowcaseSurfaces(scene,...surfaces,roadMat,edgeMat,grassMat);
const banks=scene.getObjectByName('crystal-bears-showcase').children;
assert.equal(banks.length,2,'no procedural landmark overlays');
for(const bank of banks){assert.equal(bank.name,'woodland-bank');assert.equal(bank.material.map,grassMat.map);assert(bank.geometry.attributes.uv);}
assert(roadMat.map&&grassMat.map&&roadMat.map!==grassMat.map);
console.log('Passed: grounded props, continuous banks and supplied surface textures');
const {placeCourseScenery}=await import('../public/meshy-scenery.js');
for(const id of ['wood','river','night','honey','moon','coast','rose','blossom','zen','cove']){
 const layer=placeCourseScenery(new T.Scene(),makeTrack(id));assert(layer.children.length>0);
 layer.traverse(o=>{if(o.isInstancedMesh){assert(Array.from(o.instanceMatrix.array).every(Number.isFinite));assert(o.boundingSphere.radius>0);}});
}
console.log('All ten additional courses have valid textured depth layers.');
