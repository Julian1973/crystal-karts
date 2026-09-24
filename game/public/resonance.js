// Crystal Resonance: bears whose crystals belong together build a shared boost by racing side by side.
// Pairs follow the Crystal Bears bible; Keen (adaptable newcomer) can resonate with anyone, a little slower.
export const RESONANCE_PAIRS=Object.freeze({misty:'howey',howey:'misty',luna:'sunny',sunny:'luna',aida:'amie',amie:'aida',zenny:'fuzzby',fuzzby:'zenny'});
export const RESONANCE=Object.freeze({range:10,laneRange:5,minSpeed:10,charge:2.5,keenCharge:3.5,boost:1.4,cooldown:12,decay:1.5});
export function resonates(a,b){if(!a||!b||a===b)return false;return RESONANCE_PAIRS[a]===b||a==='keen'||b==='keen';}
export const chargeNeeded=(a,b)=>RESONANCE_PAIRS[a]===b?RESONANCE.charge:RESONANCE.keenCharge;
const key=(a,b)=>a.ci<b.ci?a.ci+':'+b.ci:b.ci+':'+a.ci;
// Advances every eligible pair; returns the pairs that resonated this step. State lives in `state`.
export function stepResonance(state,racers,dt,length,wrapDelta){
 const fired=[];
 for(const r of racers)r.resonanceCooldown=Math.max(0,(r.resonanceCooldown||0)-dt);
 for(let i=0;i<racers.length;i++)for(let j=i+1;j<racers.length;j++){
  const a=racers[i],b=racers[j],k=key(a,b);if(!resonates(a.id,b.id)){continue}
  const close=a.time===null&&b.time===null&&!a.airborne&&!b.airborne&&(a.route||0)===(b.route||0)&&Math.abs(wrapDelta(a.s-b.s,length))<RESONANCE.range&&Math.abs(a.lane-b.lane)<RESONANCE.laneRange&&Math.abs(a.speed||0)>RESONANCE.minSpeed&&Math.abs(b.speed||0)>RESONANCE.minSpeed;
  const ready=a.resonanceCooldown<=0&&b.resonanceCooldown<=0;
  const charge=Math.max(0,(state[k]||0)+(close&&ready?dt:-dt*RESONANCE.decay));state[k]=charge;
  if(charge>=chargeNeeded(a.id,b.id)){state[k]=0;a.resonanceCooldown=b.resonanceCooldown=RESONANCE.cooldown;a.boostTime=Math.max(a.boostTime||0,RESONANCE.boost);b.boostTime=Math.max(b.boostTime||0,RESONANCE.boost);fired.push([a,b]);}
 }
 return fired;
}
// 0..1 charge between the player and whichever partner is building resonance with them.
export function playerResonance(state,player,racers){
 let best=null;for(const o of racers){if(o===player||!resonates(player.id,o.id))continue;const c=(state[key(player,o)]||0)/chargeNeeded(player.id,o.id);if(!best||c>best.charge)best={partner:o,charge:Math.min(1,c)};}
 return best&&best.charge>0?best:null;
}
