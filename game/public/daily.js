// Today's Crystal Cove: one course, one bear and one goal per day, the same for everyone.
// Goals use the Crystal Bears' own tools (Crystal Heart, Resonance, Garden) as well as racing.
import {RESONANCE_PAIRS} from './resonance.js?v=78';
export const DAILY_TRACKS=Object.freeze(['wood','river','honey','moon','coast','night','rose','blossom','zen','cove','showcase']);
// Room/character order: keen, aida, sunny, misty, amie, howey, luna, zenny, fuzzby.
export const DAILY_BEARS=Object.freeze([['keen','Keen','Brave New Things'],['aida','Aida','Believe in Me'],['sunny','Sunny','Bright Side'],['misty','Misty','Kind Feelings'],['amie','Amie','Silver Lining'],['howey','Howey','Steady Courage'],['luna','Luna','Calm'],['zenny','Zenny','Shake It Off'],['fuzzby','Fuzzby','Bounce Back']]);
const nameOf=id=>DAILY_BEARS.find(b=>b[0]===id)?.[1]||'a friend';
export const DAILY_GOALS=Object.freeze({
 podium:{text:()=>'Finish in the top 3',check:r=>r.rank<=3},
 win:{text:()=>'Win the race',check:r=>r.rank===1},
 crystals:{text:()=>'Collect 8 crystals',check:r=>r.crystals>=8},
 shortcut:{text:()=>'Find and take the hidden shortcut',check:r=>!!r.shortcut},
 heart:{text:b=>'Bounce back with '+nameOf(b)+'’s Crystal Heart',check:r=>r.heart>=1},
 resonance:{text:b=>'Spark a Crystal Resonance'+(RESONANCE_PAIRS[b]?' with '+nameOf(RESONANCE_PAIRS[b]):''),check:r=>r.resonance>=1},
 garden:{text:()=>'Crystal Garden: gather 10 crystals',check:r=>r.garden&&r.gardenScore>=10,garden:true}
});
const GOAL_IDS=Object.keys(DAILY_GOALS);
export const DAILY_REWARD=35;
function hash(text){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
export const dayStamp=(date=new Date())=>date.toISOString().slice(0,10);
export function dailyCourse(date=new Date()){
 const stamp=dayStamp(date),h=hash('crystal-cove:'+stamp),bear=h%9,track=DAILY_TRACKS[Math.floor(h/9)%DAILY_TRACKS.length],goal=GOAL_IDS[Math.floor(h/99)%GOAL_IDS.length];
 const [bearId,bearName,theme]=DAILY_BEARS[bear];
 return {date:stamp,id:'daily-'+stamp,track,bear,bearId,goal,title:bearName+'’s '+theme+' Day',text:DAILY_GOALS[goal].text(bearId),garden:!!DAILY_GOALS[goal].garden,reward:DAILY_REWARD};
}
export function dailyComplete(course,result){return !!course&&result.track===course.track&&result.bear===course.bear&&DAILY_GOALS[course.goal].check(result);}
// Streak counts consecutive days with a completed daily; missing a day starts again at 1.
export function nextStreak(daily={},stamp){if(daily.date===stamp)return daily.streak||1;const y=new Date(stamp+'T12:00:00Z');y.setUTCDate(y.getUTCDate()-1);return daily.done&&daily.date===dayStamp(y)?(daily.streak||1)+1:1;}
