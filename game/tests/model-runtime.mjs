// Browser image decoding is stubbed here; embedded images are verified separately.
import {readFile} from 'node:fs/promises';
const base=new URL('../public/',import.meta.url),nativeFetch=globalThis.fetch,NativeRequest=globalThis.Request;
globalThis.self=globalThis;globalThis.ProgressEvent=class{constructor(type,values){Object.assign(this,{type},values)}};
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
globalThis.Request=class extends NativeRequest{constructor(url,options){super(typeof url==='string'?new URL(url,'https://race.test/'):url,options)}};
globalThis.fetch=async(input,options)=>{const url=typeof input==='string'?input:input.url;if(url.startsWith('blob:'))return nativeFetch(input,options);const path=new URL(url,'https://race.test/').pathname.slice(1);return new Response(await readFile(new URL(path,base)),{headers:{'Content-Type':'model/gltf-binary'}})};
