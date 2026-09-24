// Reduce rendering cost only after sustained slow frames. Never change game speed.
export function createQualityGovernor(apply,initial=1.2){
 let samples=0,total=0,ratio=initial,cooldown=0;
 return function sample(milliseconds,active){
  if(!active||milliseconds>200||milliseconds<=0){samples=0;total=0;return}
  if(cooldown>0){cooldown-=milliseconds;return}
  total+=milliseconds;samples++;
  if(total<3000)return;
  const mean=total/samples;samples=0;total=0;
  if(mean>30&&ratio>.75){ratio=Math.max(.75,Math.round((ratio-.15)*100)/100);apply(ratio);cooldown=5000;}
 };
}
