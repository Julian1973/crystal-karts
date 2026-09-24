// Supplied final movies: one per racer, loaded only when the result is shown.
export const WINNER_IDS = ['keen','aida','sunny','misty','amie','howey','luna','fuzzby','zenny'];
export function celebrationOpacity(time,duration){
 const fade=Number.isFinite(duration)?Math.min(.75,duration/3):.75;
 if(fade<=0)return 0;
 return Math.max(0,Math.min(1,time/fade,Number.isFinite(duration)?(duration-time)/fade:1));
}
export function createWinnerVideo({video,button,status,container,audio}) {
 let generation=0,active=false;
 const fade=()=>{if(video.style)video.style.opacity=String(celebrationOpacity(video.currentTime,video.duration));};
 video.addEventListener('timeupdate',fade);
 video.addEventListener('playing',fade);
 video.addEventListener('seeked',fade);
 function stop(){generation++;active=false;video.pause();video.removeAttribute('src');video.load();video.hidden=true;container.classList.remove('has-winner-video');status.textContent='';}
 async function play(){
  if(!active)return;
  const current=++generation;
  audio.stopVictory();audio.music?.pause();
  video.muted=!audio.sfxEnabled;button.textContent='Replay celebration ▶';
  try {await video.play();if(current!==generation)return;status.textContent='';}
  catch {if(current!==generation)return;button.textContent='Play celebration ▶';status.textContent='Tap play to watch the winner.';}
 }
 video.addEventListener('error',()=>{if(!active)return;status.textContent='Video unavailable. Tap to retry.';button.textContent='Retry celebration ▶';});
 video.addEventListener('ended',()=>{if(video.style)video.style.opacity='0';if(active)button.textContent='Replay celebration ▶';});
 button.onclick=()=>{if(!active)return;if(video.error)video.load();video.currentTime=0;void play();};
 function show(character){stop();if(!WINNER_IDS.includes(character.id))return;active=true;if(video.style)video.style.opacity='0';container.classList.add('has-winner-video');video.poster=`assets/winners/${character.id}.jpg`;video.src=`assets/winners/${character.id}.mp4`;video.setAttribute('aria-label',`${character.name}'s victory celebration`);video.hidden=false;button.classList.remove('hidden');void play();}
 const onVisibility=()=>{if(document.hidden&&active){generation++;video.pause();button.textContent='Resume celebration ▶';}};
 document.addEventListener('visibilitychange',onVisibility);
 window.addEventListener('pagehide',stop);
 return {show,stop,setMuted(muted){video.muted=muted;}};
}
