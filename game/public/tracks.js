import {Vector3,CatmullRomCurve3,CubicBezierCurve3} from './assets/three.module.js?v=75';
export const TRACKS={wood:{name:'Whisper Wood',points:[[0,0,105],[75,2,98],[132,5,43],[146,8,-38],[95,10,-103],[20,7,-112],[-32,4,-63],[-105,2,-83],[-153,0,-22],[-130,1,58],[-62,0,107]]},river:{name:'Crystal River Run',points:[[0,0,110],[65,1,110],[120,7,65],[130,10,0],[118,7,-65],[65,1,-110],[0,1,-65],[-55,2,-120],[-125,4,-90],[-142,2,-15],[-75,1,5],[-135,0,70],[-65,0,115]]}};
Object.assign(TRACKS,{
 night:{name:'Starlight Forest Run',night:true,description:'Night racing · lantern trails · winding woodland climbs',points:[[0,2,120],[75,5,105],[110,12,45],[165,16,0],[120,11,-65],[50,5,-105],[0,8,-65],[-65,16,-130],[-140,12,-70],[-100,6,-10],[-155,3,55],[-65,2,115]]},
 honey:{name:'Honey Hill Circuit',description:'Golden meadows · rolling hills · sweeping bends',points:[[0,1,105],[80,3,115],[150,9,60],[105,16,0],[150,12,-65],[60,5,-115],[-15,2,-80],[-85,8,-120],[-145,13,-50],[-95,5,15],[-140,2,75],[-60,1,115]]},
 moon:{name:'Moonlight Pool',description:'Twilight lakeside · tight turns · glowing lanterns',points:[[0,2,115],[75,2,100],[135,4,50],[85,5,5],[140,5,-55],[75,4,-110],[0,3,-125],[-70,2,-100],[-125,3,-40],[-80,4,10],[-130,3,70],[-55,2,110]]},
 coast:{name:'Crystal Coast',description:'Turquoise sea · cliff climbs · fast coastal curves',points:[[0,3,110],[90,4,100],[150,12,40],[125,22,-30],[65,27,-95],[-10,18,-120],[-75,8,-70],[-135,3,-100],[-155,2,-10],[-125,2,65],[-65,3,110]]}
});
TRACKS.wood.description='Past the Great Oak · woodland bends';TRACKS.river.description='Timber bridge · two jumps · two narrow shortcuts';

Object.assign(TRACKS,{
 rose:{name:'Aida’s Rose Garden',owner:'aida',description:'Rose gardens · gentle climbing curves · pearl arches',points:[[0,2,120],[88,4,100],[155,8,30],[120,10,-45],[60,7,-118],[-15,3,-135],[-82,5,-100],[-150,8,-35],[-130,5,55],[-60,2,118]]},
 blossom:{name:'Amie’s Blossom Trail',owner:'amie',description:'Pink blossom · playful S-bends · flower meadows',points:[[0,1,100],[60,3,130],[125,5,85],[100,8,20],[155,9,-40],[80,5,-110],[0,2,-85],[-70,4,-130],[-150,7,-65],[-100,4,0],[-135,2,75],[-65,1,100]]},
 zen:{name:'Zenny’s Lotus Gardens',owner:'zenny',description:'Lotus ponds · bamboo groves · flowing bends',points:[[0,1,120],[100,2,108],[145,3,40],[95,4,-20],[140,3,-80],[55,2,-140],[-35,2,-110],[-130,4,-100],[-155,5,-20],[-105,3,45],[-65,1,110]]},
 cove:{name:'Crystal Cove Grand Tour',owner:'all',description:'Ten-course finale · sweeping climbs · rainbow gardens',points:[[0,3,150],[100,5,145],[190,14,80],[155,24,0],[205,20,-70],[100,10,-155],[0,7,-110],[-95,17,-180],[-185,24,-100],[-140,16,-20],[-205,8,70],[-95,3,150]]}
});
const owners={wood:'howey',river:'keen',honey:'fuzzby',moon:'misty',coast:'sunny',night:'luna'};
TRACKS.showcase={name:'Crystal Bears Showcase',owner:'all',description:'Sunlit coastal woodland · bee cottages · crystal gardens',points:[[0,2,110],[75,3,105],[145,4,60],[150,5,-15],[115,4,-95],[40,3,-120],[-35,3,-110],[-115,4,-85],[-145,5,-15],[-130,4,65],[-65,2,115]]};
for(const [id,owner] of Object.entries(owners))TRACKS[id].owner=owner;
// Course layout shared with game.js (rocks, crystals, boost pads, secret shard) so jumps land on clear road.
export const ROCK_LAYOUT=Object.freeze([.19,.34,.49,.67,.84]),PAD_LAYOUT=Object.freeze([.13,.39,.66,.87]);
export const pickupLayout=count=>Array.from({length:count},(_,i)=>.055+i/count*.91);
export const secretShardLayout=index=>.19+(index%7)*.085;
// Up to two jumps per course on the straightest clear stretches, spread apart. Tracks with one clear stretch get one.
export function chooseRamps(curve,length,routes=[],trackIndex=0,count=2){
 const objects=[...ROCK_LAYOUT,...PAD_LAYOUT,...pickupLayout(9),secretShardLayout(trackIndex)].map(u=>u*length);
 const blocked=[[0,.08*length],[.93*length,length],...routes.filter(Boolean).map(r=>[r.a-60,r.b+10])];
 // Ground height plus the 1.6 ramp lip that frame() adds at take-off.
 const groundAt=s=>curve.getPointAt((((s/length)%1)+1)%1).y;
 // Same ballistic arc as jumpStep, flown at a fast boosted speed so every slower jump is covered too.
 const landing=at=>{let y=groundAt(at)+1.6+1.7,v=7.8,s=at;for(let i=0;i<600;i++){s+=52/120;v-=18/120;y+=v/120;if(y<=groundAt(s)&&v<0)break;}return s;};
 const yaw=s=>{const t=curve.getTangentAt((((s/length)%1)+1)%1);return Math.atan2(t.x,t.z)};const turn=(a,b)=>Math.abs(Math.atan2(Math.sin(b-a),Math.cos(b-a)));
 const candidates=[];for(let at=.08*length;at<.93*length;at+=2){if(blocked.some(([a,b])=>at>=a&&at<=b))continue;const land=landing(at);if(land>.99*length||objects.some(o=>o>at-3&&o<land+6))continue;candidates.push({at,bend:turn(yaw(at-18),yaw(at))+turn(yaw(at),yaw(land))});}
 candidates.sort((a,b)=>a.bend-b.bend);const chosen=[];for(const c of candidates){if(chosen.every(at=>Math.abs(at-c.at)>=.15*length))chosen.push(c.at);if(chosen.length===count)break;}
 return chosen.sort((a,b)=>a-b).map(at=>at/length);
}
export function makeTrack(id){
 const config=TRACKS[id]||TRACKS.wood,curve=new CatmullRomCurve3(config.points.map(p=>new Vector3(...p)),true,'catmullrom',.35),length=curve.getLength();
 const makeShortcut=([a,b],i)=>{const start=curve.getPointAt(a),end=curve.getPointAt(b),distance=start.distanceTo(end),path=new CubicBezierCurve3(start,start.clone().addScaledVector(curve.getTangentAt(a),distance*.18),end.clone().addScaledVector(curve.getTangentAt(b),-distance*.18),end);return {id:i+1,a:a*length,b:b*length,path,ratio:(b-a)*length/path.getLength()}};
 let sections=id==='river'?[[.36,.52],[.68,.84]]:[];
 if(id!=='river'){let best=null;for(let a=.12;a<.82;a+=.025)for(let span=.075;span<=.18;span+=.025){const b=a+span;if(b>.94||(a<.65&&b>.54))continue;const route=makeShortcut([a,b],0);if(!best||route.ratio>best.ratio)best=route;}sections=best?[[best.a/length,best.b/length]]:[[.3,.4]];}
 const shortcuts=sections.map(makeShortcut);
 const ra=.54,rb=.65,rs=curve.getPointAt(ra),re=curve.getPointAt(rb),rd=rs.distanceTo(re),rp=new CubicBezierCurve3(rs,rs.clone().addScaledVector(curve.getTangentAt(ra),rd*.22),re.clone().addScaledVector(curve.getTangentAt(rb),-rd*.22),re);
 const rushRoute={id:90,a:ra*length,b:rb*length,path:rp,ratio:(rb-ra)*length/rp.getLength()};
 const ramps=id==='river'?[.215*length,.62*length]:chooseRamps(curve,length,[...shortcuts,rushRoute],Object.keys(TRACKS).indexOf(id)).map(u=>u*length);
 function frame(s,lateral=0,route=0,target={p:new Vector3(),t:new Vector3(),right:new Vector3()}){const wrapped=(s%length+length)%length;let branch=null;for(const candidate of shortcuts){if(candidate.id===route&&wrapped>=candidate.a&&wrapped<=candidate.b){branch=candidate;break}}if(!branch&&rushRoute?.id===route&&wrapped>=rushRoute.a&&wrapped<=rushRoute.b)branch=rushRoute;const u=branch?(wrapped-branch.a)/(branch.b-branch.a):wrapped/length,path=branch?branch.path:curve,p=path.getPointAt(u,target.p),t=path.getTangentAt(u,target.t).normalize(),right=target.right.set(t.z,0,-t.x).normalize();p.addScaledVector(right,lateral);if(!branch)for(const ramp of ramps){const d=wrapped-ramp;if(d>=-8&&d<=0)p.y+=1.6*(1+d/8);else if(d>0&&d<6)p.y+=1.6*(1-d/6);}return target}
 return {id,...config,curve,length,shortcuts,rushRoute,ramps,frame};
}
export function routeStep(r,oldS,track){
 const lap=Math.floor(oldS/track.length),old=(oldS%track.length+track.length)%track.length;
 if(r.route){const b=[...track.shortcuts,...(track.rushRoute?[track.rushRoute]:[])].find(b=>b.id===r.route);if(b){r.s=oldS+(r.s-oldS)*b.ratio;if(r.s>=lap*track.length+b.b||r.s<lap*track.length+b.a)r.route=0}else r.route=0;}
 else if(track.rushRoute&&r.rushEligible&&!r.rushAttempted&&old<track.rushRoute.a&&r.s>=lap*track.length+track.rushRoute.a){r.rushAttempted=true;if(lap===2&&Math.abs(r.lane-5)<.65&&r.speed>=22&&!r.airborne)r.route=90;}
 else for(const b of track.shortcuts)if(old<b.a&&r.s>=lap*track.length+b.a&&Math.abs(r.lane-5)+(r.halfWidth||1.55)<=2.1&&!r.airborne&&r.speed>0){r.route=b.id;break;}
}
export function jumpStep(r,oldS,dt,track){
 const ground=track.frame(r.s,r.lane,r.route).p.y;
 if(!r.airborne){for(const ramp of track.ramps){const at=Math.floor(oldS/track.length)*track.length+ramp;if(oldS<at&&r.s>=at&&r.speed>=18&&!r.route){r.airborne=true;r.jumpY=ground+1.7;r.jumpV=7.8;r.jumpStart=r.s;break;}}}
 if(r.airborne){r.jumpV-=18*dt;r.jumpY+=r.jumpV*dt;r.airHeight=Math.max(0,r.jumpY-ground);if(r.jumpY<=ground&&r.jumpV<0){r.airborne=false;r.airHeight=0;r.landingTime=.35;}}
 else r.airHeight=0;
 r.landingTime=Math.max(0,(r.landingTime||0)-dt);
}
