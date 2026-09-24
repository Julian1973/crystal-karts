// Track-space arcade physics. Dimensions are independent of character artwork.
export const KART = Object.freeze({halfWidth:1.55,halfLength:2.05,mass:1});
export const ROCK = Object.freeze({halfWidth:1.55,halfLength:1.3});
export const LANE_LIMIT=9.4-KART.halfWidth;
export const wrapDelta=(d,length)=>((d+length/2)%length+length)%length-length/2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function advance(r,dt,target,lateralTarget,acceleration=12,traction=1){
 r.hitCooldown=Math.max(0,(r.hitCooldown||0)-dt);
 r.stun=Math.max(0,(r.stun||0)-dt);
 const desired=r.stun>0?0:target;
 r.speed+=clamp(desired-r.speed,-42*traction*dt,(target>35?Math.max(20,acceleration):acceleration)*dt);
 r.speed=r.stun>0?0:Math.max(0,r.speed);
 r.lateralSpeed=(r.lateralSpeed||0)+(lateralTarget-(r.lateralSpeed||0))*(1-Math.exp(-7*traction*dt));
 r.s+=r.speed*dt;r.lane+=r.lateralSpeed*dt;
}
// Heading stays in world space: the track never turns the player's kart.
export function advanceManual(r,dt,input,trackYaw,curvature=0){
 r.hitCooldown=Math.max(0,(r.hitCooldown||0)-dt);
 r.stun=Math.max(0,(r.stun||0)-dt);r.collided=false;
 r.rockContactTime=Math.max(0,(r.rockContactTime||0)-dt);
 const traction=clamp((input.traction??1)*(r.slipTime>0?.25:1),.08,1);
 let v=r.driveSpeed||0;
 if(input.brake&&v<=.5)r.stun=0;
 if(r.stun>0){v=0}
 else if(input.brake){
  if(v>.5){v=Math.max(0,v-38*traction*dt);r.reverseHold=0}
  else {r.reverseHold=(r.reverseHold||0)+dt;v=r.reverseHold>.15?Math.max(-7,v-9*dt):0}
 }else if(input.throttle){
  r.reverseHold=0;const top=input.topSpeed||(input.boost?48:32);
  v+=clamp(top-v,-12*dt,(v<0?30:input.acceleration||(input.boost?20:12))*Math.sqrt(traction)*dt);
 }else{
  r.reverseHold=0;const drag=(2.4+.11*Math.abs(v))*dt;
  v=Math.sign(v)*Math.max(0,Math.abs(v)-drag);
 }
 // Steering follows rolling speed; at a rock, throttle plus steering allows a slow escape pivot.
 // No input means no automatic movement. Reverse naturally reverses steering.
 const escapeTurn=r.rockContactTime>0&&input.throttle&&!input.brake&&Math.abs(v)<3;
 const steeringSpeed=escapeTurn?10:v;
 r.steerAngle=input.steer;
 const turn=input.steer*(input.steeringScale||1)*steeringSpeed*.072/(1+Math.abs(v)*(escapeTurn?.015:.019))*(input.drift?1.18:1);
 r.heading+=(turn+(r.slipTime>0?(r.slipSide||1)*.8:0))*dt;
 if(input.easyAssist){const drift=wrapDelta(r.heading-trackYaw,Math.PI*2);r.heading-=clamp(drift,-.5,.5)*input.easyAssist*dt;}
 // High-speed cornering scrubs speed; braking before bends preserves grip.
 if(!escapeTurn&&Math.abs(v)>14)v*=Math.exp(-Math.abs(turn)*Math.abs(v)*.0015*dt);
 const offset=wrapDelta(r.heading-trackYaw,Math.PI*2),c=Math.cos(offset),sn=Math.sin(offset);
 const metric=clamp(1-r.lane*curvature,.5,1.5);
 r.driveSpeed=v;r.speed=v*c/metric;
 const grip=(input.grip||(input.drift?3.2:12))*traction;
 // Gentle powered crawl along the rock face; the contact solver still blocks penetration.
 const lateralTarget=escapeTurn&&Math.abs(sn)>.15?Math.sign(sn)*Math.max(Math.abs(v*sn),2.5):v*sn;
 r.lateralSpeed=(r.lateralSpeed||0)+(lateralTarget-(r.lateralSpeed||0))*(1-Math.exp(-grip*dt));
 if(Math.abs(v)<.01)r.lateralSpeed=0;
 r.colliderAngle=offset;
 r.halfWidth=Math.abs(c)*KART.halfWidth+Math.abs(sn)*KART.halfLength;
 r.halfLength=Math.abs(c)*KART.halfLength+Math.abs(sn)*KART.halfWidth;
 r.s+=r.speed*dt;r.lane+=r.lateralSpeed*dt;
 if(input.easyAssist){const edge=Math.max(0,Math.abs(r.lane)-5.2);r.lateralSpeed-=Math.sign(r.lane)*edge*input.easyAssist*1.8*dt;}
}
export function syncManualContact(r,trackYaw,curvature=0){
 if(!r.collided)return;
 const offset=r.heading-trackYaw,metric=clamp(1-r.lane*curvature,.5,1.5);
 r.driveSpeed=r.speed*metric*Math.cos(offset)+(r.lateralSpeed||0)*Math.sin(offset);
}
// Oriented rectangles use the kart's actual heading, avoiding the oversized
// axis-aligned box that used to catch empty space around a turning kart.
export function contact(a,b,length,rock=false){
 if((a.route||0)!==(b.route||0)||Math.abs((a.airHeight||0)-(b.airHeight||0))>(rock?(b.height||1.8):1.8))return null;
 const angle=a.colliderAngle||0,other=rock?0:b.colliderAngle||0;
 const axes=t=>[{x:Math.cos(t),z:-Math.sin(t)},{x:Math.sin(t),z:Math.cos(t)}];
 const aa=axes(angle),bb=axes(other),dx=b.lane-a.lane,dz=wrapDelta(b.s-a.s,length);
 const sizeA=[KART.halfWidth,KART.halfLength],sizeB=rock?[b.halfWidth??ROCK.halfWidth,b.halfLength??ROCK.halfLength]:[KART.halfWidth,KART.halfLength];
 let best=null;
 for(const n of [...aa,...bb]){
  const project=(basis,size)=>Math.abs(n.x*basis[0].x+n.z*basis[0].z)*size[0]+Math.abs(n.x*basis[1].x+n.z*basis[1].z)*size[1];
  const d=dx*n.x+dz*n.z,depth=project(aa,sizeA)+project(bb,sizeB)-Math.abs(d);
  if(depth<=0)return null;
  if(!best||depth<best.depth){const sign=d>=0?1:-1;best={x:n.x*sign,z:n.z*sign,depth};}
 }
 return best;
}
export function solveContacts(racers,rocks,length,onImpact=()=>{}){
 const hit=(r,kind,speed,instigator)=>{if(speed>2&&(r.hitCooldown||0)<=0){r.hitCooldown=.65;onImpact(r,kind,speed,instigator)}};
 for(let pass=0;pass<10;pass++){
  for(let i=0;i<racers.length;i++)for(let j=i+1;j<racers.length;j++){
   const a=racers[i],b=racers[j];if(a.phasing||b.phasing)continue;const n=contact(a,b,length);if(!n)continue;
   a.collided=b.collided=true;const ia=1/(a.mass||1),ib=1/(b.mass||1),sum=ia+ib,depth=n.depth+.0001;
   a.lane-=n.x*depth*ia/sum;a.s-=n.z*depth*ia/sum;b.lane+=n.x*depth*ib/sum;b.s+=n.z*depth*ib/sum;
   const relative=((b.lateralSpeed||0)-(a.lateralSpeed||0))*n.x+(b.speed-a.speed)*n.z;
   if(relative<0){const instigator=((a.lateralSpeed||0)*n.x+a.speed*n.z)>-((b.lateralSpeed||0)*n.x+b.speed*n.z)?a:b;const impulse=-1.08*relative/sum;a.lateralSpeed=(a.lateralSpeed||0)-impulse*n.x*ia;a.speed-=impulse*n.z*ia;b.lateralSpeed=(b.lateralSpeed||0)+impulse*n.x*ib;b.speed+=impulse*n.z*ib;if(!a.manual)a.speed=Math.max(0,a.speed);if(!b.manual)b.speed=Math.max(0,b.speed);hit(a,'kart',-relative,instigator);hit(b,'kart',-relative,instigator)}
  }
  for(const r of racers){
   if(!r.phasing)for(const rock of rocks){const n=contact(r,rock,length,true);if(!n)continue;
    r.collided=true;r.rockContactTime=.35;r.lane-=n.x*(n.depth+.0001);r.s-=n.z*(n.depth+.0001);
    const into=(r.lateralSpeed||0)*n.x+r.speed*n.z;
    if(into>0){r.lateralSpeed=(r.lateralSpeed||0)-into*n.x;r.speed-=into*n.z;if(into>2)r.stun=Math.max(r.stun||0,.18);hit(r,'rock',into)}
   }
   const limit=9.4-(r.halfWidth||KART.halfWidth);
   if(Math.abs(r.lane)>limit){r.collided=true;const side=Math.sign(r.lane),speed=Math.abs(r.lateralSpeed||0);r.lane=side*limit;if((r.lateralSpeed||0)*side>0){r.lateralSpeed=0;r.speed*=.92;hit(r,'edge',speed)}}
  }
 }
}

// Recovery always moves backwards and never overlaps a rock or another racer.
export function findRecoverySpot(r,rocks,racers,length){
 const lanes=[clamp(r.lane,-6,6),0,-5,5];
 for(let back=8;back<=Math.min(length,160);back+=4){
  for(const lane of lanes){const s=r.s-back;
   const clearRock=rocks.every(o=>Math.abs(wrapDelta(s-o.s,length))>KART.halfLength+ROCK.halfLength+3||Math.abs(lane-o.lane)>KART.halfWidth+ROCK.halfWidth+2);
   const clearCars=racers.filter(o=>o!==r).every(o=>Math.abs(wrapDelta(s-o.s,length))>KART.halfLength+(o.halfLength||KART.halfLength)+4||Math.abs(lane-o.lane)>KART.halfWidth+(o.halfWidth||KART.halfWidth)+2);
   if(clearRock&&clearCars)return{s,lane};
  }
 }
 return null;
}
