import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createWinnerVideo,WINNER_IDS} from '../public/winner-video.js';
function setup(){
 globalThis.document={hidden:false,addEventListener(){}};globalThis.window={addEventListener(){}};
 const events={},classes=new Set();const video={hidden:true,paused:true,src:'',currentTime:0,playCount:0,pause(){this.paused=true},load(){},removeAttribute(k){delete this[k]},setAttribute(){},addEventListener(k,f){events[k]=f},async play(){this.playCount++;if(this.blocked)throw Error('NotAllowedError');this.paused=false}};
 const button={classList:{remove(){}},textContent:''},status={textContent:''},container={classList:{add(k){classes.add(k)},remove(k){classes.delete(k)}}};
 const audio={sfxEnabled:true,stopVictory(){this.stopped=true},music:{pause(){}}};
 return {video,button,status,audio,controller:createWinnerVideo({video,button,status,container,audio})};
}
test('Every racer has a video and poster',()=>{assert.equal(WINNER_IDS.length,9);for(const id of WINNER_IDS)for(const ext of ['mp4','jpg'])assert.ok(existsSync(`public/assets/winners/${id}.${ext}`));});
test('Actual winner selects correct video and replay rewinds',async()=>{const x=setup();x.controller.show({id:'zenny',name:'Zenny'});await Promise.resolve();assert.equal(x.video.src,'assets/winners/zenny.mp4');assert.equal(x.audio.stopped,true);x.video.currentTime=12;x.button.onclick();assert.equal(x.video.currentTime,0);assert.equal(x.video.playCount,2);x.controller.stop();assert.equal(x.video.paused,true);assert.equal(x.video.hidden,true);assert.equal(x.video.src,undefined);});
test('Blocked autoplay gives a working manual play action',async()=>{const x=setup();x.video.blocked=true;x.controller.show({id:'keen',name:'Keen'});await Promise.resolve();await Promise.resolve();assert.match(x.button.textContent,/Play/);x.video.blocked=false;x.button.onclick();await Promise.resolve();assert.equal(x.video.paused,false);});
test('SFX off mutes the movie; stopping ignores a late play rejection',async()=>{const x=setup();x.audio.sfxEnabled=false;x.video.blocked=true;x.controller.show({id:'aida',name:'Aida'});assert.equal(x.video.muted,true);x.controller.stop();await Promise.resolve();await Promise.resolve();assert.equal(x.status.textContent,'');});
