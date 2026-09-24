// Small, deterministic game rules kept outside the renderer so kid-friendly
// balancing can be exercised without a WebGL context.
export const ITEM_POWERS=Object.freeze({
 boost:{label:'Boost',seconds:1.7},triple:{label:'Triple boost',seconds:3.4},bubble:{label:'Bubble shield',seconds:5},
 homing:{label:'Homing crystal',seconds:0},honey:{label:'Sticky honey',seconds:0},star:{label:'Rainbow star',seconds:4},hug:{label:'Group hug',seconds:2.2}
});
export function comebackFactor(position,total){return Math.max(0,Math.min(1,(position-1)/Math.max(1,total-1)));}
export function comebackBoost(position,total){const p=comebackFactor(position,total);return p<=.5?p*.06:.03+(p-.5)*.14;}
export function crystalRollBoost(position,total){return .08+.32*comebackFactor(position,total);}
export function selectItem(position,total,random=Math.random){
 const back=comebackFactor(position,total),weights={boost:1.3,triple:.35,bubble:1.05,homing:.7,honey:.9,star:.22,hug:.35};
 weights.triple+=back*.8;weights.star+=back*.5;weights.bubble+=back*.22;weights.boost+=back*.25;weights.hug+=back*.18;
 const sum=Object.values(weights).reduce((a,b)=>a+b,0);let roll=random()*sum;
 for(const id of Object.keys(weights)){roll-=weights[id];if(roll<=0)return id;}
 return 'boost';
}
export function kartStats(index){
 const rows=[ [4,4,4,3],[3,4,4,3],[4,5,3,3],[3,3,5,3],[3,4,4,3],[3,3,4,5],[3,3,5,3],[4,4,3,3],[4,4,3,3] ];
 return rows[index]||rows[0];
}
export function slipstreaming(player,racers){return racers.some(r=>r!==player&&r.time===null&&r.s>player.s&&r.s-player.s<11&&Math.abs(r.lane-player.lane)<3.2);}
