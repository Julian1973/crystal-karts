// Crystal and trait pairings: Character Bible Nov 25, page 9.
// Skills below are game adaptations of those established traits.
export const CRYSTALS={
 keen:{crystal:'Aquamarine',trait:'Courage',color:0x6fefff,symbol:'➜',skill:'Boost',duration:3,description:'An instant forward kick, then three seconds of extra speed.'},
 aida:{crystal:'Rose Quartz',trait:'Confidence',color:0xffa5d0,skill:'Confidence shield',duration:7,description:'Cushion kart bumps and resist being knocked off course.'},
 sunny:{crystal:'Citrine',trait:'Joy',color:0xffd34f,skill:'Joy surge',duration:6,description:'Accelerate faster and keep a little extra speed.'},
 misty:{crystal:'Moonstone',trait:'Trust',color:0xeaf8ff,symbol:'◇',skill:'Phase',duration:4,description:'Drive through rocks and other karts for four seconds. You still steer.'},
 amie:{crystal:'Amethyst',trait:'Understanding',color:0xac6bed,symbol:'✦',skill:'Homing crystal',duration:.35,description:'Locks onto a rival and follows them into a spin-out.'},
 howey:{crystal:'Howlite',trait:'Kindness',color:0xf9f3e7,skill:'Kindness lift',duration:6,description:'Give yourself and a nearby bear quicker acceleration.'},
 luna:{crystal:'Lepidolite',trait:'Calm',color:0xc4a5eb,skill:'Calm focus',duration:8,description:'Stronger tyre grip and gentler steering through bends.'},
 zenny:{crystal:'Honey Citrine',trait:'Playful',color:0xf5c447,skill:'Buzzy boost',duration:3.5,description:'A cheerful burst of speed with a playful zig-zag.'},
 fuzzby:{crystal:'Golden Amber',trait:'Playful',color:0xe5a52a,skill:'Bumble bounce',duration:4,description:'A bouncy bubble protects your kart and adds a little speed.'}
};
export const PICKUP_COUNT=9;
export function collectCrystal(r,p,lap){
 if(lap<0||lap>=3||!CRYSTALS[r.id]||p.usedLap>=lap||r.powerCharge>=3)return false;
 p.usedLap=lap;r.powerCharge=Math.min(3,(r.powerCharge||0)+1);r.heldPower=r.id;return true;
}
export function activateSkill(r,racers,length){
 if(r.powerCharge<3||!CRYSTALS[r.id]||r.powerTime>0)return false;
 r.powerCharge=0;r.activePower=r.id;r.heldPower=null;r.powerTime=CRYSTALS[r.activePower].duration;
 if(r.activePower==='keen'||r.activePower==='sunny'){r.stun=0;r.driveSpeed=Math.max(0,r.driveSpeed||0)+(r.activePower==='keen'?12:7);r.speed=Math.max(0,r.speed||0)+(r.activePower==='keen'?12:7);}
 if(r.activePower==='amie')r.pendingShot=true;
 if(r.activePower==='zenny'){r.playfulTime=r.powerTime;r.stun=0;r.driveSpeed=Math.max(0,r.driveSpeed||0)+4;r.speed=Math.max(0,r.speed||0)+4;}
 if(r.activePower==='fuzzby'){r.bubbleTime=r.powerTime;r.driveSpeed=(r.driveSpeed||0)+3;r.speed=(r.speed||0)+3;}
 if(r.activePower==='howey'){
  r.stun=0;const distance=o=>Math.abs(((o.s-r.s+length/2)%length+length)%length-length/2);
  const friend=racers.filter(o=>o!==r&&distance(o)<30).sort((a,b)=>distance(a)-distance(b))[0];
  if(friend){friend.friendTime=6;friend.stun=0}
 }
 return true;
}
export function skillEffects(r){
 const active=r.powerTime>0,id=active?r.activePower:'';
 return {burst:id==='keen'||id==='zenny',shield:id==='aida'||id==='fuzzby'||id==='rainbow'||r.bubbleTime>0||(r.starTime||0)>0,joy:id==='sunny',shot:id==='amie',phase:id==='misty',guide:false,sense:false,kindness:id==='howey'||r.friendTime>0,calm:id==='luna',playful:id==='zenny',star:(r.starTime||0)>0};
}
