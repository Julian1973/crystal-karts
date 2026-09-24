// Presents a libSQL (Turso) client with the small D1 interface the worker uses:
// db.prepare(sql).bind(...args).first() / .all() / .run(), and db.batch([...]).
import {readdir,readFile} from 'node:fs/promises';
const rowObject=(result,i)=>Object.fromEntries(result.columns.map((c,j)=>[c,result.rows[i][j]]));
export function d1FromLibsql(client){
 const bound=(sql,args)=>({
  statement:{sql,args},
  async first(){const r=await client.execute({sql,args});return r.rows.length?rowObject(r,0):null;},
  async all(){const r=await client.execute({sql,args});return {results:r.rows.map((_,i)=>rowObject(r,i))};},
  async run(){const r=await client.execute({sql,args});return {meta:{changes:r.rowsAffected}};}
 });
 return {
  prepare(sql){return {bind(...args){return bound(sql,args)}}},
  // D1 runs a batch as one transaction; libSQL's write batch does the same.
  async batch(items){const results=await client.batch(items.map(i=>i.statement),'write');return results.map(r=>({meta:{changes:r.rowsAffected}}));}
 };
}
// Applies drizzle/*.sql migrations once each, recorded in _crystal_migrations. Safe to run on every cold start.
export async function ensureSchema(client,dir=new URL('../drizzle/',import.meta.url)){
 await client.execute('CREATE TABLE IF NOT EXISTS _crystal_migrations (name TEXT PRIMARY KEY, applied INTEGER NOT NULL)');
 const done=new Set((await client.execute('SELECT name FROM _crystal_migrations')).rows.map(r=>r[0]));
 const files=(await readdir(dir)).filter(f=>f.endsWith('.sql')).sort();
 const applied=[];
 for(const name of files){if(done.has(name))continue;
  const statements=(await readFile(new URL(name,dir),'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean);
  await client.batch([...statements.map(sql=>({sql,args:[]})),{sql:'INSERT INTO _crystal_migrations(name,applied) VALUES(?,?)',args:[name,Date.now()]}],'write');
  applied.push(name);}
 return applied;
}
