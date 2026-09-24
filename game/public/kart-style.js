// Cosmetic silhouettes stay inside the shared kart collision envelope.
export const KART_STYLES={
 keen:{hood:[1.18,.40,1.02],stripe:.30,fin:.28},
 aida:{hood:[1.25,.48,.95],stripe:.42,fin:.18},
 sunny:{hood:[1.28,.53,.93],stripe:.55,fin:.24},
 misty:{hood:[1.22,.38,1.02],stripe:.24,fin:.12},
 amie:{hood:[1.25,.50,.95],stripe:.38,fin:.20},
 howey:{hood:[1.30,.55,.92],stripe:.50,fin:.35},
 luna:{hood:[1.22,.40,1.02],stripe:.22,fin:.10},
 zenny:{hood:[1.18,.48,.96],stripe:.32,fin:.14},
 fuzzby:{hood:[1.28,.54,.94],stripe:.46,fin:.25}
};
export function impactPenalty(r,kind,speed,shield=false){
 // Kart impulses already transfer momentum in solveContacts. A stun here
 // overwrites that response with zero velocity on the next driving update.
 // Keep kart contact cosmetic; only solid obstacle crashes incur a penalty.
 if(kind==='rock'){
  r.boostTime=0;r.driftCharge=0;r.wasDrifting=false;
  r.stun=Math.max(r.stun||0,.18);
 }
}
