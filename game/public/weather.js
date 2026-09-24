// One shower, triggered partway through lap two. Race time freezes on pause.
export function createWeather(){return {started:false,age:0,phase:'sunny',rain:0,wetness:0};}
export function stepWeather(w,dt,progress){
 if(!w.started&&progress>=1.2){w.started=true;w.phase='rain';}
 if(!w.started)return w;
 w.age+=dt;
 w.rain=w.age<18?Math.min(1,w.age/3):Math.max(0,1-(w.age-18)/3);
 w.wetness=w.age<21?Math.min(1,w.age/4):Math.max(0,1-(w.age-21)/12);
 w.phase=w.age<21?'rain':w.wetness>0?'drying':'sunny';
 return w;
}
export function traction(w,calm=false){return 1-w.wetness*(calm?.25:.65);}
