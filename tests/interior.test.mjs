import {submitPuzzle} from '../src/puzzles.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  createMission, tick, interact, nearby, wall, clearLine,
  MISSIONS, stars, nextStar, maxScore, EXAMINE_REACH,
} from '../src/interior-model.mjs';

// ---- bot harness -----------------------------------------------------------
// The interior is first-person, so a bot needs a path and a heading. Walls make
// straight-line walking useless, hence a BFS over open cells.

const open = (s, x, z) => !wall(s, x + .5, z + .5);
function path(s, to) {
  const from = [Math.floor(s.x), Math.floor(s.z)], goal = [Math.floor(to.x), Math.floor(to.z)];
  const key = c => c[0] + ',' + c[1];
  const prev = new Map([[key(from), null]]);
  const q = [from];
  while (q.length) {
    const c = q.shift();
    if (key(c) === key(goal)) break;
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const n = [c[0] + dx, c[1] + dz];
      if (open(s, n[0], n[1]) && !prev.has(key(n))) { prev.set(key(n), c); q.push(n); }
    }
  }
  if (!prev.has(key(goal))) return null;
  const out = [];
  for (let c = goal; c; c = prev.get(key(c))) out.unshift(c);
  return out;
}
function stepToward(s, tx, tz) {
  const ux = tx - s.x, uz = tz - s.z, d = Math.hypot(ux, uz) || 1;
  s.yaw = Math.atan2(-ux / d, -uz / d);
  tick(s, {forward:true}, 1/60);
}
function walkTo(s, to, guard = 4000) {
  const cells = path(s, to);
  assert.ok(cells, `a route exists to ${to.x},${to.z}`);
  for (const [cx, cz] of cells) {
    let n = 0;
    while (Math.hypot(cx + .5 - s.x, cz + .5 - s.z) > .3 && n++ < 400 && s.status === 'playing') stepToward(s, cx + .5, cz + .5);
  }
  let n = 0;
  while (Math.hypot(to.x - s.x, to.z - s.z) > .8 && n++ < guard && s.status === 'playing') stepToward(s, to.x, to.z);
}
function faceAnd(s, target, keys, until, guard = 3000) {
  for (let n = 0; n < guard && s.status === 'playing' && !until(); n++) {
    const ux = target.x - s.x, uz = target.z - s.z, d = Math.hypot(ux, uz) || 1;
    s.yaw = Math.atan2(-ux / d, -uz / d); s.pitch = 0;
    tick(s, keys, 1/60);
  }
}
const away = (s, p) => Math.hypot(p.x - s.x, p.z - s.z);
function standOff(s, fire, want = 2.4) {
  // The hose reaches 5m and standing on the fire costs 12 air a second, but in
  // the small rooms backing off far enough breaks line of sight - so give the
  // ground back the moment the fire is no longer visible.
  for (let n = 0; n < 200 && away(s, fire) < want && s.status === 'playing'; n++) {
    const ux = fire.x - s.x, uz = fire.z - s.z, d = Math.hypot(ux, uz) || 1;
    s.yaw = Math.atan2(-ux / d, -uz / d);
    const back = {x:s.x, z:s.z};
    tick(s, {back:true}, 1/60);
    if (!clearLine(s, fire.x, fire.z)) { s.x = back.x; s.z = back.z; return; }
  }
}
// Approach only until the fire is both in range and visible. Walking onto it
// first costs 12 air a second, which is the bot killing itself, not the game.
function walkNear(s, to, stop) {
  const cells = path(s, to) || [];
  const near = () => Math.hypot(to.x - s.x, to.z - s.z) <= stop && clearLine(s, to.x, to.z);
  for (const [cx, cz] of cells) {
    if (near()) return;
    let n = 0;
    while (Math.hypot(cx + .5 - s.x, cz + .5 - s.z) > .3 && n++ < 400 && s.status === 'playing' && !near()) stepToward(s, cx + .5, cz + .5);
  }
}
function douse(s, fire) {
  for (let attempt = 0; attempt < 6 && fire.heat > 0 && s.status === 'playing'; attempt++) {
    walkNear(s, fire, 2.5);
    standOff(s, fire);
    faceAnd(s, fire, {spray:true}, () => fire.heat === 0 || s.water < 4);
    if (s.water < 4) { walkTo(s, {x:1.5, z:1.5}); faceAnd(s, {x:1.5,z:1.5}, {}, () => s.water > 95, 4000); }
  }
}
function deliver(s, person) {
  walkTo(s, person);
  interact(s);
  walkTo(s, {x:1.5, z:1.5});
  for (let n = 0; n < 200 && s.carry !== null && s.status === 'playing'; n++) tick(s, {}, 1/60);
}
function useAt(s, point) { walkTo(s, point); interact(s); tick(s, {}, 1/60); }

// Plays whichever job this mission actually is.
function solvePuzzles(s) {for(const [i,p] of s.puzzles.entries())assert.equal(submitPuzzle(s,i,p.answer).ok,true);}
function play(s) {
  const m = s.m;
  if (m.type === 'investigate') {
    for (const e of s.evidence) useAt(s, e);
    solvePuzzles(s);
    useAt(s, s.origins.find(o => o.correct));
    return;
  }
  solvePuzzles(s);
  for (const v of s.valves) useAt(s, v);
  if (m.task) useAt(s, m.task);
  for (const p of s.people) deliver(s, p);
  for (let guard = 0; guard < 12; guard++) {
    const fire = s.fires.find(f => f.heat > 0);
    if (!fire) break;
    douse(s, fire);
  }
}

// ---- shape -----------------------------------------------------------------

test('every level is a different building and a different job',()=>{
  assert.equal(MISSIONS.length, 7);
  assert.equal(new Set(MISSIONS.map(m => m.type)).size, 4, 'four distinct jobs');
  assert.equal(new Set(MISSIONS.map(m => m.kind)).size, 4, 'four distinct buildings');
});

test('every objective is reachable from the entry on all four plans',()=>{
  for (let i = 0; i < MISSIONS.length; i++) {
    const s = createMission(i);
    const pts = [...s.people, ...s.fires, ...s.valves, ...s.evidence, ...s.origins, ...(s.m.task ? [s.m.task] : [])];
    assert.ok(pts.length, `mission ${i} has objectives`);
    for (const p of pts) assert.ok(path(s, p), `mission ${i}: ${p.x},${p.z} is reachable`);
  }
});

test('the clocks stay well under the old four-to-five minutes, and the areas are big',()=>{
  for (const m of MISSIONS) {
    assert.ok(m.time <= 200, `${m.name} is ${m.time}s`);
    const w = m.map[0].length, h = m.map.length;
    assert.ok(w * h >= 300, `${m.name} is only ${w}x${h}`);
    assert.ok(m.map.every(r => r.length === w), `${m.name} has a ragged plan`);
  }
});

test('each mission is completable, by doing its own job, inside its own clock',()=>{
  for (let i = 0; i < MISSIONS.length; i++) {
    const s = createMission(i);
    play(s);
    assert.equal(s.status, 'won', `${MISSIONS[i].name} (${MISSIONS[i].type}) was won`);
    assert.ok(s.time > 0, `${MISSIONS[i].name} finished with time to spare`);
    assert.ok(stars(s.m, s.score) >= 1, `${MISSIONS[i].name} earns at least one star`);
  }
});

// ---- shared rules ----------------------------------------------------------

test('walls block movement and the hose',()=>{
  const s = createMission(0);
  s.x = 3.7; s.z = 3.5; s.yaw = -Math.PI/2;
  for (let i = 0; i < 100; i++) tick(s, {forward:true}, .05);
  assert.ok(s.x < 3.81);
  assert.equal(clearLine(s, 5.5, 3.5), false);
});

test('a casualty is counted only on delivery, never twice',()=>{
  const s = createMission(0);
  interact(s); assert.equal(s.carry, null, 'nothing to pick up at the door');
  const first = s.people[0];
  s.x = first.x; s.z = first.z; interact(s);
  assert.equal(s.carry, 0); assert.equal(s.saved, 0);
  s.x = 1.5; s.z = 1.5; tick(s, {}, .05);
  assert.equal(s.saved, 1);
  tick(s, {}, .05);
  assert.equal(s.saved, 1);
});

test('air runs out and a finished mission freezes',()=>{
  const s = createMission(0);
  s.x = 6.5; s.z = 5.5;          // away from the stairwell, which refills
  s.air = 0; tick(s, {}, .05);
  assert.equal(s.status, 'lost');
  const where = s.x; tick(s, {forward:true}, .5);
  assert.equal(s.x, where);
});

test('every mission with fire escalates within its own cap and never beside the exit',()=>{
  for (let i = 0; i < MISSIONS.length; i++) {
    const s = createMission(i);
    if (!s.m.spread) { assert.equal(s.m.type, 'investigate', 'only the cold scene has no spread'); continue; }
    // The switch room blows in about 23s with the valves open, long before the
    // spread timer, so shut them to observe the fire behaviour on its own.
    s.valves.forEach(v => v.closed = true);
    const seeded = s.fires.length;
    for (let k = 0; k < 4000; k++) tick(s, {}, .05);
    const gained = s.fires.length - seeded;
    assert.ok(gained > 0, `mission ${i} escalates`);
    assert.ok(gained <= s.m.spreadMax, `mission ${i} stays inside its cap`);
    for (const f of s.fires) {
      assert.equal(wall(s, f.x, f.z), false, 'a fire never starts inside a wall');
      assert.ok(Math.hypot(f.x - 1.5, f.z - 1.5) > 2.5, 'the stairwell stays clear');
    }
  }
});

test('a cleared building never reignites',()=>{
  const s = createMission(0);
  s.fires.forEach(f => f.heat = 0);
  for (let k = 0; k < 3000; k++) tick(s, {}, .05);
  assert.ok(s.fires.every(f => f.heat === 0));
});

// ---- vessel ----------------------------------------------------------------

test('the hull burns through on its own clock, and only while she is alight',()=>{
  const s = createMission(1);
  assert.equal(s.m.type, 'vessel');
  for (let k = 0; k < 100; k++) tick(s, {}, .05);
  assert.ok(s.hull < 100, 'burning costs hull');

  const sunk = createMission(1);
  for (let k = 0; k < 4000 && sunk.status === 'playing'; k++) tick(sunk, {}, .05);
  assert.equal(sunk.status, 'lost');

  const safe = createMission(1);
  safe.fires.forEach(f => f.heat = 0);
  const before = safe.hull;
  for (let k = 0; k < 400; k++) tick(safe, {}, .05);
  assert.equal(safe.hull, before, 'a fire that is out stops eating the hull');
});

test('a fuel-fed fire will not go out until the cock is shut',()=>{
  const s = createMission(1);
  const fire = s.fires[0];
  walkTo(s, fire); standOff(s, fire);
  faceAnd(s, fire, {spray:true}, () => fire.heat <= 20);
  assert.equal(fire.heat, 20, 'it floors at 20 while any cock is still open');
  for (const v of s.valves) { useAt(s, v); }
  assert.ok(s.valves.every(v => v.closed), 'both cocks shut');
  walkTo(s, fire); standOff(s, fire);   // the cocks are at opposite ends of the boat
  faceAnd(s, fire, {spray:true}, () => fire.heat === 0);
  assert.equal(fire.heat, 0);
});

test('losing the vessel is losing the mission even with everyone off',()=>{
  const s = createMission(1);
  s.people.forEach(p => p.saved = true); s.saved = s.people.length; s.taskDone = true;
  s.hull = .2;
  for (let k = 0; k < 40 && s.status === 'playing'; k++) tick(s, {}, .05);
  assert.equal(s.status, 'lost');
});

// ---- contain ---------------------------------------------------------------

test('line pressure climbs with every open valve and falls once they are shut',()=>{
  const s = createMission(3);
  assert.equal(s.m.type, 'contain');
  for (let k = 0; k < 100; k++) tick(s, {}, .05);
  const withThree = s.pressure;
  assert.ok(withThree > 0, 'pressure climbs');
  s.valves.forEach(v => v.closed = true);
  for (let k = 0; k < 100; k++) tick(s, {}, .05);
  assert.ok(s.pressure < withThree, 'and falls once the valves are shut');
});

test('letting the line go loses the switch room',()=>{
  const s = createMission(3);
  for (let k = 0; k < 6000 && s.status === 'playing'; k++) tick(s, {}, .05);
  assert.equal(s.status, 'lost');
  assert.ok(s.pressure >= 100, 'the pressure is what got you, not the clock');
});

test('the fire cannot be finished while any valve is still open',()=>{
  const s = createMission(3);
  const fire = s.fires[0];
  walkTo(s, fire);
  faceAnd(s, fire, {spray:true}, () => fire.heat <= 20);
  assert.equal(fire.heat, 20);
});

// ---- investigate -----------------------------------------------------------

test('the cold scene has no fire to fight and no fire to run from',()=>{
  const s = createMission(2);
  assert.equal(s.m.type, 'investigate');
  assert.equal(s.fires.length, 0);
  assert.equal(s.people.length, 0);
  s.x = 6.5; s.z = 4.5;          // likewise
  const air = s.air;
  for (let k = 0; k < 200; k++) tick(s, {spray:true}, .05);
  assert.ok(s.air < air, 'you are still on air');
  assert.ok(air - s.air < 3, 'but it drains far slower than in a live fire');
});

test('the origin cannot be called until the evidence is in',()=>{
  const s = createMission(2);
  const right = s.origins.find(o => o.correct);
  walkTo(s, right);
  assert.equal(nearby(s), null, 'standing on it offers nothing yet');
  interact(s);
  assert.equal(s.solved, false);
  assert.equal(s.status, 'playing');
});

test('working the evidence then calling the right seat solves it',()=>{
  const s = createMission(2);
  for (const e of s.evidence) { useAt(s, e); assert.equal(e.found, true, e.label); }
  solvePuzzles(s);
  const right = s.origins.find(o => o.correct);
  walkTo(s, right);
  assert.equal(nearby(s)?.type, 'origin', 'now it offers the call');
  interact(s);
  assert.equal(s.solved, true);
  tick(s, {}, 1/60);            // interact sets the flag; tick decides the mission
  assert.equal(s.status, 'won');
});

test('two wrong calls lose the scene',()=>{
  const s = createMission(2);
  for (const e of s.evidence) useAt(s, e);
  solvePuzzles(s);
  const wrong = s.origins.filter(o => !o.correct);
  useAt(s, wrong[0]);
  assert.equal(s.status, 'playing', 'the first wrong call is a warning');
  assert.equal(s.calls, 1);
  useAt(s, wrong[1]);
  assert.equal(s.status, 'lost');
});

// ---- endings ---------------------------------------------------------------

test('running out of time ends each job in the way that job ends',()=>{
  const expected = {rescue:'collapsing', contain:'collapsing', vessel:'lost', investigate:'lost'};
  for (let i = 0; i < MISSIONS.length; i++) {
    const s = createMission(i);
    s.time = .01;
    tick(s, {}, .05);
    assert.equal(s.status, expected[s.m.type], `${s.m.type} ends as ${expected[s.m.type]}`);
    if (s.status === 'collapsing') {
      tick(s, {}, 4); assert.equal(s.status, 'collapsing');
      tick(s, {}, 1.1); assert.equal(s.status, 'lost');
    }
  }
});

test('star thresholds scale with the mission and report the gap to the next one',()=>{
  for (const m of MISSIONS) {
    assert.equal(stars(m, 0), 0);
    assert.equal(stars(m, maxScore(m)), 3);
    assert.ok(nextStar(m, 0) > 0);
    assert.equal(nextStar(m, maxScore(m)), 0);
  }
});

test('evidence can be examined from where you actually stand',()=>{
  // Found by playing it: the natural spot in the row-7 corridor is 1.51 from
  // the door frame, which the old 1.4 reach rejected with no hint you were
  // close. Pinned to that exact position.
  const s = createMission(2);
  // Stand 1.55 short of each marker - inside the new reach, outside the old -
  // approaching down an open column so nothing is in the way.
  for (const e of s.evidence) {
    s.x = e.x; s.z = e.z - 1.55;
    if (wall(s, s.x, s.z)) continue;            // not every marker has clear floor north of it
    assert.ok(Math.hypot(e.x - s.x, e.z - s.z) > 1.4, 'the spot really is outside the old reach');
    assert.equal(nearby(s)?.type, 'evidence', `${e.label} is offered from 1.55 away`);
  }
  assert.ok(EXAMINE_REACH > 1.4);
});

test('a wider examine reach stays unambiguous and still respects walls',()=>{
  const s = createMission(2);
  s.x = 1.5; s.z = 1.5;
  assert.equal(nearby(s), null, 'nothing is in reach from the entry');

  // No two pieces of evidence may ever be in reach at once, or examining one
  // would silently consume the other.
  const ev = s.evidence;
  for (let i = 0; i < ev.length; i++) for (let j = i + 1; j < ev.length; j++) {
    assert.ok(Math.hypot(ev[i].x - ev[j].x, ev[i].z - ev[j].z) > EXAMINE_REACH * 2,
      `${ev[i].label} and ${ev[j].label} must not share a standing spot`);
  }

  // Two origin calls can overlap, and that is allowed, because the prompt
  // always names the one you are about to make.
  for (const o of s.origins) {
    const probe = createMission(2);
    probe.evidence.forEach(e => e.found = true);
    solvePuzzles(probe);
    probe.x = o.x; probe.z = o.z;
    const n = nearby(probe);
    assert.equal(n?.type, 'origin');
    assert.ok(n.label.startsWith('Call it:'), 'the call is always named before you make it');
  }

  // reach() composes clearLine, whose wall behaviour is covered by the
  // movement test above; this map has no open spot both within reach of a
  // marker and blocked from it, so there is nothing honest to assert here.
});

test('the hull is the real clock on the boat, and isolating the fuel buys most of it back',()=>{
  // Found by playing it: at the old burn rate she sank after 57s with 83s
  // still showing on the mission timer, so the clock the player watches was
  // not the clock that killed them.
  const clock = MISSIONS[1].time;
  const survives = shut => {
    const s = createMission(1);
    if (shut) s.valves.forEach(v => v.closed = true);
    let t = 0;
    while (s.status === 'playing' && s.hull > 0 && t < 600) { tick(s, {}, 1/60); t += 1/60; }
    return t;
  };
  const open = survives(false), shut = survives(true);
  // Three separate guarantees, which is what the original defect broke:
  //   1. doing the right thing first nearly covers the whole mission,
  //   2. doing it is visible on the meter rather than silent,
  //   3. and you are never dead before you could plausibly have acted.
  assert.ok(shut > clock * 0.8, `isolated, the hull must nearly cover the mission (${shut.toFixed(0)}s of ${clock}s)`);
  assert.ok(shut > open * 1.4, `isolating the fuel must visibly slow the burn (${open.toFixed(0)}s -> ${shut.toFixed(0)}s)`);
  assert.ok(open > clock * 0.45, `and she must not sink before you could cross the boat (${open.toFixed(0)}s of ${clock}s)`);
});

test('the hull only burns while something is actually alight',()=>{
  const s = createMission(1);
  s.fires.forEach(f => f.heat = 0);
  const before = s.hull;
  for (let k = 0; k < 600; k++) tick(s, {}, 1/60);
  assert.equal(s.hull, before);
});

test('a thumbstick gives direction and magnitude, and keys still work as before',()=>{
  const dist = (keys, seconds) => {
    const s = createMission(0);
    s.x = 10.5; s.z = 4.5; s.yaw = Math.PI;       // open corridor, facing +z
    const x0 = s.x, z0 = s.z;
    for (let t = 0; t < seconds; t += 1/60) tick(s, keys, 1/60);
    return Math.hypot(s.x - x0, s.z - z0);
  };
  const key = dist({forward:true}, 1);
  const full = dist({ay:1}, 1);
  const half = dist({ay:0.5}, 1);
  assert.ok(Math.abs(full - key) < 0.05, 'a full push matches holding the key');
  assert.ok(half > 0.2 && half < full * 0.75, `a half push walks slower (${half.toFixed(2)} vs ${full.toFixed(2)})`);
  assert.equal(dist({ay:0, ax:0}, 1), 0, 'a centred stick does not move you');

  // Diagonals must not be faster than straight ahead.
  const diag = dist({ay:1, ax:1}, 1);
  assert.ok(diag <= full + 0.02, `a diagonal push is clamped (${diag.toFixed(2)} vs ${full.toFixed(2)})`);
});

test('analog turn matches holding the turn key',()=>{
  const spin = keys => {
    const s = createMission(0);
    const y0 = s.yaw;
    for (let t = 0; t < 1; t += 1/60) tick(s, keys, 1/60);
    return s.yaw - y0;
  };
  assert.ok(Math.abs(spin({turnLeft:true}) - spin({turn:1})) < 0.02, 'full analog turn matches the key');
  assert.ok(Math.abs(spin({turn:0.5})) < Math.abs(spin({turn:1})), 'a gentle turn is slower');
});
