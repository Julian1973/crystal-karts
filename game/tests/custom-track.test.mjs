import assert from 'node:assert/strict';
import {templateTrack,encodeTrack,decodeTrack,validateTrack,normaliseTrack,cleanName,BUILDER_THEMES,LIMITS} from '../public/custom-track.js';
import {TRACKS} from '../public/tracks.js';
for(const id of Object.keys(BUILDER_THEMES))assert(TRACKS[id],'theme '+id+' is a real course');
const t=templateTrack();assert(validateTrack(t.points).ok,'the starter track is raceable: '+validateTrack(t.points).problems);
// Limits are calibrated so every real course would be allowed, except River's signature hairpin.
for(const [id,c] of Object.entries(TRACKS))if(id!=='river')assert(validateTrack(c.points).ok,id+' (a real course) passes the builder rules: '+validateTrack(c.points).problems);
const code=encodeTrack({...t,name:'Luna’s Loop'});assert(/^[A-Za-z0-9_-]+$/.test(code)&&code.length<600,'short, URL-safe share code');
const back=decodeTrack(code);assert.equal(back.name,'Luna’s Loop');assert.deepEqual(back.points,t.points);assert.equal(back.theme,'wood');
assert.equal(decodeTrack('not a code!'),null);assert.equal(decodeTrack(''),null);assert.equal(decodeTrack('x'.repeat(2000)),null);
assert.equal(cleanName('<script>alert(1)</script>'),'scriptalert(1)/script','no HTML in names');assert.equal(cleanName('   '),'My Crystal Track');
const wild=normaliseTrack({theme:'mars',points:[[9999,-5,'a'],[1,99,2]]});assert.equal(wild.theme,'wood');assert.deepEqual(wild.points,[[LIMITS.extent,0,0],[1,LIMITS.maxHeight,2]]);
assert(!validateTrack(t.points.slice(0,4)).ok,'too few points');
const tiny=t.points.map(([x,y,z])=>[x/5,y,z/5]);assert(validateTrack(tiny).problems.includes('Make the loop bigger'));
const pinched=t.points.map(p=>[...p]);pinched[2]=[-140,4,10];assert(!validateTrack(pinched).ok,'crossing or pinched roads are rejected');
const bad=encodeTrack({...t,points:tiny});assert.equal(decodeTrack(bad),null,'invalid shared tracks are refused');
console.log('Track Builder: themes, starter track, real courses pass, share codes, safe names, bounds, and overlap/size/bend checks passed.');
