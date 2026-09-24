export class RaceRoom{
 constructor(){this.code='';this.token='';this.host=false;this.members=[];this.phase='lobby';this.timer=null;this.closed=false;this.lastGood=0;this.onState=()=>{};this.onError=()=>{};this.readInput=()=>({});this.readSnapshot=()=>null;}
 async request(action,extra={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const r=await fetch('/api/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:this.code,token:this.token,...extra}),signal:controller.signal});
   const isJSON=r.headers.get('content-type')?.toLowerCase().includes('application/json');
   if(!r.ok&&!isJSON)throw Object.assign(new Error('Connection hiccup - try again'),{status:r.status});
   if(!isJSON)throw Object.assign(new Error('Connection hiccup - try again'),{status:r.status});
   let data;try{data=await r.json()}catch{throw Object.assign(new Error('Connection hiccup - try again'),{status:r.status});}
   if(!r.ok)throw Object.assign(new Error(data.error||'Connection hiccup - try again'),{status:r.status});
   return data;
  }finally{clearTimeout(timer);}
 }
 async open(action,bear,code='',track='wood'){this.closed=false;this.code=code.trim().toUpperCase();const data=await this.request(action,{bear,track});Object.assign(this,data);this.lastGood=performance.now();await this.poll();}
 async poll(){if(this.closed)return;try{const data=await this.request('sync',{input:this.readInput(),snapshot:this.host?this.readSnapshot():null});if(this.closed)return;this.lastGood=performance.now();this.phase=data.phase;this.members=data.members;this.onState(data);}catch(e){if(this.closed)return;this.onError(e);if(e.status===403||e.status===404||e.status===410){this.closed=true;return;}}this.timer=setTimeout(()=>this.poll(),this.phase==='lobby'?700:100);}
 async ready(value){await this.request('ready',{ready:value});}
 async start(){await this.request('start');}
 async leave(){this.closed=true;clearTimeout(this.timer);try{await this.request('leave')}catch{}this.code='';}
 inputFor(ci){return this.members.find(m=>m.bear===ci)?.input||{};}
}
