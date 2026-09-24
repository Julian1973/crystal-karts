// Character voice reactions: approved recordings only, never a generic fallback.
// Each bear may have several takes per kind so repeated events do not repeat the same line.
export const REACTION_KINDS=Object.freeze(['ouch','whoops','laugh','cheer']);
export const REACTION_MANIFEST_URL='assets/voices/reactions/manifest.json';
export const GLOBAL_GAP=6,PER_BEAR_GAP=12,REPLY_WINDOW=1.2;
const asList=v=>Array.isArray(v)?v.filter(x=>typeof x==='string'&&x):typeof v==='string'&&v?[v]:[];
// manifest shape: {kind:{bearId:url|[urls]}} or {bearId:{kind:url|[urls]}}; both are accepted.
export function reactionManifest(source={},base={urls:{},takes:{}}){
 const urls={...base.urls},takes=Object.fromEntries(Object.entries(base.takes).map(([k,v])=>[k,[...v]]));
 const add=(id,kind,list)=>{if(!REACTION_KINDS.includes(kind)||!/^[a-z]+$/.test(id))return;const key=kind+':'+id;takes[key]??=[];for(const url of list){if(Object.values(urls).includes(url))continue;const name=key+':'+takes[key].length;urls[name]=url;takes[key].push(name);}};
 for(const [a,value] of Object.entries(source||{})){if(!value||typeof value!=='object'||Array.isArray(value))continue;for(const [b,clips] of Object.entries(value)){if(REACTION_KINDS.includes(a))add(b,a,asList(clips));else add(a,b,asList(clips));}}
 return {urls,takes};
}
export function reactionAllowed(log,id,now,{reply=false,busy=false}={}){
 const last=log[log.length-1];
 if(reply)return !!last&&last.id!==id&&!last.reply&&now-last.at<=REPLY_WINDOW;
 if(busy)return false;
 if(last&&now-last.at<GLOBAL_GAP)return false;
 return !log.some(e=>e.id===id&&now-e.at<PER_BEAR_GAP);
}
export function pickReaction(manifest,id,kind,loaded=null,random=Math.random){
 const ready=(manifest.takes[kind+':'+id]||[]).filter(n=>!loaded||loaded.has(n));
 if(!ready.length)return null;
 const recent=manifest.lastPick?.[kind+':'+id],pool=ready.length>1?ready.filter(n=>n!==recent):ready;
 const name=pool[Math.floor(random()*pool.length)%pool.length];
 (manifest.lastPick??={})[kind+':'+id]=name;return name;
}
