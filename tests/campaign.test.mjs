import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVELS, emptyProgress, load, persist, migrate, record,
  levelOpen, interiorOpen, bonusSeconds, levelForExterior, levelForInterior, readLevelParam,
} from '../src/campaign.mjs';

const memory = (seed = {}) => {
  const m = new Map(Object.entries(seed));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    dump: () => Object.fromEntries(m),
  };
};

test('every level pairs one exterior with one interior, and none is reused', () => {
  const ext = LEVELS.map(l => l.exterior), int = LEVELS.map(l => l.interior);
  assert.equal(new Set(ext).size, LEVELS.length);
  assert.equal(new Set(int).size, LEVELS.length);
  LEVELS.forEach((l, i) => {
    assert.equal(levelForExterior(l.exterior), i);
    assert.equal(levelForInterior(l.interior), i);
  });
});

test('the interior stays shut until its prelude is cleared', () => {
  const p = emptyProgress();
  assert.equal(levelOpen(p, 0), true, 'the first level is always available');
  assert.equal(interiorOpen(p, 0), false, 'but not its interior');

  record(p, 'exterior', 0, 1200, 2);
  assert.equal(interiorOpen(p, 0), true, 'clearing the prelude opens the interior');
  assert.equal(levelOpen(p, 1), false, 'and does not open the next level');

  record(p, 'interior', 0, 2000, 3);
  assert.equal(levelOpen(p, 1), true, 'finishing inside opens the next level');
  assert.equal(interiorOpen(p, 1), false, 'whose own prelude must still be run');
});

test('no level beyond the first is reachable without finishing the one before', () => {
  const p = emptyProgress();
  for (let i = 1; i < LEVELS.length; i++) {
    assert.equal(levelOpen(p, i), false);
    assert.equal(interiorOpen(p, i), false);
  }
});

test('prelude stars buy time inside, and a better run never lowers a record', () => {
  const p = emptyProgress();
  assert.equal(bonusSeconds(p, 0), 0);
  record(p, 'exterior', 0, 500, 3);
  assert.equal(bonusSeconds(p, 0), 30);
  record(p, 'exterior', 0, 100, 1);
  assert.equal(p.exterior[0].score, 500, 'score keeps the best');
  assert.equal(p.exterior[0].stars, 3, 'stars keep the best');
  assert.equal(bonusSeconds(p, 0), 30);
});

test('progress survives a save and load round trip', () => {
  const store = memory();
  const p = emptyProgress();
  record(p, 'exterior', 1, 900, 2);
  record(p, 'interior', 0, 2600, 3);
  assert.equal(persist(p, store), true);
  const back = load(store);
  assert.deepEqual(back.exterior[1], { done: true, score: 900, stars: 2 });
  assert.deepEqual(back.interior[0], { done: true, score: 2600, stars: 3 });
  assert.equal(back.exterior[0].done, false);
});

test('corrupt or absent storage yields a fresh campaign instead of throwing', () => {
  assert.deepEqual(load(memory()), emptyProgress());
  assert.deepEqual(load(memory({ 'unsung-heroes-campaign-v1': '{{{' })), emptyProgress());
  assert.deepEqual(
    load(memory({ 'unsung-heroes-campaign-v1': '{"exterior":[{"done":"yes","score":-5,"stars":9}]}' })),
    emptyProgress(),
    'a malformed stage is discarded rather than trusted',
  );
  assert.doesNotThrow(() => load(undefined));
});

test('the two pre-campaign save keys are carried over', () => {
  const store = memory({
    'unsung-heroes-3d-v1': JSON.stringify({ 1: 2740 }),
    'ladder-rescue-first-in-v1': JSON.stringify({ unlocked: 1, best: [1760, 0, 0, 0], stars: [3, 0, 0, 0] }),
  });
  const p = migrate(load(store), store);
  assert.equal(p.interior[levelForInterior(1)].score, 2740, 'the old interior best is kept');
  assert.equal(p.exterior[levelForExterior(0)].stars, 3, 'the old exterior stars are kept');
  assert.equal(load(store).interior[levelForInterior(1)].score, 2740, 'and the migration is written back');
});

test('a level deep link is only accepted when it names a real level', () => {
  assert.equal(readLevelParam('?level=0'), 0);
  assert.equal(readLevelParam('?level=' + (LEVELS.length - 1)), LEVELS.length - 1);
  for (const bad of ['', '?level=-1', '?level=' + LEVELS.length, '?level=abc', '?level=1.5', '?other=1']) {
    assert.equal(readLevelParam(bad), null, `rejects ${bad || '(empty)'}`);
  }
});

test('a level already reached is never taken away', () => {
  // Migrated saves can describe a later level as finished while an earlier one
  // is not, which must not leave the finished one showing as locked.
  const p = emptyProgress();
  record(p, 'interior', 1, 2740, 0);
  assert.equal(levelOpen(p, 1), true, 'a cleared interior keeps its own level open');
  assert.equal(levelOpen(p, 2), true, 'and still opens the next level');
  assert.equal(interiorOpen(p, 1), false, 'but its prelude is still outstanding');

  const q = emptyProgress();
  record(q, 'exterior', 2, 400, 1);
  assert.equal(levelOpen(q, 2), true, 'a cleared prelude also keeps its level open');
  assert.equal(levelOpen(q, 3), false, 'without opening the next one');
});
