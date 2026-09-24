import {wrapDelta,ROCK} from './physics.js?v=75';
import {skillEffects} from './skills.js?v=75';
export function launchCrystal(r,trackYaw,racers,length){
 if(racers){const others=racers.filter(x=>x.ci!==r.ci&&x.time===null);const ahead=others.filter(x=>x.s>r.s).sort((a,b)=>a.s-b.s);const target=ahead[0]||others.sort((a,b)=>Math.abs(wrapDelta(a.s-r.s,length))-Math.abs(wrapDelta(b.s-r.s,length)))[0];return {owner:r.ci,target:target?.ci,homing:true,s:r.s,lane:r.lane,route:r.route||0,life:30};}
 const angle=(r.manual?r.heading:trackYaw)-trackYaw;
 return {route:r.route||0,owner:r.ci,s:r.s+Math.cos(angle)*2.8,lane:r.lane+Math.sin(angle)*2.8,vs:65*Math.cos(angle),vx:65*Math.sin(angle),life:2};
}
export function advanceShots(shots,racers,rocks,dt,length,onHit=()=>{}){
 for(const shot of shots){
  if(shot.homing){
   shot.life-=dt;const target=racers.find(r=>r.ci===shot.target&&r.time===null);
   if(!target){shot.life=0;continue;}
   const ds=wrapDelta(target.s-shot.s,length),dx=target.lane-shot.lane,distance=Math.hypot(ds,dx),step=(Math.max(75,Math.abs(target.speed||0)+40))*dt;
   shot.route=target.route||0;shot.airHeight=target.airHeight||0;
   if(distance<=step+1.2){
    shot.s=target.s;shot.lane=target.lane;
    if(target.phasing&&!skillEffects(target).star)continue;
    shot.life=0;const shield=skillEffects(target).shield||skillEffects(target).star;
    if(!shield&&!skillEffects(target).star){target.spinTime=.72;target.spinDuration=.72;target.stun=0;target.slipTime=.7;target.slipSide=dx>=0?-1:1;target.speed=(target.speed||0)*.72;target.driveSpeed=(target.driveSpeed||0)*.72;target.lateralSpeed=(target.lateralSpeed||0)+target.slipSide*1.4;}
    onHit(target,shield,shot.owner);
   }else{shot.s+=ds/distance*step;shot.lane+=dx/distance*step;}
   continue;
  }
  shot.life-=dt;const steps=Math.max(1,Math.ceil(65*dt/.5));
  for(let i=0;i<steps&&shot.life>0;i++){
   shot.s+=shot.vs*dt/steps;shot.lane+=shot.vx*dt/steps;
   if(Math.abs(shot.lane)>9.2||rocks.some(h=>(h.route||0)===(shot.route||0)&&Math.abs(wrapDelta(h.s-shot.s,length))<ROCK.halfLength+.25&&Math.abs(h.lane-shot.lane)<ROCK.halfWidth+.25)){shot.life=0;break}
   for(const r of racers){if(r.ci===shot.owner||r.phasing||(r.route||0)!==(shot.route||0)||(r.airHeight||0)>1.8)continue;
    const ds=wrapDelta(shot.s-r.s,length),dx=shot.lane-r.lane,a=r.colliderAngle||0;
    if(Math.abs(dx*Math.cos(a)-ds*Math.sin(a))>1.8||Math.abs(dx*Math.sin(a)+ds*Math.cos(a))>2.3)continue;
    shot.life=0;const effects=skillEffects(r),protectedByPower=effects.shield||effects.star;if(!protectedByPower){r.slipTime=.7;r.slipSide=dx>=0?-1:1;r.spinTime=.72;r.spinDuration=.72;r.driveSpeed=(r.driveSpeed||0)*.72;r.speed*=.72;r.lateralSpeed=(r.lateralSpeed||0)+r.slipSide*1.4;}
    onHit(r,protectedByPower,shot.owner);break;
   }
  }
 }
 return shots.filter(s=>s.life>0);
}
