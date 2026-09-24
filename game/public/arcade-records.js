export const COUNTRIES='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
export function countryCode(value){return typeof value==='string'&&COUNTRIES.includes(value.toUpperCase())?value.toUpperCase():'';}
export function countrySuggestion(request){return countryCode(request.cf?.country);}
export function recordName(value){
 if(typeof value!=='string')return null;
 const name=value.normalize('NFKC').trim();
 // Single initials/name tag, not full names, links, email addresses or contact details.
 if(!/^[\p{L}][\p{L}\p{M}\p{N}_-]{0,11}$/u.test(name))return null;
 const plain=name.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[013457]/g,n=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t'}[n])).replace(/[_-]/g,'');
 if(/fuck|shit|bitch|cunt|nigger|nigga|penis|porn|nazi|hitler/.test(plain))return null;
 return name;
}
export function countryLabel(code){if(!countryCode(code))return 'Not shown';try{return new Intl.DisplayNames(['en'],{type:'region'}).of(code)||code;}catch{return code;}}
