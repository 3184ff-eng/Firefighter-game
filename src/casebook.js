import {puzzleAvailable,submitPuzzle} from './puzzles.mjs';
// Native dialog keeps touch and keyboard focus out of the 3D controls.
export function openCasebook(state,onClose,{terminal=false}={}) {
 const dialog=document.createElement('dialog');dialog.className='casebook';
 dialog.setAttribute('aria-label',terminal?'Systems terminal':'Mission casebook');
 let selection=[],feedback='',success=false;
 function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
 function button(text,fn,cls){const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;}
 function render(){
  dialog.replaceChildren();
  const head=el('div',undefined,'case-head');head.append(el('span',terminal?'SYSTEMS TERMINAL / CREW HOLDING':'CASEBOOK / CLOCK PAUSED','kicker'),button('Return to scene',()=>dialog.close(),'case-close'));dialog.append(head);
  dialog.append(el('h2',state.m.name));
  const done=state.puzzles.filter(p=>p.done).length;
  const track=el('div',undefined,'case-track');state.puzzles.forEach((p,i)=>track.append(el('span',p.done?'✓':String(i+1),p.done?'complete':i===done?'current':'')));dialog.append(track);
  if(state.evidence.length){
   const notes=el('details');notes.open=!state.evidence.every(e=>e.found);notes.append(el('summary',`Evidence notebook · ${state.evidence.filter(e=>e.found).length}/${state.evidence.length} recovered`));
   for(const [i,e] of state.evidence.entries()){const card=el('article',undefined,'evidence-card');card.append(el('small',`EXHIBIT ${String(i+1).padStart(2,'0')} / ${e.found?'RECORDED':'MISSING'}`),el('h3',e.label),el('p',e.found?e.note:'Locate the gold evidence marker in the scene.'));notes.append(card);}dialog.append(notes);
  }
  const p=state.puzzles[done];
  if(!p){dialog.append(el('h3',state.puzzles.length?'All checks complete.':'Field notes'),el('p',state.m.type==='investigate'?'Return to the scene and mark the supported origin area at a blue marker.':state.puzzles.length?'Systems restored. Complete rescue and suppression.':'Search for survivors, work fires from a distance and return to either green exit to refill.'));}
  else if(!puzzleAvailable(state,done)||state.m.type!=='investigate'&&!terminal){dialog.append(el('p',state.m.type==='investigate'?'Recover every exhibit before testing the case. Your notebook keeps each record available for review.':'Find the blue systems terminal beside the entry and press INTERACT to work these controls.'));}
  else {
   dialog.append(el('h3',p.title),el('p',p.prompt));
   dialog.append(el('p',p.kind==='order'?'Tap cards in order. Tap a selected card to remove it.':p.kind==='set'?'Toggle the required switches, then check the configuration.':'Choose the explanation supported by the case record.','tip'));
   if(p.kind==='order'){const strip=el('div',undefined,'sequence-strip');for(let i=0;i<p.answer.length;i++)strip.append(el('span',selection[i]===undefined?`${i+1} · ?`:p.options[selection[i]]));dialog.append(strip);}
   const options=el('div',undefined,'puzzle-options');p.options.forEach((label,i)=>{const b=button((p.kind==='order'&&selection.includes(i)?`${selection.indexOf(i)+1}. `:'')+label,()=>{if(p.kind==='choice')selection=[i];else if(selection.includes(i))selection=selection.filter(v=>v!==i);else selection.push(i);feedback='';render();dialog.querySelectorAll('.puzzle-options button')[i]?.focus({preventScroll:true});},selection.includes(i)?'picked':'');b.setAttribute('aria-pressed',String(selection.includes(i)));options.append(b);});dialog.append(options);
   const actions=el('div',undefined,'case-actions');actions.append(button('Check reasoning',()=>{const result=submitPuzzle(state,done,selection);feedback=result.message;success=result.ok;selection=[];render();},'primary'),button('Clear',()=>{selection=[];feedback='';render();}),button('Hint',()=>{feedback=p.hint;success=false;render();}));dialog.append(actions);
  }
  if(feedback){const msg=el('p',feedback,'case-feedback'+(success?' success':''));msg.setAttribute('role','status');dialog.append(msg);}
  const solved=state.puzzles.filter(p=>p.done);if(solved.length){const review=el('details');review.append(el('summary','Review completed reasoning'));for(const p of solved)review.append(el('h3',p.title),el('p',p.explain));dialog.append(review);}
  dialog.append(el('p','Fictional arcade scenario. Puzzle controls and case records are not operational training.','tip'));
 }
 dialog.addEventListener('close',()=>{dialog.remove();onClose();},{once:true});
 document.body.append(dialog);render();dialog.showModal();
}
