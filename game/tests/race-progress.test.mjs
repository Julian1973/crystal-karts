import assert from 'node:assert/strict';
import {updateProgress,displayedLap} from '../public/race-progress.js';
const r={s:0},leader={s:0};
const move=(r,s)=>{const old=r.s;r.s=s;updateProgress(r,old,100)};
move(r,25);move(r,50);move(r,75);move(r,101);
assert.equal(displayedLap(r),2);
move(leader,205); // Another racer laps the player.
assert.equal(r.completedLaps,1);
move(r,95);assert.equal(displayedLap(r),2,'backward collision or recovery never removes a lap');
move(r,101);assert.equal(r.completedLaps,1,'recrossing cannot award another lap');
move(r,200);assert.equal(r.completedLaps,2);
move(r,150);move(r,201);assert.equal(r.completedLaps,2);
move(r,300);assert.equal(r.completedLaps,3);
assert.equal(displayedLap(r),3);
console.log('Passed: lapping independence, backward recovery, seam recrossing and three-lap finish.');
