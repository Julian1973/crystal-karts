import {COUNTRIES,countryLabel,recordName} from './arcade-records.js?v=75';
import {displayTime} from './trial-rules.js?v=75';
export function createArcadeRecords({api,tracks,characters,onSaved}){
 let current=null,own=[],editGeneration=0,boardGeneration=0;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const editor=el('dialog');editor.id='arcade-record-editor';editor.innerHTML='<form id="arcade-record-form"><div class="arcade-heading"><h2>Record your best</h2><button type="button" id="record-skip">Skip</button></div><p id="record-course"></p><div class="record-fields"><label for="record-name">Initials or nickname<input id="record-name" name="nickname" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC" required aria-describedby="record-name-help"></label><label for="record-country">Country <span>(optional)</span><select id="record-country"></select></label></div><p id="record-name-help">Use initials, a first name or a nickname. Please don’t use your full name or contact details.</p><p id="record-country-help"></p><label class="record-opt-in"><input type="checkbox" id="record-listed"> Show my nickname, chosen country and time on the public arcade board</label><p id="record-message" role="status"></p><button type="submit" class="primary" id="record-submit">Save my record</button></form>';
 document.body.append(editor);
 const find=id=>editor.querySelector('#'+id),name=find('record-name'),country=find('record-country'),listed=find('record-listed'),message=find('record-message'),save=find('record-submit');
 const hidden=el('option','Don’t show');hidden.value='';country.append(hidden);
 const countries=COUNTRIES.map(code=>({code,name:countryLabel(code)})).sort((a,b)=>a.name.localeCompare(b.name));for(const c of countries){const o=el('option',c.name);o.value=c.code;country.append(o);}
 find('record-skip').onclick=()=>editor.close();
 editor.addEventListener('close',()=>{editGeneration++;});
 const recordButton=el('button','Record my best · Initials / nickname');recordButton.className='secondary';recordButton.hidden=true;recordButton.onclick=()=>openEditor(current);document.querySelector('.result-details').append(recordButton);
 async function openEditor(record){
  if(!record?.id)return;current=record;const sequence=++editGeneration;
  find('record-course').textContent=tracks[record.track].name+' · '+displayTime(record.ms)+' · 3 laps';
  find('record-skip').textContent='Skip';name.value='';country.value='';listed.checked=false;message.textContent='Loading your record…';save.disabled=true;
  find('record-country-help').textContent='Country is optional. You can change it or leave it hidden.';
  editor.showModal();
  try{const d=await api('record-info',{id:record.id});if(sequence!==editGeneration)return;
   name.value=d.record?.name||'';country.value=d.record?.country??d.suggestedCountry??'';
   listed.checked=!!d.record?.listed&&d.record.challenge===record.id;
   if(!d.record&&d.suggestedCountry)find('record-country-help').textContent='Suggested from your connection. It may be wrong—for example with a VPN. Change it or choose “Don’t show”.';
   message.textContent='No account or email needed.';save.disabled=false;name.focus();
  }catch(e){if(sequence===editGeneration){message.textContent=e.message;save.disabled=true;}}
 }
 find('arcade-record-form').onsubmit=async event=>{
  event.preventDefault();if(!current||save.disabled)return;
  if(!recordName(name.value)){message.textContent='Choose friendly initials or a nickname: 1–12 letters or numbers, starting with a letter. No spaces.';return;}
  const record={...current},sequence=editGeneration;save.disabled=true;message.textContent='Saving…';
  try{const result=await api('record',{id:record.id,name:name.value,country:country.value,listed:listed.checked});
   own=own.filter(r=>r.track!==record.track);own.push({...result,track:record.track,ms:record.ms,challenge:record.id});
   await onSaved?.(record);
   if(sequence===editGeneration){message.textContent=result.listed?'Recorded on the arcade board!':'Recorded for you. It is not on the public board.';find('record-skip').textContent='Done';}
  }catch(e){if(sequence===editGeneration)message.textContent=e.message;}finally{if(sequence===editGeneration)save.disabled=false;}
 };
 const board=el('dialog');board.id='arcade-board';board.innerHTML='<div class="arcade-heading"><h2>Arcade best times</h2><button id="board-close">Done</button></div><label for="board-course">Course <select id="board-course"></select></label><p>Three laps · Dry Time Trial · Guest times</p><p id="board-message" role="status"></p><div id="board-own"></div><ol id="board-list"></ol><p class="arcade-small">Only players who choose to appear are shown. These guest times have basic race checks, not competitive anti-cheat verification.</p>';
 document.body.append(board);const course=board.querySelector('#board-course'),boardMessage=board.querySelector('#board-message'),list=board.querySelector('#board-list'),mine=board.querySelector('#board-own');
 for(const [id,t] of Object.entries(tracks)){const o=el('option',t.name);o.value=id;course.append(o);}
 board.querySelector('#board-close').onclick=()=>board.close();course.onchange=()=>loadBoard();
 const openBoard=el('button','Arcade best times');openBoard.className='secondary';openBoard.onclick=()=>{course.value=current?.track||Object.keys(tracks)[0];board.showModal();loadBoard();};document.querySelector('.trial-more').append(openBoard);
 function showOwn(){
  mine.replaceChildren();const record=own.find(r=>r.track===course.value);if(!record)return;
  mine.append(el('p','Your record: '+record.name+' · '+displayTime(record.ms)+(record.listed?' · On the board':' · Private')));
  const remove=el('button','Remove my name and record');remove.onclick=async()=>{remove.disabled=true;const track=record.track;try{await api('remove-record',{track});own=own.filter(r=>r.track!==track);if(current?.track===track)await onSaved?.(current);await loadBoard();}catch(e){boardMessage.textContent=e.message;remove.disabled=false;}};
  const edit=el('button','Edit my record');edit.onclick=()=>openEditor({id:record.challenge,track:record.track,ms:record.ms});mine.append(edit,remove);
 }
 async function loadBoard(){
  const sequence=++boardGeneration,track=course.value;boardMessage.textContent='Loading times…';list.replaceChildren();mine.replaceChildren();
  try{const [d,p]=await Promise.all([api('board',{track}),api('progress')]);if(sequence!==boardGeneration)return;
   own=p.records||[];showOwn();boardMessage.textContent=d.records.length?'Top '+d.records.length+' · fastest first':'Be the first to record a time on this course.';
   d.records.forEach((r,i)=>{const row=el('li');row.className='arcade-row';const rank=el('b',String(i+1)),identity=el('div'),tag=el('strong',r.name),detail=el('small',characters[r.bear].name+(r.country?' · '+countryLabel(r.country):''));identity.append(tag,detail);const time=el('strong',displayTime(r.ms));row.append(rank,identity,time);list.append(row);});
  }catch(e){if(sequence===boardGeneration)boardMessage.textContent=e.message;}
 }
 return {ready(record){current=record;recordButton.hidden=false;recordButton.textContent='Record my best · '+displayTime(record.ms);},reset(){current=null;recordButton.hidden=true;editGeneration++;if(editor.open)editor.close();},setRecords(records){own=records||[];}};
}
