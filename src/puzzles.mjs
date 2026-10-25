// Authored fictional case files. Patterns alone never establish an ignition cause.
const puzzle = (id, title, kind, prompt, options, answer, hint, explain) => ({id,title,kind,prompt,options,answer,hint,explain});
export const HOTEL_PUZZLES = [
 puzzle('timeline','01 / Reconstruct the timeline','order','Tap the events from earliest to latest. Use the times in your notebook.',
 ['Lobby detector: 22:16','Guest reports wall smoke: 22:12','Crew arrives: 22:21','Power trip logged: 22:14'],[1,3,0,2],
 'A witness report is not the ignition time. Sort only the recorded events.', '22:12 → 22:14 → 22:16 → 22:21. The trip happened after smoke was reported; it cannot by itself establish ignition.'),
 puzzle('preserve','02 / Preserve the scene','order','Arrange the evidence-handling steps for this fictional scene.',
 ['Seal, label and record transfer','Document the item in place','Collect using the approved case protocol','Assign an item ID and location'],[1,3,2,0],
 'Preserve context before moving an item; preserve continuity after collecting it.', 'Scene context and item identity stay linked to the sealed exhibit and transfer record.'),
 puzzle('hypothesis','03 / Test a hypothesis','choice','Which conclusion survives comparison with ALL five records?',
 ['Beaded wiring proves an electrical ignition','The wall cavity is a supported origin area; the ignition mechanism remains unresolved','The ballroom must be the origin because its ceiling is dark'],[1],
 'Compare the independent time records and scene survey. Damage may be an effect of fire.', 'The records support an origin area. Heat damage and beading alone do not establish what ignited the fire.'),
 puzzle('classification','04 / Close the reasoning gap','choice','The lab cannot establish whether the damaged connection preceded the fire. Which cause classification is supported?',
 ['Incendiary — the cause is not obvious','Accidental — there is damaged wiring','Undetermined — competing ignition explanations remain'],[2],
 'An unresolved cause is a valid outcome; do not fill the gap with a guess.', 'Undetermined preserves the uncertainty. The origin area and cause classification answer different questions.')
];
export const ARCHIVE_PUZZLES = [
 puzzle('archive-time','01 / Separate report from event','order','Put these recorded archive events in time order.',
 ['Fire service arrival: 06:54','Camera records smoke at cabinet: 06:43','Cleaner reports smoke: 06:46','Alarm log: 06:45'],[1,3,2,0],
 'Start with the earliest recorded smoke; the reporting time is later.', 'The camera predates both the alarm and the cleaner’s report. None of these gives an exact ignition time.'),
 puzzle('continuity','02 / Repair the evidence record','choice','Exhibit A-03 has a scene photograph and seal number, but its courier transfer has no recipient signature. What is missing?',
 ['A darker photograph','A documented transfer linking sender, recipient, date and time','A new assumed cause'],[1],
 'Think about who had custody, not what the exhibit looks like.', 'The gap must be flagged and investigated. Do not invent a signature or pretend continuity is complete.'),
 puzzle('compare','03 / Compare competing explanations','choice','The exterior camera covers the only entrance, the cabinet was locked, and the lab reports the timer contact welded BEFORE ignition. Which case hypothesis best fits?',
 ['A timer failure overheated stored paper in the cabinet','An unknown visitor must have started it','Every blackened surface is a separate origin'],[0],
 'Use the specific fictional lab finding together with the scene records.', 'In this authored case, the pre-ignition failure and fuel contact support the timer hypothesis. Visible damage alone would not.'),
 puzzle('archive-cause','04 / Write the case finding','choice','The case record establishes a failed timer heating paper without deliberate ignition. Select the supported classification.',
 ['Natural','Accidental','Incendiary','Undetermined'],[1],
 'Use the established ignition sequence, not the amount of damage.', 'Accidental is supported in this fictional case. An incomplete custody record still belongs in the limitations, not hidden from the report.')
];
export const PUMP_PUZZLES = [
 puzzle('route','Pump / Trace the supply','order','A diagram labels SOURCE → STRAINER → BOOSTER → DELIVERY. Tap the matching terminals in flow order.',
 ['C · booster','A · source','D · delivery','B · strainer'],[1,3,0,2],
 'Read the printed diagram left to right. This is a fictional routing puzzle.', 'The flow path is connected. Now balance the delivery branches.'),
 puzzle('balance','Pump / Balance the branches','set','Target flow: 7 units. Select branches totalling exactly 7; the damaged branch must stay off.',
 ['North · 4 units','East · 3 units','Damaged · 7 units','Bypass · 2 units'],[0,1],
 'Two undamaged branches add up to the target.', 'North 4 + East 3 = 7. Supply restored: the hose can now finish knocking down the fires.')
];
export const DEPOT_PUZZLES = [
 puzzle('isolation','Terminal / Isolate the damaged circuit','set','The schematic marks RED and AMBER as damaged, BLUE as the emergency exit supply. Select only the circuits to isolate.',
 ['RED · loading conveyor','BLUE · exit lighting','AMBER · damaged charger','GREEN · radio'],[0,2],
 'Preserve the two undamaged services.', 'Damaged circuits isolated while exit lighting and radio remain available.'),
 puzzle('access','Terminal / Release the rescue route','order','The fictional door controller requires the numbered maintenance code shown on its plate: inspect 2, release 4, confirm 1, open 3.',
 ['1 · confirm','2 · inspect','3 · open','4 · release'],[1,3,0,2],
 'Follow the plate, not numerical order.', 'Access restored. Rescue the crew and complete suppression to clear the terminal.')
];
export const puzzlesComplete = s => s.puzzles.every(p=>p.done);
export function puzzleAvailable(s,index) {
 const p=s.puzzles[index];
 return !!p && s.status==='playing' && !p.done && s.carry===null && s.puzzles.slice(0,index).every(q=>q.done)
   && (s.m.type!=='investigate'||s.evidence.every(e=>e.found));
}
export function submitPuzzle(s,index,selection) {
 if(!puzzleAvailable(s,index)||!Array.isArray(selection))return {ok:false,message:'Complete the preceding objectives first.'};
 const p=s.puzzles[index];
 const valid=selection.every(i=>Number.isInteger(i)&&i>=0&&i<p.options.length)&&new Set(selection).size===selection.length;
 const picked=p.kind==='set'?[...selection].sort((a,b)=>a-b):selection;
 const answer=p.kind==='set'?[...p.answer].sort((a,b)=>a-b):p.answer;
 const ok=valid&&picked.length===answer.length&&picked.every((v,i)=>v===answer[i]);
 p.attempts++;
 if(!ok){s.score=Math.max(0,s.score-25);return {ok:false,message:'Not supported yet. '+p.hint+' Review and try again (−25 score).'};}
 p.done=true;s.score+=250;s.message=p.explain;
 return {ok:true,message:p.explain+' +250'};
}
