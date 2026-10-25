import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MISSIONS,createMission,interact,nearby,tick} from '../src/interior-model.mjs';
import {submitPuzzle,puzzlesComplete} from '../src/puzzles.mjs';
import {LEVELS,load} from '../src/campaign.mjs';
import {MISSIONS as EXTERIOR} from '../src/engine.mjs';
test('seven paired levels exist and old four-level saves grow without losing records',()=>{
 assert.equal(LEVELS.length,7);assert.equal(EXTERIOR.length,7);assert.equal(MISSIONS.length,7);
 const old={exterior:Array.from({length:4},()=>({done:true,score:900,stars:2})),interior:Array.from({length:4},()=>({done:true,score:2200,stars:3}))};
 const p=load({getItem:()=>JSON.stringify(old)});assert.equal(p.interior[3].score,2200);assert.equal(p.interior[4].done,false);assert.equal(p.exterior.length,7);
});
test('investigation cannot skip exhibits, puzzle stages or the final origin visit',()=>{
 const s=createMission(2);assert.equal(submitPuzzle(s,0,s.puzzles[0].answer).ok,false);
 s.evidence.forEach(e=>e.found=true);assert.equal(submitPuzzle(s,1,s.puzzles[1].answer).ok,false);
 const origin=s.origins.find(o=>o.correct);s.x=origin.x;s.z=origin.z;interact(s);assert.equal(s.solved,false);
 for(const [i,p] of s.puzzles.entries())assert.equal(submitPuzzle(s,i,p.answer).ok,true);
 tick(s,{},.05);assert.equal(s.status,'playing');interact(s);tick(s,{},.05);assert.equal(s.status,'won');assert.match(s.message,/Undetermined/);
});
test('incorrect and malformed answers cannot award points or mutate shared definitions',()=>{
 const s=createMission(4);const score=s.score;
 for(const input of [[],[-1],[99],[1,1,1,1],['1',3,0,2]])assert.equal(submitPuzzle(s,0,input).ok,false);
 assert.equal(s.puzzles[0].done,false);assert.equal(s.score,score);assert.equal(MISSIONS[4].puzzles[0].done,undefined);
 assert.equal(submitPuzzle(s,0,s.puzzles[0].answer).ok,true);const once=s.score;
 assert.equal(submitPuzzle(s,0,s.puzzles[0].answer).ok,false);assert.equal(s.score,once);
 assert.equal(submitPuzzle(s,1,[1,0]).ok,true,'switch selection order is irrelevant');assert.equal(puzzlesComplete(s),true);
});
test('systems terminals require proximity and preserve fire until routing is complete',()=>{
 const s=createMission(4);assert.equal(nearby(s),null);s.x=s.m.terminal.x;s.z=s.m.terminal.z;
 interact(s);assert.equal(s.activePuzzle,0);
 const f=s.fires[0];s.x=f.x-1.8;s.z=f.z;s.yaw=-Math.PI/2;
 for(let i=0;i<65;i++)tick(s,{spray:true},.05);assert.equal(f.heat,20);
 for(const [i,p] of s.puzzles.entries())submitPuzzle(s,i,p.answer);
 for(let i=0;i<12;i++)tick(s,{spray:true},.05);assert.equal(f.heat,0);
});
test('case files have independent conclusions and all twelve puzzles are solvable',()=>{
 let count=0;
 for(let n=0;n<MISSIONS.length;n++){const s=createMission(n);s.evidence.forEach(e=>e.found=true);for(const [i,p]of s.puzzles.entries()){assert.equal(submitPuzzle(s,i,p.answer).ok,true);count++;}}
 assert.equal(count,12);assert.match(MISSIONS[2].conclusion,/Undetermined/);assert.match(MISSIONS[5].conclusion,/Accidental/);
});
