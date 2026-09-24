// Versioned rules keep challenges comparable after future handling changes.
export const TRIAL_RULES='crystal-trial-1';
export const COURSE_LENGTHS={wood:858,river:968,night:975,honey:1006,moon:918,coast:891,rose:866,blossom:989,zen:949,cove:1323,showcase:871};
export const raceTime=ms=>Math.max(0,Math.round(ms));
export function displayTime(ms){return Math.floor(ms/60000)+':'+((ms%60000)/1000).toFixed(2).padStart(5,'0');}
export function targets(track){const length=COURSE_LENGTHS[track];return {gold:Math.round(length*3/23*1000),silver:Math.round(length*3/19*1000),bronze:Math.round(length*3/15*1000)};}
export function medal(track,ms){if(!COURSE_LENGTHS[track]||!Number.isFinite(ms)||ms<=0)return '';const t=targets(track);return ms<=t.gold?'Gold':ms<=t.silver?'Silver':ms<=t.bronze?'Bronze':'';}
export function validResult(b){return b?.rules===TRIAL_RULES&&!!COURSE_LENGTHS[b.track]&&Number.isInteger(b.bear)&&b.bear>=0&&b.bear<9&&Number.isInteger(b.ms)&&b.ms>COURSE_LENGTHS[b.track]*3/65*1000&&b.ms<=600000&&Array.isArray(b.splits)&&b.splits.length===12&&b.splits.every((x,i)=>Number.isInteger(x)&&x>0&&x<=b.ms&&(!i||x>b.splits[i-1]))&&b.splits.at(-1)===b.ms;}
export function cleanProgress(data){
 const earned=Array.isArray(data?.earned)?[...new Set(data.earned.filter(x=>typeof x==='string'&&/^(racer:[a-z]+|track:[a-z]+|clean|shortcut|crystals|tour|drift|comeback|best)$/.test(x)))].slice(0,40):[];
 return {earned};
}
