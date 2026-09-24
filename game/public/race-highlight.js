// One short, local-only clip per race. No camera or microphone access.
export class RaceHighlight {
 constructor(canvas,onReady){this.canvas=canvas;this.onReady=onReady;this.generation=0;this.reset();}
 reset(){this.generation++;this.stop();if(this.url)URL.revokeObjectURL(this.url);this.url=null;this.used=false;this.onReady(null);}
 trigger(label){
  if(this.used||!globalThis.MediaRecorder)return false;
  const mime=['video/webm;codecs=vp8','video/mp4','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)return false;
  let stream;
  try{
   const c=document.createElement('canvas'),scale=Math.min(1,640/Math.max(this.canvas.width,this.canvas.height));c.width=Math.max(2,Math.round(this.canvas.width*scale/2)*2);c.height=Math.max(2,Math.round(this.canvas.height*scale/2)*2);
   if(!c.captureStream)return false;const ctx=c.getContext('2d');if(!ctx)return false;
   stream=c.captureStream(20);const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1000000}),parts=[],generation=this.generation;
   this.used=true;this.rec=rec;this.stream=stream;this.surface=c;this.ctx=ctx;this.label=label;this.lastFrame=0;let bytes=0;
   rec.ondataavailable=e=>{if(e.data.size){bytes+=e.data.size;parts.push(e.data);if(bytes>2000000)this.stop();}};
   rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(generation!==this.generation||!parts.length)return;this.url=URL.createObjectURL(new Blob(parts,{type:rec.mimeType}));this.onReady({url:this.url,label,extension:rec.mimeType.includes('mp4')?'mp4':'webm'});};
   rec.onerror=()=>{this.generation++;this.stop();};rec.start(250);this.timer=setTimeout(()=>this.stop(),4500);return true;
  }catch{stream?.getTracks().forEach(t=>t.stop());this.stop();return false;}
 }
 frame(now){if(!this.rec||now-this.lastFrame<50)return;this.lastFrame=now;try{this.ctx.drawImage(this.canvas,0,0,this.surface.width,this.surface.height);}catch{this.generation++;this.stop();}}
 stop(){clearTimeout(this.timer);const rec=this.rec;this.rec=null;if(rec&&rec.state!=='inactive')try{rec.stop();}catch{}this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.surface=null;this.ctx=null;}
}
