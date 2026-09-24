// Local development server: runs the real worker (rooms, challenges, leaderboards) against an
// in-memory SQLite database and serves public/ as the static assets. Usage: npm run dev [-- --port 8787]
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {extname,join,normalize} from 'node:path';
import worker from '../worker/index.js';
const root=new URL('..',import.meta.url).pathname,pub=join(root,'public');
const portArg=process.argv.indexOf('--port'),port=Number(portArg>0?process.argv[portArg+1]:process.env.PORT||8787);
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
for(const f of readdirSync(join(root,'drizzle')).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(join(root,'drizzle',f),'utf8'));
const DB={prepare(query){return {bind(...args){return {async first(){return sql.prepare(query).get(...args)??null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return {meta:sql.prepare(query).run(...args)}}}}}},async batch(items){return Promise.all(items.map(i=>i.run()))}};
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.wav':'audio/wav','.mp4':'video/mp4','.svg':'image/svg+xml','.txt':'text/plain'};
const ASSETS={async fetch(request){const url=new URL(request.url);let path=normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/,'');if(path.includes('..'))return new Response('Not found',{status:404});let file=join(pub,path);if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');if(!existsSync(file))return new Response('Not found',{status:404});return new Response(readFileSync(file),{headers:{'Content-Type':TYPES[extname(file)]||'application/octet-stream'}});}};
http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const body=chunks.length?Buffer.concat(chunks):undefined;const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,body:req.method==='GET'||req.method==='HEAD'?undefined:body});
 const response=await worker.fetch(request,{DB,ASSETS},{waitUntil(){}});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.writeHead(500);res.end(String(e?.message||e));}})
 .listen(port,()=>console.log('Crystal Karts dev server on http://localhost:'+port+' (phones on your Wi-Fi: http://<this-computer-ip>:'+port+')'));
