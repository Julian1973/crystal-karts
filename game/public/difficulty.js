export const DIFFICULTIES=Object.freeze({
 easy:{label:'Easy',description:'Gentler rivals · room to learn',pace:.79,steer:2,lookahead:32,acceleration:9,powerDelay:4,mistake:.55,lateBrake:1.7},
 standard:{label:'Standard',description:'A balanced race',pace:1,steer:3,lookahead:45,acceleration:12,powerDelay:1.5,mistake:.16,lateBrake:.4},
 hard:{label:'Hard',description:'Quick rivals · sharper overtaking',pace:1.12,steer:4.2,lookahead:62,acceleration:16,powerDelay:.35,mistake:0,lateBrake:0}
});
export function readDifficulty(){try{const id=localStorage.getItem('kart-difficulty');return Object.hasOwn(DIFFICULTIES,id)?id:'standard'}catch{return 'standard'}}
