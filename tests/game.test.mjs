import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,step,interact,floorY,floorAt,grade,MISSIONS,CREW,crewById,FIRE_BLOCK,FIRE_STANDOFF} from '../src/engine.mjs';

const run=(s,keys,seconds)=>{for(let t=0;t<seconds;t+=1/60)step(s,keys,1/60)};
function goX(s,x,spray=false){for(let n=0;n<2000&&Math.abs(s.p.x-x)>3;n++)step(s,{left:s.p.x>x,right:s.p.x<x,spray},1/60);assert.ok(Math.abs(s.p.x-x)<=3||s.status!=='playing',`reached x ${x}`)}
// floorAt() accepts anything within 9px, so insisting on 2 makes a fast
// climber oscillate around the rung instead of arriving.
function goFloor(s,f){for(let n=0;n<1500&&Math.abs(s.p.y-floorY(f))>6;n++)step(s,{up:s.p.y>floorY(f),down:s.p.y<floorY(f)},1/60);assert.ok(Math.abs(s.p.y-floorY(f))<=6||s.status!=='playing',`reached floor ${f}`)}

// Fight from a stand-off: close enough to reach, far enough not to be driven back.
function douse(s,fire){
  const stand=fire.x-120>=176?fire.x-120:fire.x+120;
  goX(s,stand);
  step(s,{right:stand<fire.x,left:stand>fire.x},1/60);
  for(let n=0;n<6000&&!fire.out;n++){
    if(s.p.water<6){goFloor(s,0);goX(s,166);run(s,{},3);goFloor(s,fire.floor);goX(s,stand);step(s,{right:stand<fire.x,left:stand>fire.x},1/60);}
    step(s,{spray:true},1/60);
  }
  assert.equal(fire.out,true,`fire at ${fire.x} on floor ${fire.floor} knocked down`);
}
const liveOn=(s,f)=>s.fires.filter(x=>!x.out&&x.floor===f);
function clearFloor(s,f){for(let guard=0;guard<12;guard++){const fire=liveOn(s,f)[0];if(!fire)return;douse(s,fire);}}

test('every mission is completable, but only by clearing fire off the carry route',()=>{
  for(let i=0;i<MISSIONS.length;i++){
    const s=createGame(i);
    for(const v of s.victims){
      goFloor(s,v.floor);
      clearFloor(s,v.floor);
      goX(s,v.x);interact(s);
      assert.equal(s.p.carry,v.id,`picked up victim ${v.id} in mission ${i}`);
      clearFloor(s,v.floor);
      goX(s,166);goFloor(s,0);run(s,{},1);
      assert.equal(v.saved,true,`victim ${v.id} delivered in mission ${i}`);
    }
    assert.equal(s.status,'won',`mission ${i} won`);
    assert.ok(s.time>0,`mission ${i} finished with time to spare`);
    const score=s.score;run(s,{right:true},5);interact(s);assert.equal(s.score,score);
    assert.ok(grade(s)>=1);
  }
});

test('a carried civilian cannot be walked through live fire, and can once it is out',()=>{
  const s=createGame();
  const fire=s.fires.find(f=>f.floor===1);
  // Pick up the floor-1 victim, then try to walk through the fire between it and the ladder.
  s.p.y=floorY(1);s.p.x=s.victims.find(v=>v.floor===1).x;interact(s);
  assert.notEqual(s.p.carry,null);
  s.p.x=fire.x+160;
  run(s,{left:true},4);
  assert.ok(s.p.x>=fire.x+FIRE_BLOCK-1,`held at the fire line, got ${s.p.x.toFixed(1)}`);
  assert.ok(s.events.some(e=>e.type==='blocked'),'the player is told why');
  fire.out=true;
  run(s,{left:true},4);
  assert.ok(s.p.x<fire.x-FIRE_BLOCK,'the way opens once it is knocked down');
});

test('a carry already beside fire may back away but not push on through',()=>{
  const s=createGame();
  const fire=s.fires.find(f=>f.floor===1);
  s.p.y=floorY(1);s.p.x=s.victims.find(v=>v.floor===1).x;interact(s);
  s.p.x=fire.x-20;
  const start=s.p.x;
  run(s,{right:true},1);
  assert.ok(s.p.x<=start+1,'cannot press further into the fire');
  run(s,{left:true},1);
  assert.ok(s.p.x<start-10,'can retreat the way it came');
});

test('empty-handed movement is never blocked by fire',()=>{
  const s=createGame();
  const fire=s.fires.find(f=>f.floor===1);
  s.p.y=floorY(1);s.p.x=fire.x+160;
  run(s,{left:true},3);
  assert.ok(s.p.x<fire.x-FIRE_BLOCK,'you may walk into it yourself, you just cannot carry anyone through');
});

test('the hose works from a stand-off and flares back when crowded',()=>{
  const s=createGame();const fire=s.fires[0];
  s.p.x=fire.x-100;s.p.y=floorY(1);s.p.face=-1;
  const before=fire.heat;
  run(s,{spray:true},.2);
  assert.ok(fire.heat>=before,'facing away does nothing');
  s.p.face=1;run(s,{spray:true},1);
  assert.equal(fire.out,true);assert.equal(s.suppressed,1);
  const score=s.score;run(s,{spray:true},1);assert.equal(s.score,score);assert.ok(s.p.water<100);

  const t=createGame();const hot=t.fires[0];hot.heat=100;
  t.p.x=hot.x-FIRE_STANDOFF/2;t.p.y=floorY(1);t.p.face=1;t.p.air=100;
  run(t,{spray:true},.6);
  assert.equal(hot.out,false,'crowding it does not put it out');
  assert.ok(t.p.air<100,'and it costs you air');
  assert.ok(t.events.some(e=>e.type==='flare'),'the player is told why');
});

test('rescue is counted only after delivery and never twice',()=>{const s=createGame();s.p.x=360;s.p.y=floorY(1);interact(s);assert.equal(s.saved,0);assert.equal(s.p.carry,0);interact(s);assert.equal(s.p.carry,0);s.p.x=166;s.p.y=floorY(0);step(s,{},.05);assert.equal(s.saved,1);assert.equal(s.score,500);step(s,{},.05);assert.equal(s.saved,1);assert.equal(s.score,500)});

test('carrying prevents hose use, safe zone refills equipment',()=>{const s=createGame();s.p.x=360;s.p.y=floorY(1);interact(s);s.p.water=20;s.p.air=50;run(s,{spray:true},.1);assert.equal(s.p.water,20);s.p.x=166;s.p.y=554;run(s,{},2);assert.equal(s.p.water,100);assert.equal(s.p.air,100)});

test('no vertical movement away from ladder and both ladders work',()=>{const s=createGame();s.p.x=400;run(s,{up:true},1);assert.equal(s.p.y,554);s.p.x=794;goFloor(s,2);assert.equal(floorAt(s.p.y),2)});

test('depleted air or expired timer ends mission and freezes game',()=>{for(const cause of ['air','time']){const s=createGame();if(cause==='air'){s.p.air=0;s.p.x=400;s.p.y=floorY(1)}else s.time=.001;step(s,{},.05);assert.equal(s.status,'lost');const x=s.p.x;run(s,{right:true},2);assert.equal(s.p.x,x);interact(s);assert.equal(s.p.carry,null)}});

test('fire spreads on every incident now, stays bounded and never seals a ladder',()=>{
  for(let i=0;i<MISSIONS.length;i++){
    const s=createGame(i);
    run(s,{},80);
    assert.ok(s.fires.length>s.mission.fires.length,`mission ${i} escalates`);
    assert.ok(s.fires.filter(f=>!f.out).length<=10,'bounded');
    for(const f of s.fires)for(const lx of [166,794]){
      assert.ok(Math.abs(f.x-lx)>140-1,`fire at ${f.x} must not seal the ladder at ${lx}`);
    }
  }
});

test('taller missions retain bounded clocks and spreading fire',()=>{
  for(const m of MISSIONS){assert.ok(m.floors>=3&&m.floors<=8);assert.ok(m.time<=180,`${m.name} clock is ${m.time}`);}
  assert.ok(MISSIONS.every(m=>m.spread>0),'every incident spreads');
});

test('each crew member is a different trade-off, and none is strictly best',()=>{
  assert.equal(CREW.length,4);
  assert.equal(new Set(CREW.map(c=>c.id)).size,4);
  for(const c of CREW){
    const total=c.speed+c.climb+(2-c.air)+(2-c.water);
    assert.ok(total>3.4&&total<4.6,`${c.id} is balanced against the others (${total.toFixed(2)})`);
  }
  assert.equal(crewById('nope').id,'engine','an unknown id falls back to the standard crew');
  const fast=createGame(0,'highline'),slow=createGame(0,'nightwatch');
  fast.p.y=slow.p.y=floorY(1);
  run(fast,{right:true},1);run(slow,{right:true},1);
  assert.ok(fast.p.x>slow.p.x,'Highline outruns Nightwatch');
  const a=createGame(0,'nightwatch'),b=createGame(0,'highline');
  a.p.y=b.p.y=floorY(1);run(a,{},10);run(b,{},10);
  assert.ok(a.p.air>b.p.air,'Nightwatch outlasts Highline on air');
});

test('letting go of the ladder settles you onto the nearest floor',()=>{
  // A fast climber covers more than floorAt's 9px window in two frames, so
  // without this it is possible to stop stranded between floors.
  for(const id of ['engine','sentinel','highline','nightwatch']){
    const s=createGame(0,id);
    s.p.x=166;s.p.y=floorY(1)+17;      // overshot the rung
    assert.equal(floorAt(s.p.y),-1,'starts off-floor');
    run(s,{},1);
    assert.equal(floorAt(s.p.y),1,`${id} settles onto floor 1`);
  }
  const far=createGame(0);
  far.p.x=166;far.p.y=floorY(1)+40;    // genuinely mid-ladder, should stay put
  run(far,{},1);
  assert.equal(floorAt(far.p.y),-1,'a real mid-ladder position is left alone');
});

test('rolling debris warns before moving, descends floors and leaves ladders safe',()=>{
 const s=createGame(3);s.debrisClock=s.mission.debrisInterval;step(s,{},.05);assert.equal(s.debris.length,1);
 const d=s.debris[0],x=d.x;run(s,{},1);assert.equal(d.x,x);assert.ok(d.warning>0);
 run(s,{},3);assert.ok(d.x>x);const top=d.floor;run(s,{},8);assert.ok(d.floor<top);assert.ok(s.debris.length<=5);
 s.p.y=floorY(d.floor);s.p.x=166;s.debrisCooldown=0;d.x=218;d.warning=0;const hits=s.debrisHits;step(s,{},.05);assert.equal(s.debrisHits,hits);
});
test('debris hits have a cooldown and can be cleared with the hose only when not carrying',()=>{
 const s=createGame();s.p.y=floorY(1);s.p.x=400;s.debris=[{floor:1,x:400,dir:1,warning:0,health:.55,rotation:0}];
 step(s,{},.05);assert.equal(s.debrisHits,1);step(s,{},.05);assert.equal(s.debrisHits,1);
 s.fires.forEach(f=>f.out=true);s.p.x=300;s.p.face=1;s.debris[0].x=400;run(s,{spray:true},.65);assert.equal(s.debris.length,0);assert.equal(s.score,50);
 const carry=createGame();carry.p.x=360;carry.p.y=floorY(1);interact(carry);carry.debris=[{floor:1,x:430,dir:1,warning:0,health:.55,rotation:0}];run(carry,{spray:true},.2);assert.equal(carry.debris[0].health,.55);
});
test('vertical camera reaches the roof and returns to the engine',async()=>{
 const {exteriorCameraY}=await import('../src/engine.mjs');const s=createGame(3);assert.equal(s.mission.floors,8);assert.equal(exteriorCameraY(s),0);
 s.p.y=floorY(8);const y=exteriorCameraY(s);assert.ok(y<0);assert.ok(s.p.y-y>0&&s.p.y-y<640);assert.ok(floorY(8)-78-y>=0);
 s.p.y=554;assert.equal(exteriorCameraY(s),0);
});
