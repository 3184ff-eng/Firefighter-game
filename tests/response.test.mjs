import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createResponse,dispatch,depart,stepResponse,route,blocked,collision,DEST,LIMIT,COLS,ROWS,trafficAt,GATE,gateState} from '../src/response-model.mjs';
test('dispatch and boarding are required before the response clock starts',()=>{const s=createResponse();stepResponse(s,{forward:true},.05);assert.equal(s.time,LIMIT);depart(s);assert.equal(s.status,'station');dispatch(s);stepResponse(s,{},.05);assert.equal(s.time,LIMIT);depart(s);stepResponse(s,{forward:true},.05);assert.ok(s.time<LIMIT);assert.ok(s.z>0);});
test('GPS reaches the address without routing through closed segments',()=>{for(let x=0;x<COLS;x++)for(let z=0;z<ROWS;z++){const p=route(x*80,z*80);assert.deepEqual(p.at(-1),DEST);for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];assert.equal(Math.abs(a.x-b.x)+Math.abs(a.z-b.z),80);assert.equal(blocked([a.x/80,a.z/80],[b.x/80,b.z/80]),false);}}});
test('roads, roadblocks and moving vehicles have collisions',()=>{assert.match(collision(40,40,0),/Building/);assert.match(collision(120,0,0),/closed/);const car=trafficAt(0)[0];assert.match(collision(car.x,car.z,0),/Traffic/);const s=createResponse();dispatch(s);depart(s);s.x=113;s.z=0;s.angle=Math.PI/2;s.speed=30;for(let i=0;i<10;i++)stepResponse(s,{forward:true},.05);assert.ok(s.hits>0);assert.ok(s.x<116);});
test('timeout plays a five-second collapse before the result, even at the address',()=>{const s=createResponse();dispatch(s);depart(s);s.x=DEST.x;s.z=DEST.z;s.time=.01;stepResponse(s,{},.05);assert.equal(s.status,'collapsing');for(let i=0;i<102;i++)stepResponse(s,{forward:true},.05);assert.equal(s.status,'lost');});
test('arrival requires braking, saves a score, and freezes the mission',()=>{const s=createResponse();dispatch(s);depart(s);s.x=DEST.x;s.z=DEST.z-10;s.speed=25;stepResponse(s,{},.05);assert.equal(s.status,'driving');for(let i=0;i<20&&s.status==='driving';i++)stepResponse(s,{brake:true},.05);assert.equal(s.status,'won');assert.ok(s.score>0);const time=s.time;stepResponse(s,{forward:true},.05);assert.equal(s.time,time);});
test('an actual driven route can reach the address before the deadline',()=>{const s=createResponse();dispatch(s);depart(s);const goals=[{x:8.5,z:168.5},{x:248.5,z:168.5},{x:248.5,z:328.5},{x:88.5,z:328.5},{x:88.5,z:408.5},{x:408.5,z:408.5},{x:408.5,z:568.5},{x:480,z:568.5}];let index=0;
 for(let i=0;i<12000&&s.status==='driving';i++){
  const p=goals[index],distance=Math.hypot(p.x-s.x,p.z-s.z);if(distance<3&&index<goals.length-1){index++;continue;}
  const desired=Math.atan2(p.x-s.x,p.z-s.z),diff=Math.atan2(Math.sin(desired-s.angle),Math.cos(desired-s.angle));
  const wait=Math.abs(s.x-GATE.x)<12&&GATE.z-s.z>5&&GATE.z-s.z<18&&gateState(s.elapsed).closed;
  const target=wait?0:Math.abs(diff)>.2?3:distance<16?5:32;
  stepResponse(s,{forward:s.speed<target,brake:s.speed>target+1,left:diff<-.003,right:diff>.003},1/60);
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
test('the enlarged city requires a detour and every traffic vehicle stays off closures',()=>{
 assert.equal((COLS-1)*(ROWS-1),42);
 assert.ok((route(0,0).length-1)*80>DEST.x+DEST.z,'staggered crossings add distance');
 assert.equal(trafficAt(0).length,18);
 for(const t of [0,3,9,17,34])for(const c of trafficAt(t)){
  const a=Math.abs(Math.sin(c.angle))>.5?[Math.floor(c.x/80),Math.round(c.z/80)]:[Math.round(c.x/80),Math.floor(c.z/80)];
  const b=Math.abs(Math.sin(c.angle))>.5?[a[0]+1,a[1]]:[a[0],a[1]+1];
  assert.equal(blocked(a,b),false);
 }
});
test('the railway crossing stops traffic for five seconds and then opens',()=>{
 assert.equal(gateState(0).closed,true);assert.equal(gateState(4.9).closed,true);assert.equal(gateState(5).closed,false);assert.equal(gateState(16).closed,true);
 assert.match(collision(GATE.x,GATE.z,1),/Rail crossing/);assert.equal(collision(GATE.x,GATE.z,6),null);
});

test('driving joystick supports proportional throttle and steering without changing keyboard input',()=>{
 const analog=createResponse(),keyboard=createResponse(),gentle=createResponse();
 for(const s of [analog,keyboard,gentle]){dispatch(s);depart(s);}
 for(let i=0;i<30;i++){stepResponse(analog,{throttle:1,steer:.5},1/60);stepResponse(keyboard,{forward:true,right:true},1/60);stepResponse(gentle,{throttle:.25,steer:0},1/60);}
 assert.ok(analog.angle>0&&analog.angle<keyboard.angle);assert.ok(gentle.speed>0&&gentle.speed<analog.speed);
 const before=analog.speed;stepResponse(analog,{throttle:0,steer:0,brake:true},.05);assert.ok(analog.speed<before);
 const reverse=createResponse();dispatch(reverse);depart(reverse);stepResponse(reverse,{throttle:-1,steer:0},.05);assert.ok(reverse.speed<0);
});
