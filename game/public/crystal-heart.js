// Crystal Heart: after a setback, each bear uses their own emotional tool to bounce back.
// A ring fills at the bear's pace; pressing the power button as it glows restores speed.
// Missing is never punished: the race simply carries on as before.
export const HEART_TOOLS=Object.freeze({
 aida:{tool:'I’ve got this',prompt:'Say it: I’ve got this',affirmation:'I believe in me!',period:1},
 howey:{tool:'Be kind to yourself',prompt:'Be kind to yourself',affirmation:'Steady and kind!',period:1},
 misty:{tool:'Name the feeling',prompt:'Name the feeling, then let it go',affirmation:'I felt it, and I’m OK!',period:1.1},
 sunny:{tool:'Find the bright side',prompt:'Look for the bright side',affirmation:'Still sunny!',period:.9},
 luna:{tool:'Breathe',prompt:'Breathe in… and out',affirmation:'Calm and ready.',period:1.3},
 keen:{tool:'Be brave',prompt:'Be brave — tap on the flash',affirmation:'Brave and bright!',period:.8},
 amie:{tool:'Find the silver lining',prompt:'Find the silver lining',affirmation:'Let’s shine the light!',period:1},
 zenny:{tool:'Shake it off',prompt:'Shake it off',affirmation:'Buzz, back on track!',period:.9},
 fuzzby:{tool:'Bounce back',prompt:'Bounce back',affirmation:'Boing! Back again!',period:.9}
});
const WINDOWS={easy:.3,standard:.2,hard:.15};
export function startHeart(id,now,{difficulty='standard',restoreSpeed=0}={}){
 const tool=HEART_TOOLS[id];if(!tool)return null;
 return {id,tool,start:now+.25,period:tool.period,window:WINDOWS[difficulty]??WINDOWS.standard,restoreSpeed,resolved:false,result:null};
}
// 0 while the ring is growing in, 1 at the glow, beyond 1 as the chance passes.
export const heartProgress=(h,now)=>h?Math.max(0,(now-h.start)/h.period):0;
export const heartExpired=(h,now)=>!!h&&!h.resolved&&now>h.start+h.period+h.window;
export function pressHeart(h,now){
 if(!h||h.resolved)return null;
 const off=Math.abs(now-(h.start+h.period));h.resolved=true;
 h.result=off<=h.window/2?'perfect':off<=h.window?'good':'miss';return h.result;
}
export function heartReward(result){
 return result==='perfect'?{boost:1.1,restore:1}:result==='good'?{boost:.6,restore:.92}:{boost:0,restore:0};
}
// Minimal self-styled overlay so the feature does not depend on page stylesheets.
export function createHeartUI(doc=globalThis.document){
 if(!doc?.createElement)return {show(){},update(){},hide(){}};
 const root=doc.createElement('div');root.id='crystal-heart';root.hidden=true;root.setAttribute('role','status');root.setAttribute('aria-live','polite');
 root.innerHTML='<div class="ch-ring"><div class="ch-fill"></div><div class="ch-gem">✦</div></div><p class="ch-prompt"></p><small class="ch-hint">Tap ✦ Power / Space when it glows</small>';
 const style=doc.createElement('style');style.textContent='#crystal-heart{position:fixed;left:50%;top:26%;transform:translateX(-50%);z-index:30;text-align:center;pointer-events:none;color:#fff;font-weight:800;text-shadow:0 2px 6px #0008}#crystal-heart .ch-ring{position:relative;width:92px;height:92px;margin:0 auto;border-radius:50%;border:4px solid var(--ch,#bfe9ff)}#crystal-heart .ch-fill{position:absolute;inset:50%;border-radius:50%;background:radial-gradient(var(--ch,#bfe9ff),transparent 70%);transform:translate(-50%,-50%)}#crystal-heart .ch-gem{position:absolute;inset:0;display:grid;place-items:center;font-size:34px}#crystal-heart.glow .ch-ring{box-shadow:0 0 28px 8px var(--ch,#bfe9ff)}#crystal-heart .ch-prompt{margin:.5rem auto 0;font-size:1.2rem;background:rgba(12,24,48,.62);border-radius:999px;padding:.3rem .9rem;display:inline-block}#crystal-heart small{display:block;margin-top:.3rem;opacity:.9}@media (max-width:700px){#crystal-heart{top:18%}#crystal-heart .ch-hint{display:none}}';
 doc.head?.append?.(style);doc.body?.append?.(root);
 const fill=root.querySelector?.('.ch-fill'),prompt=root.querySelector?.('.ch-prompt');
 return {
  show(h,color='#bfe9ff'){root.hidden=false;root.classList?.remove?.('glow');root.style?.setProperty?.('--ch',color);if(prompt)prompt.textContent=h.tool.prompt;},
  update(h,now){if(!fill)return;const p=Math.min(1.25,heartProgress(h,now)),size=Math.min(1,p)*92;fill.style.width=fill.style.height=size+'px';root.classList?.toggle?.('glow',Math.abs(now-(h.start+h.period))<=h.window);},
  hide(text=''){if(prompt&&text)prompt.textContent=text;root.classList?.remove?.('glow');setTimeout(()=>{root.hidden=true},text?700:0);}
 };
}
