import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createResponse,dispatch,depart,stepResponse,route,blocked,collision,DEST,LIMIT} from '../src/response-model.mjs';
test('dispatch and boarding are required before the response clock starts',()=>{const s=createResponse();stepResponse(s,{forward:true},.05);assert.equal(s.time,LIMIT);depart(s);assert.equal(s.status,'station');dispatch(s);stepResponse(s,{},.05);assert.equal(s.time,LIMIT);depart(s);stepResponse(s,{forward:true},.05);assert.ok(s.time<LIMIT);assert.ok(s.z>0);});
test('GPS reaches the address without routing through closed segments',()=>{for(let x=0;x<4;x++)for(let z=0;z<5;z++){const p=route(x*80,z*80);assert.deepEqual(p.at(-1),DEST);for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];assert.equal(Math.abs(a.x-b.x)+Math.abs(a.z-b.z),80);assert.equal(blocked([a.x/80,a.z/80],[b.x/80,b.z/80]),false);}}});
test('roads, roadblocks and moving vehicles have collisions',()=>{assert.match(collision(40,40,0),/Building/);assert.match(collision(120,0,0),/closed/);assert.match(collision(80,40,0),/Traffic/);const s=createResponse();dispatch(s);depart(s);s.x=113;s.z=0;s.angle=Math.PI/2;s.speed=30;for(let i=0;i<10;i++)stepResponse(s,{forward:true},.05);assert.ok(s.hits>0);assert.ok(s.x<116);});
test('timeout plays a five-second collapse before the result, even at the address',()=>{const s=createResponse();dispatch(s);depart(s);s.x=DEST.x;s.z=DEST.z;s.time=.01;stepResponse(s,{},.05);assert.equal(s.status,'collapsing');for(let i=0;i<102;i++)stepResponse(s,{forward:true},.05);assert.equal(s.status,'lost');});
test('arrival requires braking, saves a score, and freezes the mission',()=>{const s=createResponse();dispatch(s);depart(s);s.x=240;s.z=310;s.speed=25;stepResponse(s,{},.05);assert.equal(s.status,'driving');for(let i=0;i<20&&s.status==='driving';i++)stepResponse(s,{brake:true},.05);assert.equal(s.status,'won');assert.ok(s.score>0);const time=s.time;stepResponse(s,{forward:true},.05);assert.equal(s.time,time);});
test('an actual driven route can reach the address before the deadline',()=>{const s=createResponse();dispatch(s);depart(s);const goals=[{x:0,z:310},{x:0,z:320},{x:230,z:320},{x:240,z:320}];let index=0;
 for(let i=0;i<12000&&s.status==='driving';i++){
  const p=goals[index],distance=Math.hypot(p.x-s.x,p.z-s.z);if(distance<3&&index<goals.length-1){index++;continue;}
  const desired=Math.atan2(p.x-s.x,p.z-s.z),diff=Math.atan2(Math.sin(desired-s.angle),Math.cos(desired-s.angle));
  const target=Math.abs(diff)>.3?4:distance<20?6:27;
  stepResponse(s,{forward:s.speed<target,brake:s.speed>target+1,left:diff<-.035,right:diff>.035},1/60);
 }
 assert.equal(s.status,'won',`route ended ${s.status} at ${s.x},${s.z}, hits=${s.hits}`);assert.ok(s.time>0);
});
test('the response gets the full 100 seconds at 30, 60 and 120 frames per second',()=>{
 for(const fps of [30,60,120]){const s=createResponse();dispatch(s);s.time=1.8;depart(s);assert.equal(s.time,100);
 for(let i=0;i<99*fps;i++)stepResponse(s,{},1/fps);
 assert.equal(s.status,'driving');assert.ok(Math.abs(s.time-1)<.001);
 for(let i=0;i<fps+1;i++)stepResponse(s,{},1/fps);
 assert.equal(s.status,'collapsing');}
});
