// Campaign progression shared by the exterior (2D) and interior (3D) pages.
//
// A level is two stages: the exterior ladder mission is the prelude, and
// clearing it is what opens the interior. The two games live on separate
// pages, so the only thing they share is this module and one storage key.

export const LEVELS = [
  { name: 'Mariner House',   district: 'DOCKSIDE',    exterior: 0, interior: 0 },
  { name: 'Market Street',   district: 'OLD TOWN',    exterior: 1, interior: 1 },
  { name: 'The Grand Hotel', district: 'CITY CENTRE', exterior: 2, interior: 3 },
  { name: 'Last Light Tower',district: 'RIVERSIDE',   exterior: 3, interior: 2 },
];

const KEY = 'unsung-heroes-campaign-v1';
const blank = () => ({ done: false, score: 0, stars: 0 });

export function emptyProgress() {
  return { exterior: LEVELS.map(blank), interior: LEVELS.map(blank) };
}

function sane(stage) {
  return stage
    && typeof stage.done === 'boolean'
    && Number.isFinite(stage.score) && stage.score >= 0
    && Number.isInteger(stage.stars) && stage.stars >= 0 && stage.stars <= 3;
}

export function load(storage = globalThis.localStorage) {
  const fresh = emptyProgress();
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return fresh;
    const p = JSON.parse(raw);
    for (const side of ['exterior', 'interior']) {
      if (!Array.isArray(p?.[side])) continue;
      p[side].slice(0, LEVELS.length).forEach((stage, i) => {
        if (sane(stage)) fresh[side][i] = { done: stage.done, score: stage.score, stars: stage.stars };
      });
    }
  } catch { /* corrupt or unavailable storage starts a fresh campaign */ }
  return fresh;
}

export function persist(progress, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}

// Level 1 is always available; after that you need the previous level's
// interior finished, so neither stage can be skipped.
export function levelOpen(progress, level) {
  if (level <= 0) return true;
  return !!progress.interior[level - 1]?.done;
}

// The gate the request is actually about.
export function interiorOpen(progress, level) {
  return levelOpen(progress, level) && !!progress.exterior[level]?.done;
}

export function record(progress, side, level, score, stars) {
  const stage = progress[side][level];
  if (!stage) return progress;
  stage.done = true;
  stage.score = Math.max(stage.score, Math.round(score) || 0);
  stage.stars = Math.max(stage.stars, stars || 0);
  return progress;
}

// Carrying the prelude result forward is what makes the exterior feel like
// part of the same incident rather than a gate to click through.
export const PRELUDE_BONUS = [0, 10, 20, 30];
export function bonusSeconds(progress, level) {
  return PRELUDE_BONUS[progress.exterior[level]?.stars ?? 0] ?? 0;
}

export function levelForExterior(index) {
  return LEVELS.findIndex(l => l.exterior === index);
}
export function levelForInterior(index) {
  return LEVELS.findIndex(l => l.interior === index);
}

// Shared by both pages so a deep link means the same thing on each.
export function readLevelParam(search = globalThis.location?.search ?? '') {
  const raw = new URLSearchParams(search).get('level');
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n < LEVELS.length ? n : null;
}

// One-time import of the two pre-campaign save keys so existing progress is
// not thrown away by the restructure.
export function migrate(progress, storage = globalThis.localStorage) {
  let changed = false;
  try {
    const old3d = JSON.parse(storage?.getItem('unsung-heroes-3d-v1') || 'null');
    if (old3d) {
      for (const [k, score] of Object.entries(old3d)) {
        const level = levelForInterior(Number(k));
        if (level >= 0 && Number.isFinite(score)) { record(progress, 'interior', level, score, 0); changed = true; }
      }
    }
  } catch { /* ignore an unreadable legacy save */ }
  try {
    const oldExt = JSON.parse(storage?.getItem('ladder-rescue-first-in-v1') || 'null');
    if (oldExt && Array.isArray(oldExt.best)) {
      oldExt.best.forEach((score, i) => {
        const level = levelForExterior(i);
        if (level >= 0 && score > 0) {
          record(progress, 'exterior', level, score, oldExt.stars?.[i] ?? 0);
          changed = true;
        }
      });
    }
  } catch { /* ignore an unreadable legacy save */ }
  if (changed) persist(progress, storage);
  return progress;
}
