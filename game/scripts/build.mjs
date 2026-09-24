import {mkdir,cp,rm,readFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await cp('public','dist/client',{recursive:true});await cp('worker','dist/server',{recursive:true});await cp('.openai/hosting.json','dist/.openai/hosting.json');await cp('drizzle','dist/.openai/drizzle',{recursive:true});
const s=await import('../worker/index.js');if(typeof s.default.fetch!=='function')throw Error('Worker fetch missing');
console.log('Built race client, room service and migrations.');
