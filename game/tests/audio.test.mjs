import assert from 'node:assert/strict';
import {RaceAudio} from '../public/audio.js';
class Music {constructor(src){this.src=src;this.playCount=0;this.paused=true;}play(){this.playCount++;this.paused=false;return Promise.resolve()}pause(){this.paused=true}}
const events=[];const param=()=>({value:0,setValueAtTime(v){events.push(['set',v])},exponentialRampToValueAtTime(v){events.push(['ramp',v])},linearRampToValueAtTime(v){events.push(['linear',v])}});
const node=()=>({connect(){},disconnect(){},start(){events.push(['start'])},stop(){},frequency:param(),gain:param(),Q:param()});
class Context {constructor(){this.state='running';this.currentTime=0;this.sampleRate=22050;this.destination={}}resume(){this.state='running';return Promise.resolve()}suspend(){this.state='suspended';return Promise.resolve()}createDynamicsCompressor(){return{...node(),threshold:param(),ratio:param()}}createOscillator(){return node()}createGain(){return node()}createBuffer(_,n){return{getChannelData:()=>new Float32Array(n)}}createBufferSource(){return node()}createBiquadFilter(){return node()}}
globalThis.Audio=Music;globalThis.AudioContext=Context;
const audio=new RaceAudio();assert.equal(audio.music,null,'music waits for interaction');audio.start();assert(audio.music.loop&&audio.music.playCount===1);assert.equal(audio.music.src,'assets/music/wood.mp3');audio.pause();assert(audio.music.paused);audio.resume();assert(!audio.music.paused);audio.toggleMusic();assert(audio.music.paused);audio.toggleMusic();assert(!audio.music.paused);
const signatures=[];for(const effect of ['boost','rock','kart']){events.length=0;audio.effect(effect);assert(events.some(e=>e[0]==='start'));signatures.push(JSON.stringify(events));}assert(new Set(signatures).size===3,'boost, rock and kart are distinct effects');
audio.toggleSfx();events.length=0;audio.effect('rock');assert.equal(events.length,0,'effects mute independent from music');audio.stop();assert(audio.music.paused&&audio.music.currentTime===0);
console.log('Passed: gesture-started looping theme, pause/resume, independent mute and distinct boost/rock/kart audio schedules.');
for(const course of ['wood','river','night','honey','moon','coast','rose','blossom','zen','cove','showcase']){
 globalThis.location={search:'?track='+course};
 const player=new RaceAudio();player.start();assert.equal(player.music.src,'assets/music/'+course+'.mp3');
 player.music.onerror();assert.equal(player.music.src,'assets/crystal-karting.mp3');assert.equal(player.music.onerror,null);
}
delete globalThis.location;
const voiceAudio=new RaceAudio();voiceAudio.start();voiceAudio.playVictory('assets/voices/keen-victory.mp3');const clip=voiceAudio.victory;assert(clip);assert.equal(voiceAudio.music.volume,.04);voiceAudio.playVictory(clip.src);assert.equal(voiceAudio.victory,clip,'winner line plays once');voiceAudio.toggleSfx();assert(clip.paused);assert.equal(voiceAudio.victory,null);assert.equal(voiceAudio.music.volume,.12);voiceAudio.playVictory(clip.src);assert.equal(voiceAudio.victory,null,'SFX mute suppresses voices');

Context.prototype.createMediaElementSource=function(){return node()};
const mobileAudio=new RaceAudio();mobileAudio.start();assert.equal(mobileAudio.music.volume,1);assert.equal(mobileAudio.musicGain.gain.value,.18,'music attenuation uses Web Audio gain on mobile');mobileAudio.context.state='interrupted';mobileAudio.unlock();assert.equal(mobileAudio.context.state,'running');mobileAudio.playVictory('test.mp3');assert.equal(mobileAudio.musicGain.gain.value,.04);mobileAudio.stopVictory();assert.equal(mobileAudio.musicGain.gain.value,.12);
