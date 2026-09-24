// Countdown voices are user supplied approved recordings. Missing clips stay silent.
export const COUNTDOWN_BEAR_IDS=Object.freeze(['keen','aida','sunny','misty','amie','howey','luna','zenny','fuzzby']);
export function countdownVoicePath(bearId){return COUNTDOWN_BEAR_IDS.includes(bearId)?`assets/voices/countdown/${bearId}.mp3`:null;}
export function preloadCountdownVoice(bearId,AudioCtor=globalThis.Audio){
 const src=countdownVoicePath(bearId);if(!src||typeof AudioCtor!=='function')return null;
 const clip=new AudioCtor();clip.src=src;clip.preload='auto';clip.countdownVoiceMissing=false;
 clip.addEventListener?.('error',()=>{clip.countdownVoiceMissing=true},{once:true});
 try{clip.load?.();}catch{clip.countdownVoiceMissing=true;}
 return clip;
}
export function countdownVoiceReady(clip,sfxOn=true){return !!(sfxOn&&clip&&!clip.countdownVoiceMissing&&clip.readyState>=2);}
export function playCountdownClip(clip,sfxOn=true,onFailure=()=>{}){if(!countdownVoiceReady(clip,sfxOn))return false;try{clip.currentTime=0;const result=clip.play();result?.catch?.(()=>onFailure());return true;}catch{onFailure();return false;}}
