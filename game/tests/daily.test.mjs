import assert from 'node:assert/strict';
import {dailyCourse,dailyComplete,nextStreak,DAILY_GOALS,DAILY_TRACKS,DAILY_BEARS} from '../public/daily.js';
import {dailyFor,completeDaily} from '../public/progression.js';
import {TRACKS} from '../public/tracks.js';
import {PARTY_BEARS} from '../public/party.js';
assert.deepEqual([...DAILY_TRACKS].sort(),Object.keys(TRACKS).sort());assert.deepEqual(DAILY_BEARS.map(b=>b[0]),PARTY_BEARS.map(b=>b[0]),'bear indices match the game');
const day=new Date('2026-09-24T08:00:00Z'),same=new Date('2026-09-24T23:30:00Z');assert.deepEqual(dailyCourse(day),dailyCourse(same),'everyone gets the same course all day (UTC)');
const seen={tracks:new Set(),bears:new Set(),goals:new Set()};for(let i=0;i<120;i++){const d=dailyCourse(new Date(Date.UTC(2026,0,1+i)));seen.tracks.add(d.track);seen.bears.add(d.bear);seen.goals.add(d.goal);assert(d.title.includes('Day')&&d.text.length>5);}
assert.equal(seen.tracks.size,11,'every course comes up');assert.equal(seen.bears.size,9,'every bear gets a day');assert.equal(seen.goals.size,Object.keys(DAILY_GOALS).length,'every goal comes up');
const d=dailyCourse(day),base={track:d.track,bear:d.bear,rank:1,crystals:9,shortcut:true,heart:1,resonance:1,garden:d.garden,gardenScore:12};
assert(dailyComplete(d,base),'the goal can be met');assert(!dailyComplete(d,{...base,track:d.track==='wood'?'river':'wood'}),'must be on today’s course');assert(!dailyComplete(d,{...base,bear:(d.bear+1)%9}),'must race as today’s bear');
assert(!DAILY_GOALS.podium.check({rank:4})&&DAILY_GOALS.garden.check({garden:true,gardenScore:10})&&!DAILY_GOALS.garden.check({garden:false,gardenScore:50}));
assert.equal(nextStreak({},'2026-09-24'),1);assert.equal(nextStreak({date:'2026-09-23',done:true,streak:4},'2026-09-24'),5,'consecutive days grow the streak');assert.equal(nextStreak({date:'2026-09-21',done:true,streak:4},'2026-09-24'),1,'a missed day restarts');assert.equal(nextStreak({date:'2026-02-28',done:true,streak:2},'2026-03-01'),3,'month boundary');
const p={coins:0,daily:{date:'2026-09-23',done:true,streak:2}},f=dailyFor(day);assert.equal(completeDaily(p,f.id,day),35);assert.equal(p.daily.streak,3);assert.equal(completeDaily(p,f.id,day),0,'once per day');
console.log('Today’s Crystal Cove: same course for everyone, all courses/bears/goals rotate, goal checks, course and bear rules, streaks and rewards passed.');
