// Interior missions.
//
// Each level is a different building AND a different job. The shared parts are
// movement, the hose, air and the stairwell; everything else - what counts as
// winning, what kills you, what E does - comes from the mission's `type`.
//
//   rescue      get everyone out and the fire out
//   vessel      save the boat: the hull burns through on its own clock
//   investigate a cold scene, no fire - read the evidence and call the origin
//   contain     a plant room: valves down before the pressure takes the roof off

const HOTEL_MAP = ['#############','#E..........#','#.##.##.##..#','#.##.##.##..#','#...........#','#.##.##.##..#','#.##.##.##..#','#...........#','#.##.##.##..#','#...........#','#############'];
const RACK_MAP  = ['#############','#E..........#','#..##..##...#','#..##..##...#','#...........#','#..##..##...#','#..##..##...#','#...........#','#..##..##...#','#...........#','#############'];

export const MISSIONS = [
 {
  name:'Behind the door', place:'MARINER HOUSE · FLOOR 03', type:'rescue', kind:'apartment',
  brief:'Search the apartments. Extinguish both fires and carry the residents to the green stairwell.',
  time:96, color:0x809397,
  map:['#############','#E..........#','#...#...#...#','#...#...#...#','#...#...#...#','#...........#','#...#...#...#','#...#...#...#','#...#...#...#','#...........#','#############'],
  people:[[2.5,7.5],[10.5,3.5]], fires:[[5.5,3.5],[9.5,7.5]], task:null,
  spread:34, spreadMax:2,
 },
 {
  name:'Dead in the water', place:'QUAY FOUR · MOTOR YACHT ABIGAIL', type:'vessel', kind:'marina',
  brief:'Fuel-fed fire below decks. Shut the fuel cock, get the skipper off, and knock it down before the hull burns through.',
  time:110, color:0x5d7a86,
  map:['#############','#E..........#','#.....#.....#','#.##..#..##.#','#.##.....##.#','#...........#','#.##.....##.#','#.##..#..##.#','#.....#.....#','#...........#','#############'],
  people:[[4.5,2.5]], fires:[[7.5,4.5],[4.5,6.5],[10.5,8.5]],
  task:{x:11.5,z:5.5,label:'Shut the fuel cock',done:'Fuel isolated — now knock it down before the hull goes.'},
  gasFed:true, hullBurn:0.34, hullAfterShutoff:0.55, spread:30, spreadMax:2,
 },
 {
  name:'Cause and origin', place:'THE GRAND HOTEL · THE MORNING AFTER', type:'investigate', kind:'burnt',
  brief:'The fire is out and the building is yours until the scene is released. Read the burn pattern, work the evidence, then call the seat of the fire.',
  time:105, color:0x4a4347,
  map:HOTEL_MAP,
  people:[], fires:[], task:null,
  evidence:[
   {x:4.5,z:2.5,label:'Examine the scorched outlet',note:'Outlet melted from inside the wall, not from the room side.'},
   {x:7.5,z:8.5,label:'Examine the door frame',note:'Clean burn line low on the frame — the fire ran along the floor.'},
   {x:11.5,z:5.5,label:'Examine the ceiling void',note:'The void is barely touched. Nothing dropped from up there.'},
  ],
  origins:[
   {x:1.5,z:6.5,label:'Call it: linen store'},
   {x:10.5,z:2.5,label:'Call it: room 612 wall cavity',correct:true},
   {x:4.5,z:8.5,label:'Call it: stair lobby'},
  ],
  spread:0,
 },
 {
  name:'Live load', place:'RIVERSIDE TOWER · SWITCH ROOM', type:'contain', kind:'plant',
  brief:'Gas is feeding a switch-room fire and the line pressure is climbing. Close all three valves, get the engineers out, then put it out.',
  time:128, color:0x6b6350,
  map:RACK_MAP,
  people:[[5.5,5.5],[11.5,8.5]], fires:[[6.5,4.5],[2.5,7.5]], task:null,
  valves:[
   {x:2.5,z:2.5,label:'Close valve A'},
   {x:10.5,z:2.5,label:'Close valve B'},
   {x:6.5,z:9.5,label:'Close valve C'},
  ],
  gasFed:true, pressureRise:1.45, spread:28, spreadMax:3,
 },
];

export function createMission(i, bonusSeconds = 0) {
  const m = MISSIONS[i];
  return {
    index:i, m, time:m.time + bonusSeconds, bonusSeconds,
    x:1.5, z:1.5, yaw:Math.PI, pitch:0,
    air:100, water:100, carry:null, saved:0,
    status:'playing', collapse:0, score:0, message:m.brief,
    taskDone:!m.task,
    people:(m.people ?? []).map(([x,z]) => ({x, z, saved:false, carried:false})),
    fires:(m.fires ?? []).map(([x,z]) => ({x, z, heat:100})),
    valves:(m.valves ?? []).map(v => ({...v, closed:false})),
    evidence:(m.evidence ?? []).map(e => ({...e, found:false})),
    origins:(m.origins ?? []).map(o => ({...o})),
    hull:100, pressure:0, calls:0, solved:false, hullWarned:false,
    spreadClock:0, spreadCount:0,
  };
}

export function maxScore(m) {
  return (m.people?.length ?? 0) * 500
       + (m.fires?.length ?? 0) * 100
       + (m.task ? 250 : 0)
       + (m.valves?.length ?? 0) * 200
       + (m.evidence?.length ?? 0) * 150
       + (m.origins ? 600 : 0)
       + m.time * 5;
}
export const STAR_AT = [.4, .6, .8];
export function stars(m, score) { const r = score / maxScore(m); return STAR_AT.filter(t => r >= t).length; }
export function nextStar(m, score) { const max = maxScore(m); for (const t of STAR_AT) if (score < max * t) return Math.ceil(max * t - score); return 0; }

export function wall(s, x, z) {
  const row = s.m.map[Math.floor(z)];
  if (!row) return true;
  const c = row[Math.floor(x)];
  return c !== ' ' && c !== '.' && c !== 'E';
}
export function clearLine(s, x, z) {
  const d = Math.hypot(x - s.x, z - s.z), n = Math.ceil(d * 16);
  for (let i = 1; i <= n; i++) if (wall(s, s.x + (x - s.x) * i / n, s.z + (z - s.z) * i / n)) return false;
  return true;
}
const reach = (s, p, r) => Math.hypot(p.x - s.x, p.z - s.z) < r && clearLine(s, p.x, p.z);
// Examining and calling reach further than carrying does: these are fixed
// things in a room, and the natural place to stand is often a touch over 1.4.
export const EXAMINE_REACH = 1.9;

// What E would do where you are standing. The HUD prints the label.
export function nearby(s) {
  if (s.carry !== null) return null;
  const person = s.people.find(p => !p.saved && !p.carried && reach(s, p, 1.3));
  if (person) return {type:'person', value:person, label:'Rescue casualty'};

  const evidence = s.evidence.find(e => !e.found && reach(s, e, EXAMINE_REACH));
  if (evidence) return {type:'evidence', value:evidence, label:evidence.label};

  if (s.evidence.length && s.evidence.every(e => e.found)) {
    const origin = s.origins.find(o => reach(s, o, EXAMINE_REACH));
    if (origin) return {type:'origin', value:origin, label:origin.label};
  }

  const valve = s.valves.find(v => !v.closed && reach(s, v, 1.5));
  if (valve) return {type:'valve', value:valve, label:valve.label};

  const t = s.m.task;
  if (t && !s.taskDone && reach(s, t, 1.5)) return {type:'task', label:t.label};
  return null;
}

export function interact(s) {
  if (s.status !== 'playing') return;
  const n = nearby(s);
  if (!n) return;
  if (n.type === 'person') {
    s.carry = s.people.indexOf(n.value); n.value.carried = true;
    s.message = 'Casualty secured. Carry them back to the green stairwell.';
  } else if (n.type === 'task') {
    s.taskDone = true; s.score += 250; s.message = s.m.task.done;
  } else if (n.type === 'valve') {
    n.value.closed = true; s.score += 200;
    const left = s.valves.filter(v => !v.closed).length;
    s.message = left ? `Valve closed. ${left} still open and the line is still climbing.`
                     : 'All valves closed — the pressure is falling. Now put the fire out.';
  } else if (n.type === 'evidence') {
    n.value.found = true; s.score += 150;
    const left = s.evidence.filter(e => !e.found).length;
    s.message = `${n.value.note}${left ? ` ${left} more to examine.` : ' That is the picture — go and call the seat of the fire.'}`;
  } else if (n.type === 'origin') {
    if (n.value.correct) {
      s.solved = true; s.score += 600;
      s.message = 'Origin confirmed. Cause determined — electrical fault in the wall cavity.';
    } else {
      s.calls++; s.score = Math.max(0, s.score - 150);
      s.message = s.calls >= 2
        ? 'Wrong again. The scene is released and the cause goes down as undetermined.'
        : 'The burn pattern does not support that. One more wrong call and you lose the scene.';
      if (s.calls >= 2) s.status = 'lost';
    }
  }
}

function move(s, k, dt) {
  s.yaw += ((k.turnLeft ? 1 : 0) - (k.turnRight ? 1 : 0)) * dt * 1.7;
  const speed = (s.carry === null ? 2.1 : 1.45) * dt;
  let f = (k.forward ? 1 : 0) - (k.back ? 1 : 0), r = (k.right ? 1 : 0) - (k.left ? 1 : 0);
  const len = Math.hypot(f, r) || 1; f /= len; r /= len;
  const dx = (-Math.sin(s.yaw) * f + Math.cos(s.yaw) * r) * speed;
  const dz = (-Math.cos(s.yaw) * f - Math.sin(s.yaw) * r) * speed;
  const ok = (x, z) => [-.2, .2].every(a => [-.2, .2].every(b => !wall(s, x + a, z + b)));
  if (ok(s.x + dx, s.z)) s.x += dx;
  if (ok(s.x, s.z + dz)) s.z += dz;
}

function hose(s, k, dt) {
  if (!(k.spray && s.water > 0 && s.carry === null)) return;
  s.water = Math.max(0, s.water - dt * 8);
  for (const fire of s.fires) {
    const d = Math.hypot(fire.x - s.x, fire.z - s.z);
    const angle = Math.atan2(-(fire.x - s.x), -(fire.z - s.z));
    const diff = Math.atan2(Math.sin(angle - s.yaw), Math.cos(angle - s.yaw));
    if (fire.heat > 0 && d < 5 && Math.abs(diff) < .24 && Math.abs(s.pitch) < .65 && clearLine(s, fire.x, fire.z)) {
      // A fuel- or gas-fed fire will not go out while it is still being fed.
      const fed = s.m.gasFed && (s.valves.length ? s.valves.some(v => !v.closed) : !s.taskDone);
      fire.heat = Math.max(fed ? 20 : 0, fire.heat - dt * 45);
      if (fire.heat === 0) { s.score += 100; s.message = 'Fire knocked down.'; }
    }
  }
}

function spread(s, dt) {
  if (!s.m.spread) return;
  s.spreadClock += dt;
  if (s.spreadClock < s.m.spread * Math.pow(.82, s.spreadCount)) return;
  s.spreadClock = 0;
  const source = s.fires.find(f => f.heat > 40);
  if (!source || s.spreadCount >= (s.m.spreadMax ?? 3) || s.time <= 45) return;
  const spots = [[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2],[2,-2],[-2,2]]
    .map(([dx, dz]) => ({x:source.x + dx, z:source.z + dz}))
    .filter(q => !wall(s, q.x, q.z) && Math.hypot(q.x - 1.5, q.z - 1.5) > 2.5
              && !s.fires.some(f => Math.hypot(f.x - q.x, f.z - q.z) < 1.4));
  if (!spots.length) return;
  const q = spots[Math.floor(Math.random() * spots.length)];
  s.fires.push({x:q.x, z:q.z, heat:55});
  s.spreadCount++;
  s.message = 'Fire is spreading — another seat of fire has taken hold.';
}

const burning = s => s.fires.filter(f => f.heat > 0).length;

const WIN = {
  rescue: s => s.saved === s.people.length && s.fires.every(f => f.heat === 0) && s.taskDone,
  vessel: s => s.saved === s.people.length && s.fires.every(f => f.heat === 0) && s.taskDone && s.hull > 0,
  contain: s => s.saved === s.people.length && s.fires.every(f => f.heat === 0) && s.valves.every(v => v.closed),
  investigate: s => s.solved,
};

export function tick(s, k, dt) {
  if (s.status === 'collapsing') { s.collapse += dt; if (s.collapse >= 5) s.status = 'lost'; return; }
  if (s.status !== 'playing') return;
  dt = Math.min(dt, .05);
  s.time = Math.max(0, s.time - dt);
  move(s, k, dt);

  const cold = s.m.type === 'investigate';
  if (!cold) {
    hose(s, k, dt);
    const danger = s.fires.filter(f => f.heat > 0 && Math.hypot(f.x - s.x, f.z - s.z) < 1.25 && clearLine(s, f.x, f.z)).length;
    s.air = Math.max(0, s.air - dt * (.24 + danger * 12));
  } else {
    s.air = Math.max(0, s.air - dt * .12);   // still masked up in a burnt-out building
  }

  if (Math.hypot(s.x - 1.5, s.z - 1.5) < 1) {
    s.air = Math.min(100, s.air + dt * 45);
    s.water = Math.min(100, s.water + dt * 55);
    if (s.carry !== null) {
      const p = s.people[s.carry];
      p.saved = true; p.carried = false; s.carry = null; s.saved++; s.score += 500;
      s.message = 'Casualty out. Air and water replenishing at the stairwell.';
    }
  }

  spread(s, dt);

  // The hull and the gas line are second clocks, and each runs only while the
  // thing driving it is still live.
  if (s.m.type === 'vessel' && burning(s)) {
    // Isolating the fuel does not just unlock extinguishing, it slows what the
    // fire is doing to the hull - so the right first move visibly pays off.
    const fed = s.taskDone ? s.m.hullAfterShutoff : 1;
    s.hull = Math.max(0, s.hull - dt * s.m.hullBurn * burning(s) * fed);
    if (s.hull <= 0) { s.status = 'lost'; s.message = 'The hull burned through. Abigail is on the bottom of the harbour.'; return; }
    if (s.hull < 35 && !s.hullWarned) { s.hullWarned = true; s.message = 'Hull integrity critical — she will not take much more.'; }
  }
  if (s.m.type === 'contain') {
    const open = s.valves.filter(v => !v.closed).length;
    s.pressure = Math.max(0, Math.min(100, s.pressure + dt * (open ? s.m.pressureRise * open : -9)));
    if (s.pressure >= 100) { s.status = 'lost'; s.message = 'The line let go. The switch room is gone.'; return; }
  }

  if (WIN[s.m.type](s)) { s.status = 'won'; s.score += Math.ceil(s.time) * 5; return; }

  if (s.time <= 0) {
    if (s.m.type === 'rescue' || s.m.type === 'contain') {
      s.status = 'collapsing'; s.message = 'STRUCTURE FAILING — building collapse';
    } else if (s.m.type === 'vessel') {
      s.status = 'lost'; s.message = 'She burned to the waterline before you could stop it.';
    } else {
      s.status = 'lost'; s.message = 'The scene has been released. Cause undetermined.';
    }
  } else if (s.air <= 0) {
    s.status = 'lost';
    s.message = 'Air depleted. Stay clear of fire and refill at the stairwell.';
  }
}
