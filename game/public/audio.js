import {Soundscape} from './soundscape.js?v=78';
import {preloadCountdownVoice,playCountdownClip} from './countdown-voice.js?v=75';
// Music is the supplied Crystal Karting track. Effects are synthesised in-browser.
export class RaceAudio {
 constructor(){this.musicEnabled=true;this.sfxEnabled=true;this.context=null;this.music=null;this.running=false;this.master=null;this.victory=null;this.victoryKey=null;this.countdownVoices=new Map();this.countdownVoice=null;this.countdownMusicVolume=undefined;this.soundscape=new Soundscape(this);}
 ensureMusic(){if(!this.music&&typeof Audio!=='undefined'){const course=new URLSearchParams(globalThis.location?.search||'').get('track')||'wood';const valid=['wood','river','night','honey','moon','coast','rose','blossom','zen','cove','showcase'].includes(course);this.music=new Audio(valid?'assets/music/'+course+'.mp3':'assets/crystal-karting.mp3');this.music.onerror=()=>{this.music.onerror=null;this.music.src='assets/crystal-karting.mp3';this.playMusic();};this.music.loop=true;this.music.preload='metadata';this.setMusicVolume(.18);}return this.music;}
 setMusicVolume(level){this.musicLevel=level;if(this.musicGain){this.musicGain.gain.value=level;if(this.music)this.music.volume=1;}else if(this.music)this.music.volume=level;}
 connectMusic(){if(!this.music||this.musicSource||!this.context?.createMediaElementSource)return;this.musicSource=this.context.createMediaElementSource(this.music);this.musicGain=this.context.createGain();this.musicSource.connect(this.musicGain);this.musicGain.connect(this.context.destination);this.setMusicVolume(this.musicLevel??.18);}
 async playMusic(){const m=this.ensureMusic();if(!m||!this.musicEnabled||!this.running)return;try{await m.play();}catch{/* Browser can require another direct user gesture. */}}
 unlock(){try{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;this.context??=new C();if(!this.master){this.master=this.context.createDynamicsCompressor();this.master.threshold.value=-14;this.master.ratio.value=6;this.master.connect(this.context.destination)}this.connectMusic();if(this.context.state==='suspended'||this.context.state==='interrupted')this.context.resume().catch(()=>{});}catch{}}
 start(){this.soundscape.stop();this.stopGuide();this.stopVictory();this.victoryKey=null;this.raceActive=true;this.running=true;const m=this.ensureMusic();if(m){m.currentTime=0;this.setMusicVolume(.18);}this.unlock();this.soundscape.start();this.playMusic();}
 pause(){this.raceActive=false;this.soundscape.stop();this.stopGuide();this.stopCountdownVoice();this.running=false;this.music?.pause();this.context?.suspend().catch(()=>{});}
 resume(){this.raceActive=true;this.running=true;this.unlock();this.soundscape.start();this.playMusic();}
 stop(){this.stopVictory();this.victoryKey=null;this.pause();if(this.music)this.music.currentTime=0;}
 stopVictory(){if(this.victory){this.victory.pause();this.victory=null;}if(this.music)this.setMusicVolume(.12);}
 playVictory(src){if(!src||!this.sfxEnabled||typeof Audio==='undefined'||this.victoryKey===src)return;this.stopVictory();this.victoryKey=src;const clip=new Audio(src);this.victory=clip;clip.volume=.85;if(this.music)this.setMusicVolume(.04);clip.onended=clip.onerror=()=>{if(this.victory===clip)this.stopVictory();};clip.play().catch(()=>{if(this.victory===clip){this.stopVictory();this.victoryKey=null;}});}

 preloadCountdownVoice(bearId){if(!this.countdownVoices.has(bearId))this.countdownVoices.set(bearId,preloadCountdownVoice(bearId));return this.countdownVoices.get(bearId)||null;}
 playCountdownVoice(bearId){if(!this.sfxEnabled)return null;const clip=this.preloadCountdownVoice(bearId);if(!clip||!Number.isFinite(clip.duration)||clip.duration<2.8||clip.duration>4.5)return null;this.stopCountdownVoice();this.countdownVoice=clip;if(this.music){this.countdownMusicVolume=this.musicLevel??this.music.volume;this.setMusicVolume(.04);}clip.onended=clip.onerror=()=>{if(this.countdownVoice===clip)this.stopCountdownVoice();};if(!playCountdownClip(clip,this.sfxEnabled,()=>{if(this.countdownVoice===clip)this.stopCountdownVoice();})){this.stopCountdownVoice();return null;}return clip;}
 stopCountdownVoice(){const clip=this.countdownVoice;if(clip){clip.onended=clip.onerror=null;try{clip.pause();clip.currentTime=0;}catch{}this.countdownVoice=null;}if(this.countdownMusicVolume!==undefined){this.setMusicVolume(this.countdownMusicVolume);this.countdownMusicVolume=undefined;}}

 stopGuide(){if(this.guideClip){this.guideClip.pause();this.guideClip=null;}clearInterval(this.guideFade);if(this.music&&this.guideMusicVolume!==undefined){this.setMusicVolume(this.guideMusicVolume);this.guideMusicVolume=undefined;}}
 guide(name,force=false){
  if(!this.sfxEnabled||typeof Audio==='undefined'||(!force&&Date.now()-(this.lastGuide||0)<15000))return;
  this.stopGuide();this.lastGuide=Date.now();const clip=new Audio('assets/guidance/'+name+'.mp3');this.guideClip=clip;clip.volume=0;
  if(this.music){this.guideMusicVolume=this.musicLevel;this.setMusicVolume(.04);}
  this.guideFade=setInterval(()=>{if(this.guideClip!==clip)return;clip.volume=Math.min(.55,clip.volume+.055);if(clip.volume>=.55)clearInterval(this.guideFade)},25);
  clip.onended=clip.onerror=()=>{if(this.guideClip===clip)this.stopGuide()};
  clip.play().catch(()=>{if(this.guideClip===clip)this.stopGuide()});
 }
 finish(){this.raceActive=false;this.soundscape.stop();if(this.music)this.setMusicVolume(.12);}
 toggleMusic(){this.musicEnabled=!this.musicEnabled;if(this.musicEnabled){this.running=true;this.playMusic()}else this.music?.pause();return this.musicEnabled;}
 toggleSfx(){this.sfxEnabled=!this.sfxEnabled;if(!this.sfxEnabled){this.soundscape.stop();this.stopVictory();this.stopGuide();this.stopCountdownVoice();}if(this.sfxEnabled){this.unlock();if(this.raceActive)this.soundscape.start();}return this.sfxEnabled;}
 update(state){this.soundscape.update(state);}
 tone(f=660,d=.12,type='sine',volume=.07,end=f*1.4,delay=0){
  if(!this.sfxEnabled)return;this.unlock();const c=this.context;if(!c||!this.master)return;
  const now=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,now);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+d);
  g.gain.setValueAtTime(.001,now);g.gain.exponentialRampToValueAtTime(Math.max(.002,volume),now+.006);g.gain.exponentialRampToValueAtTime(.001,now+d);
  o.connect(g);g.connect(this.master);o.onended=()=>{o.disconnect();g.disconnect()};o.start(now);o.stop(now+d+.01);
 }
 noise(duration,volume,startHz,endHz,type='lowpass'){
  if(!this.sfxEnabled)return;this.unlock();const c=this.context;if(!c||!this.master)return;
  const b=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);
  const src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),now=c.currentTime;src.buffer=b;filter.type=type;filter.Q.value=.7;filter.frequency.setValueAtTime(startHz,now);filter.frequency.exponentialRampToValueAtTime(endHz,now+duration);
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(volume,now+.012);gain.gain.exponentialRampToValueAtTime(.001,now+duration);src.connect(filter);filter.connect(gain);gain.connect(this.master);src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect()};src.start();src.stop(now+duration);
 }
 effect(kind,intensity=1){
  const v=Math.max(.35,Math.min(1,intensity));
  if(kind==='boost'){this.noise(.85,.2,350,3400,'bandpass');this.tone(95,.65,'sawtooth',.06,380);this.tone(880,.25,'sine',.045,1320,.25);}
  else if(kind==='shot'){this.tone(1250,.22,'triangle',.1,230);this.noise(.13,.09,2200,700,'bandpass');}
  else if(kind==='rock'){this.tone(115,.28,'sine',.3*v,35);this.noise(.24,.28*v,900,170);}
  else if(kind==='kart'){this.tone(220,.14,'triangle',.19*v,75);this.noise(.095,.16*v,1800,650,'bandpass');}
  else if(kind==='crystal'){this.tone(988,.23,'sine',.075,1047);this.tone(1480,.28,'sine',.055,1568,.08);}
  else if(kind==='recover'){this.tone(350,.18,'sine',.065,520);this.tone(700,.24,'sine',.055,880,.12);}
  else {this.tone(523,.32,'sine',.06,523);this.tone(659,.3,'sine',.055,659,.08);this.tone(784,.3,'sine',.05,784,.16);}
 }
}
