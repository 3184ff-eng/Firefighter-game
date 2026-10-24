// Visual and audio effects for the 3D missions.
// Everything here is generated at runtime: no image or sound files ship with the game.
import * as THREE from '../vendor/three.module.min.js';

// --- procedural textures -------------------------------------------------
// Textures are rebuilt per mission because disposeScene() disposes every map it
// walks, so a shared cache would be freed out from under the next build.

function pad(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function grain(ctx, size, amount, alpha) {
  const img = ctx.getImageData(0, 0, size, size), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    if (alpha) d[i + 3] = Math.max(0, Math.min(255, d[i + 3] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function finish(canvas, repeat = 1) {
  const t = new THREE.CanvasTexture(canvas);
  // Canvas pixels are sRGB; without this three treats them as linear and the
  // whole scene washes out.
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

// Painted breeze-block wall with a scuffed lower band.
export function wallTexture(hex) {
  const size = 256, [c, ctx] = pad(size), base = new THREE.Color(hex);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 32) {
    for (let x = 0; x < size; x += 64) {
      const off = (y / 32) % 2 ? 32 : 0;
      ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.06})`;
      ctx.fillRect(x + off, y, 62, 30);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + off, y, 62, 30);
    }
  }
  const soot = ctx.createLinearGradient(0, size, 0, size * 0.45);
  soot.addColorStop(0, 'rgba(10,12,14,0.5)');
  soot.addColorStop(1, 'rgba(10,12,14,0)');
  ctx.fillStyle = soot;
  ctx.fillRect(0, 0, size, size);
  grain(ctx, size, 26);
  return finish(c);
}

// Worn vinyl floor tiles.
export function floorTexture(hexA, hexB) {
  const size = 256, [c, ctx] = pad(size);
  const a = new THREE.Color(hexA), b = new THREE.Color(hexB);
  ctx.fillStyle = `#${a.getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = `#${b.getHexString()}`;
  for (let y = 0; y < size; y += 64) {
    for (let x = 0; x < size; x += 64) {
      if (((x + y) / 64) % 2 === 0) ctx.fillRect(x, y, 64, 64);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.14})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 9, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, size, 20);
  return finish(c);
}

export function ceilingTexture(hex) {
  const size = 128, [c, ctx] = pad(size);
  ctx.fillStyle = `#${new THREE.Color(hex).getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  grain(ctx, size, 18);
  return finish(c);
}

// Soft radial sprite used for flames, embers and glow.
function radial(stops, size = 128) {
  const [c, ctx] = pad(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const flameTexture = () => radial([
  [0, 'rgba(255,248,214,1)'],
  [0.25, 'rgba(255,196,86,0.95)'],
  [0.55, 'rgba(255,110,34,0.55)'],
  [1, 'rgba(255,70,20,0)'],
]);

export const glowTexture = () => radial([
  [0, 'rgba(255,170,80,0.55)'],
  [0.5, 'rgba(255,120,40,0.18)'],
  [1, 'rgba(255,90,30,0)'],
]);

export const sparkTexture = () => radial([
  [0, 'rgba(255,240,200,1)'],
  [0.4, 'rgba(255,170,70,0.7)'],
  [1, 'rgba(255,120,40,0)'],
], 64);

export function smokeTexture() {
  const size = 128, [c, ctx] = pad(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(120,128,136,0.55)');
  g.addColorStop(0.6, 'rgba(90,98,106,0.22)');
  g.addColorStop(1, 'rgba(70,78,86,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  grain(ctx, size, 30, true);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const sprite = (map, blending, opacity) => new THREE.Sprite(
  new THREE.SpriteMaterial({ map, blending, transparent: true, depthWrite: false, opacity })
);

// --- fire ----------------------------------------------------------------
// Additive billboards instead of cone meshes: cheaper and it reads as fire
// rather than as orange geometry.
export function makeFire(scene, x, z, tex, reduced) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const glow = sprite(tex.glow, THREE.AdditiveBlending, 0.9);
  glow.scale.set(3.4, 3.4, 1);
  glow.position.y = 0.8;
  group.add(glow);

  const tongues = [];
  for (let i = 0; i < 12; i++) {
    const s = sprite(tex.flame, THREE.AdditiveBlending, 0.85);
    s.userData = {
      seed: Math.random() * 6.28,
      rate: 1.1 + Math.random() * 1.5,
      sway: 0.1 + Math.random() * 0.22,
      base: 0.26 + Math.random() * 0.26,
      offset: Math.random() * 0.55,
    };
    group.add(s);
    tongues.push(s);
  }

  const smoke = [];
  for (let i = 0; i < 7; i++) {
    const s = sprite(tex.smoke, THREE.NormalBlending, 0.3);
    s.userData = { seed: Math.random(), drift: (Math.random() - 0.5) * 0.3 };
    group.add(s);
    smoke.push(s);
  }

  const embers = [];
  if (!reduced) {
    for (let i = 0; i < 12; i++) {
      const s = sprite(tex.spark, THREE.AdditiveBlending, 0.9);
      s.userData = { seed: Math.random(), speed: 0.5 + Math.random() * 0.7, arc: (Math.random() - 0.5) * 0.5 };
      s.scale.setScalar(0.05);
      group.add(s);
      embers.push(s);
    }
  }

  const light = new THREE.PointLight(0xff7a28, 6, 6, 1.6);
  light.position.y = 0.95;
  group.add(light);

  scene.add(group);

  return {
    group, light,
    update(t, heat, i) {
      const power = Math.max(0, heat) / 100;
      const h = 0.5 + power * 1.5;
      glow.scale.setScalar(2.2 + power * 2.2 + Math.sin(t * 11 + i) * 0.22);
      glow.material.opacity = 0.35 + power * 0.5;

      tongues.forEach((s, j) => {
        const d = s.userData;
        const climb = ((t * d.rate + d.seed) % 1);
        const fade = 1 - climb;
        const w = (d.base + climb * 0.1) * (0.5 + power);
        s.scale.set(w, w * (1.5 + climb * 1.1), 1);
        s.position.set(
          Math.sin(t * 2.4 + d.seed) * d.sway * climb,
          0.12 + climb * h + d.offset * 0.2,
          Math.cos(t * 2.1 + d.seed) * d.sway * climb
        );
        s.material.opacity = fade * fade * (0.35 + power * 0.65);
      });

      smoke.forEach((s, j) => {
        const d = s.userData;
        const climb = ((t * 0.26 + d.seed) % 1);
        const size = 0.5 + climb * 1.7;
        s.scale.set(size, size, 1);
        s.position.set(d.drift * climb * 2.2, 0.9 + climb * 2.1, Math.sin(d.seed * 6) * climb * 0.5);
        // Smoke thins out as the fire is knocked down but never vanishes instantly.
        s.material.opacity = Math.sin(climb * Math.PI) * (0.08 + power * 0.26);
      });

      embers.forEach((s) => {
        const d = s.userData;
        const climb = ((t * d.speed + d.seed) % 1);
        s.position.set(Math.sin(climb * 7 + d.seed * 9) * d.arc, 0.3 + climb * 2.4, Math.cos(climb * 6 + d.seed * 4) * d.arc);
        s.material.opacity = (1 - climb) * power * 0.9;
        s.scale.setScalar(0.03 + (1 - climb) * 0.05);
      });

      light.intensity = power > 0 ? (4 + power * 5) + Math.sin(t * 17 + i * 3) * 1.4 + Math.sin(t * 31 + i) * 0.6 : 0;
      light.distance = 4 + power * 4;
    },
  };
}

// --- one-shot particle bursts -------------------------------------------
// A fixed pool so a burst never allocates mid-frame.
export class Bursts {
  constructor(scene, tex, size = 64) {
    this.items = [];
    for (let i = 0; i < size; i++) {
      const s = sprite(tex.smoke, THREE.NormalBlending, 0);
      s.visible = false;
      scene.add(s);
      this.items.push({ sprite: s, life: 0, max: 1, vel: new THREE.Vector3(), spin: 0, grow: 1, tint: null });
    }
    this.cursor = 0;
    this.tex = tex;
  }

  // Steam when a fire goes out, sparks when something is knocked down.
  emit(position, count, opts = {}) {
    const {
      map = 'smoke', speed = 1, spread = 0.6, life = 0.9,
      color = 0xdfe9ef, size = 0.4, grow = 2.4, rise = 1,
    } = opts;
    for (let i = 0; i < count; i++) {
      const item = this.items[this.cursor = (this.cursor + 1) % this.items.length];
      item.sprite.visible = true;
      item.sprite.position.copy(position);
      item.sprite.material.map = this.tex[map];
      item.sprite.material.color.setHex(color);
      item.sprite.material.blending = map === 'smoke' ? THREE.NormalBlending : THREE.AdditiveBlending;
      item.sprite.material.needsUpdate = true;
      item.sprite.scale.setScalar(size);
      item.size = size;
      item.grow = grow;
      item.life = item.max = life * (0.6 + Math.random() * 0.7);
      item.vel.set(
        (Math.random() - 0.5) * spread * speed,
        (0.2 + Math.random() * 0.8) * speed * rise,
        (Math.random() - 0.5) * spread * speed
      );
    }
  }

  update(dt) {
    for (const item of this.items) {
      if (item.life <= 0) continue;
      item.life -= dt;
      if (item.life <= 0) { item.sprite.visible = false; continue; }
      const k = item.life / item.max;
      item.sprite.position.addScaledVector(item.vel, dt);
      item.vel.multiplyScalar(1 - dt * 1.6);
      item.sprite.scale.setScalar(item.size * (1 + (1 - k) * item.grow));
      item.sprite.material.opacity = k * k * 0.75;
    }
  }
}

// --- floating score text -------------------------------------------------
export class FloatingText {
  constructor(scene, size = 6) {
    this.items = [];
    for (let i = 0; i < size; i++) {
      const [c, ctx] = pad(256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const s = sprite(tex, THREE.NormalBlending, 0);
      s.scale.set(1.6, 0.4, 1);
      s.visible = false;
      scene.add(s);
      this.items.push({ sprite: s, canvas: c, ctx, tex, life: 0 });
    }
    this.cursor = 0;
  }

  show(position, text, color = '#ffd48a') {
    const item = this.items[this.cursor = (this.cursor + 1) % this.items.length];
    const { ctx, canvas } = item;
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(6,12,16,0.85)';
    ctx.strokeText(text, 128, 48);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 48);
    item.tex.needsUpdate = true;
    item.sprite.position.copy(position);
    item.sprite.visible = true;
    item.life = 1.5;
    item.max = 1.5;
  }

  update(dt) {
    for (const item of this.items) {
      if (item.life <= 0) continue;
      item.life -= dt;
      if (item.life <= 0) { item.sprite.visible = false; continue; }
      const k = item.life / item.max;
      item.sprite.position.y += dt * 0.4;
      item.sprite.material.opacity = Math.min(1, k * 2.2);
    }
  }
}

// --- camera shake --------------------------------------------------------
// Directional rather than random jitter, and it decays fast so it never
// sits on top of the action long enough to hurt readability.
export class Shake {
  constructor(reduced) { this.reduced = reduced; this.amount = 0; this.dir = new THREE.Vector3(); this.t = 0; }
  kick(strength, direction) {
    if (this.reduced) return;
    this.amount = Math.min(0.5, this.amount + strength);
    if (direction) this.dir.copy(direction).normalize();
    else this.dir.set(Math.random() - 0.5, Math.random() - 0.5, 0).normalize();
  }
  update(dt, camera) {
    if (this.amount <= 0.0001) return;
    this.t += dt;
    this.amount *= Math.pow(0.0007, dt); // ~decays over a third of a second
    const w = this.amount * Math.sin(this.t * 52);
    camera.position.addScaledVector(this.dir, w);
    camera.rotation.z += w * 0.35;
  }
}

// --- audio ---------------------------------------------------------------
// Noise-based fire and water beds. Reviews of firefighting games single sound
// out as the thing that sells the fireground, and this game had one beep.
export class AudioKit {
  constructor() { this.ctx = null; this.on = false; this.nodes = {}; }

  enable(on) {
    this.on = on;
    if (!on) { this.#gain('fire', 0); this.#gain('water', 0); return; }
    this.#start();
  }

  #noiseBuffer(ctx, seconds = 2) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      // Brown-ish noise: closer to fire and water than white noise.
      last = (last + (Math.random() * 2 - 1) * 0.08) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  #bed(name, type, freq, q, gain) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.#noiseBuffer(ctx);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start();
    this.nodes[name] = { gain: g, filter, max: gain };
  }

  #start() {
    if (this.ctx) { this.ctx.resume(); return; }
    try {
      this.ctx = new AudioContext();
      this.#bed('fire', 'bandpass', 620, 0.7, 0.3);
      this.#bed('water', 'highpass', 1800, 0.6, 0.22);
    } catch { this.ctx = null; }
  }

  #gain(name, value, ramp = 0.18) {
    const n = this.nodes[name];
    if (!n || !this.ctx) return;
    n.gain.gain.cancelScheduledValues(this.ctx.currentTime);
    n.gain.gain.setTargetAtTime(value, this.ctx.currentTime, ramp);
  }

  // proximity 0..1 — how close and how big the nearest fire is.
  fire(proximity) { this.#gain('fire', this.on ? proximity * (this.nodes.fire?.max ?? 0) : 0); }
  water(flowing) { this.#gain('water', this.on && flowing ? (this.nodes.water?.max ?? 0) : 0, 0.06); }

  // Short musical blip, kept from the original implementation.
  blip(freq, duration = 0.2) {
    if (!this.on) return;
    this.#start();
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, this.ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);
      g.gain.setValueAtTime(0.06, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      o.connect(g).connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + duration);
    } catch { /* audio is optional */ }
  }

  // Low rumble for the collapse.
  rumble(seconds = 2.4) {
    if (!this.on) return;
    this.#start();
    if (!this.ctx) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.#noiseBuffer(this.ctx, seconds);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + seconds);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.45, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + seconds);
      src.connect(filter).connect(g).connect(this.ctx.destination);
      src.start();
      src.stop(this.ctx.currentTime + seconds);
    } catch { /* audio is optional */ }
  }
}
