import assert from 'node:assert/strict';
import {PARTY_BEARS,PARTY_TRACKS,validRoomCode,controllerURL,readControllerParams,tiltToSteer,partyViewports,qrSVG} from '../public/party.js';
import qrcode from '../public/assets/utils/qrcode.mjs';
import {TRACKS} from '../public/tracks.js';
import {COUNTDOWN_BEAR_IDS} from '../public/countdown-voice.js';
import {readFile} from 'node:fs/promises';
assert.deepEqual(PARTY_BEARS.map(b=>b[0]),[...COUNTDOWN_BEAR_IDS],'bear order matches the room bear indices');
const game=await readFile(new URL('../public/game.js',import.meta.url),'utf8');assert(game.indexOf("id:'keen'")<game.indexOf("id:'aida'")&&game.indexOf("id:'luna'")<game.indexOf("id:'zenny'"),'game character order unchanged');
assert.deepEqual([...PARTY_TRACKS].sort(),Object.keys(TRACKS).sort(),'every course can host a party');
const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');for(const id of PARTY_TRACKS)assert(worker.includes(`'${id}'`),'server accepts '+id);
assert(validRoomCode('ab2c3d')&&!validRoomCode('ABC1O0')&&!validRoomCode('ABC'),'room codes use the server alphabet');
const url=controllerURL('https://crystal.example/karts/','ab2c3d','river');assert.equal(url,'https://crystal.example/karts/controller.html?room=AB2C3D&track=river');
assert.deepEqual(readControllerParams(new URL(url).search),{code:'AB2C3D',track:'river'});assert.deepEqual(readControllerParams('?room=bad&track=mars'),{code:'',track:'wood'});
assert.deepEqual(tiltToSteer(3),{left:false,right:false},'dead zone');assert.deepEqual(tiltToSteer(-20),{left:true,right:false});assert.deepEqual(tiltToSteer(25),{left:false,right:true});assert.deepEqual(tiltToSteer(NaN),{left:false,right:false});
for(const n of [1,2,3,4]){const v=partyViewports(n,1600,900);assert.equal(v.length,n);const area=v.reduce((a,[,,w,h])=>a+w*h,0);assert(area<=1600*900+1);for(const [x,y,w,h] of v)assert(x>=0&&y>=0&&x+w<=1600&&y+h<=900);}
assert.equal(partyViewports(9,100,100).length,4,'at most four views');assert.deepEqual(partyViewports(2,400,800),[[0,400,400,400],[0,0,400,400]],'portrait screens stack');
const svg=qrSVG(qrcode,url);assert(svg.startsWith('<svg')&&svg.includes('path'),'QR code renders as SVG');
console.log('Party mode: bear/room order, all courses, room codes, controller links, tilt steering, split-screen layouts and QR SVG passed.');
