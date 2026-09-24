export function nextGoal({hasShard,trackName,best}){
 if(!hasShard)return 'Next: complete Crystal Rush in '+trackName+'.';
 if(Number.isFinite(best)&&best>1)return 'Next: beat '+Math.max(1,best-.8).toFixed(1)+' seconds.';
 return 'Next: finish a clean lap without a bump.';
}
export function nearestRival(player,bots){return bots.filter(r=>r.time===null).sort((a,b)=>Math.abs(a.s-player.s)-Math.abs(b.s-player.s))[0]||null;}
