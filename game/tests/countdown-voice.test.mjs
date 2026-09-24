import test from 'node:test';
import assert from 'node:assert/strict';
import {COUNTDOWN_BEAR_IDS,countdownVoicePath,preloadCountdownVoice,playCountdownClip} from '../public/countdown-voice.js';

class FakeAudio{
 constructor(){this.listeners={};this.readyState=2;this.plays=0;}
 addEventListener(name,fn){this.listeners[name]=fn;}
 load(){if(FakeAudio.missing.has(this.src))this.listeners.error?.();}
 play(){this.plays++;return Promise.resolve();}
 pause(){}
}
FakeAudio.missing=new Set();

test('chosen bear uses its own approved countdown file',()=>{
 const clip=preloadCountdownVoice('luna',FakeAudio);
 assert.equal(countdownVoicePath('luna'),'assets/voices/countdown/luna.mp3');
 assert.equal(clip.src,'assets/voices/countdown/luna.mp3');
 assert.equal(playCountdownClip(clip,true),true);
 assert.equal(clip.plays,1);
});

test('only the nine racer IDs map to expected recording names',()=>{
 assert.deepEqual(COUNTDOWN_BEAR_IDS,['keen','aida','sunny','misty','amie','howey','luna','zenny','fuzzby']);
 assert.deepEqual(COUNTDOWN_BEAR_IDS.map(countdownVoicePath),COUNTDOWN_BEAR_IDS.map(id=>`assets/voices/countdown/${id}.mp3`));
 assert.equal(countdownVoicePath('unknown'),null);
});

test('missing recording and disabled SFX stay silent',()=>{
 FakeAudio.missing.add('assets/voices/countdown/fuzzby.mp3');
 const missing=preloadCountdownVoice('fuzzby',FakeAudio);
 assert.equal(missing.countdownVoiceMissing,true);
 assert.equal(playCountdownClip(missing,true),false);
 assert.equal(missing.plays,0);
 const available=preloadCountdownVoice('keen',FakeAudio);
 assert.equal(playCountdownClip(available,false),false);
 assert.equal(available.plays,0);
 FakeAudio.missing.clear();
});
