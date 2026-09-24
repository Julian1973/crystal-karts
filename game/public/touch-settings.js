// Phone control preferences and helpers: steering feel, auto-drive, auto-drift and vibration.
export const TOUCH_SETTINGS_KEY='kart-touch-settings-v1';
// reach: how far (CSS px) the thumb travels for full lock; curve: >1 gives finer control near centre.
export const STEER_PROFILES=Object.freeze({gentle:{reach:72,curve:1.6,label:'Gentle'},normal:{reach:54,curve:1.35,label:'Normal'},quick:{reach:38,curve:1.15,label:'Quick'}});
export const TOUCH_DEFAULTS=Object.freeze({sensitivity:'normal',autoDrive:false,autoDrift:true,vibrate:true});
export function cleanTouchSettings(s){return {sensitivity:Object.hasOwn(STEER_PROFILES,s?.sensitivity)?s.sensitivity:TOUCH_DEFAULTS.sensitivity,autoDrive:typeof s?.autoDrive==='boolean'?s.autoDrive:TOUCH_DEFAULTS.autoDrive,autoDrift:typeof s?.autoDrift==='boolean'?s.autoDrift:TOUCH_DEFAULTS.autoDrift,vibrate:typeof s?.vibrate==='boolean'?s.vibrate:TOUCH_DEFAULTS.vibrate};}
export function loadTouchSettings(storage=globalThis.localStorage){try{return cleanTouchSettings(JSON.parse(storage?.getItem(TOUCH_SETTINGS_KEY)||'{}'));}catch{return {...TOUCH_DEFAULTS};}}
export function saveTouchSettings(s,storage=globalThis.localStorage){try{storage?.setItem(TOUCH_SETTINGS_KEY,JSON.stringify(cleanTouchSettings(s)));return true;}catch{return false;}}
// Floating stick: dx is the thumb's distance from where it first touched down.
export function steerFromDrag(dx,profile=STEER_PROFILES.normal){const raw=Math.max(-1,Math.min(1,dx/profile.reach)),m=Math.abs(raw);return Math.sign(raw)*Math.pow(Math.max(0,(m-.08)/.92),profile.curve);}
// Auto-drift: holding near full lock at speed for a moment starts a drift; easing off ends it.
export function stepAutoDrift(state,{steer=0,throttle=false,speed=0,dt=0}){
 const hard=Math.abs(steer)>=.85&&throttle&&speed>14;
 if(state.drifting){if(Math.abs(steer)<.5||!throttle||speed<10){state.drifting=false;state.hold=0;}return state.drifting;}
 state.hold=hard?(state.hold||0)+dt:0;if(state.hold>=.3)state.drifting=true;return state.drifting;
}
export const HAPTICS=Object.freeze({boost:[18],crystal:[12],shot:[40,30,40],rock:[60],kart:[25],skill:[20,20,20]});
export function buzz(kind,settings,nav=globalThis.navigator){const pattern=HAPTICS[kind];if(!pattern||!settings?.vibrate||typeof nav?.vibrate!=='function')return false;try{return nav.vibrate(pattern)!==false;}catch{return false;}}
