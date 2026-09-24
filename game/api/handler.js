// Vercel Function: runs the existing Crystal Karts worker (rooms, challenges, leaderboards)
// against a Turso (libSQL) database. vercel.json rewrites /api/<path> here as ?__path=<path>.
import worker from '../worker/index.js';
import {d1FromLibsql,ensureSchema} from '../worker/libsql-d1.js';

async function defaultClient(){
 const url=process.env.TURSO_DATABASE_URL;if(!url)return null;
 const {createClient}=await import('@libsql/client/web');
 return createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
}
export function createHandler({makeClient=defaultClient}={}){
 // Connect once per warm instance and make sure the tables exist. A failed attempt is retried next request.
 let database=null;
 const getDB=()=>database??=(async()=>{const client=await makeClient();if(!client){database=null;return null;}await ensureSchema(client);return d1FromLibsql(client);})().catch(e=>{database=null;console.error('Database unavailable',e.message);return null;});
 return async function handle(request){
  const url=new URL(request.url),path=url.searchParams.get('__path');
  if(path!==null){url.pathname='/api/'+path;url.searchParams.delete('__path');}
  const body=request.method==='GET'||request.method==='HEAD'?undefined:await request.text();
  const headers=new Headers(request.headers);
  const forwarded=new Request(url,{method:request.method,headers,body});
  // Cloudflare supplied request.cf.country; Vercel sends the visitor's country as a header.
  Object.defineProperty(forwarded,'cf',{value:{country:request.headers.get('x-vercel-ip-country')||undefined}});
  return worker.fetch(forwarded,{DB:await getDB()});
 };
}
const handle=createHandler();
export const GET=handle,POST=handle;
