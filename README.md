# Ladder Rescue — First In

An expanded arcade game built from the original Firefighter Ladder Rescue concept: climb exterior ladders, reach civilians in a burning building and bring them to the engine.

## Play

Run `npm start` (Python 3), then open http://localhost:4340. No build step, API keys, account or runtime packages are needed. Use a current browser with Canvas 2D, ES modules and Pointer Events.

- Arrow keys / WASD: walk and climb. Step sideways at a numbered floor to enter.
- Space / hold SPRAY: aim in your facing direction and extinguish nearby fire.
- E / RESCUE: pick up a nearby civilian. One passenger at a time; the hose is unavailable while carrying.
- Return to the engine's green safe zone: delivery is automatic; air and water refill.
- P / Escape: pause and resume. Focus loss also pauses gameplay.

Four incidents unlock in sequence. Finish with more than half the starting time for three stars, or more than a quarter for two. Personal results persist locally. No monetization or remote analytics is implemented. This is fictional arcade entertainment, not operational fire-service training.

## Changes

- Responsive canvas in logical world coordinates, with a following camera on narrow screens.
- Animated walking, climbing and carrying; waving civilians; layered flames, smoke, sparks, water jets, wet street and engine lights.
- Two ladder routes, four incident layouts, fire spread in later missions, air and water resources.
- Rescue-delivery scoring, correct terminal states, mission selection, ratings, pause and retry.
- Touch hold controls, keyboard controls, optional synthesized sound, reduced-motion support.
- Network-first service worker and versioned local assets for updated offline play.

The original home-screen icon assets are retained. All in-game artwork is drawn in Canvas; there is no external art dependency. Fonts have system fallbacks.

## Test

`npm test` runs deterministic Node tests for the engine, including completing all four missions through movement/spray/rescue actions, delivery accounting, hose constraints, refills, ladder constraints, failure states and fire spread. Browser validation is recorded in VERIFICATION.md.

## Structure

- `src/engine.mjs`: state and simulation, independent of the browser
- `src/art.js`: scene, characters, camera and effects
- `src/app.js`: input, UI, audio, persistence and animation loop
- `style.css`: responsive shell and menus
- `tests/game.test.mjs`: engine regression tests

Scope: four authored incidents rather than an endless game; no network multiplayer or cloud saves. Full physical-device compatibility and player enjoyment require external playtesting. The GitHub main branch and existing GitHub Pages release remain unchanged until the pull request is merged.
