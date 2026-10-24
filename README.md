# Unsung Heroes — Into the Smoke

A browser firefighter arcade game built as four levels. Each level is two stages: an exterior ladder mission is the prelude, and clearing it is what opens that level's first-person 3D interior. Finishing the interior opens the next level. The renderer is bundled Three.js 0.170.0 (MIT; license in vendor/THREE-LICENSE.txt). No external game assets or runtime CDN dependency: wall, floor and ceiling textures, flame and smoke sprites, and the fire and water audio beds are all generated at runtime in `src/fx.js`.

## Play
Open index.html through an HTTP server. WASD moves; drag the scene to look; arrow left/right turns; Space sprays; E rescues or operates equipment; T toggles thermal scan; P pauses. Touch controls are provided. Return to the green stairwell to evacuate carried survivors and refill air/water. Clear all fires, rescue all people and complete the special objective to win. Levels unlock in order.

## Levels

Each level is a different building **and** a different job. The shared parts are movement, the hose, air and the
stairwell; what counts as winning, what kills you and what `E` does all come from the mission's type.

| # | Prelude (exterior) | Interior | Job |
|---|---|---|---|
| 01 | Mariner House | Behind the door | **Search & rescue** — everyone out, fire out |
| 02 | Quay Four | Dead in the water | **Vessel fire** — shut the fuel cock and save the hull |
| 03 | The Grand Hotel | Cause and origin | **Fire investigation** — a cold scene, read it and call the origin |
| 04 | Last Light Tower | Live load | **Gas containment** — valves down before the line goes |

Every floor is 21x15 - a little over twice the old footprint - with its own plan: landings of flats, a quay with a
vessel moored alongside, a hotel floor around a burnt-out ballroom, and switchgear aisles. Each has two stairwells,
because one exit on a floor that size is spent walking.

Two of them run a second clock beside the mission timer. On the boat the **hull** burns through while she is alight,
so every seat of fire you leave is hull you do not get back. In the switch room the **line pressure** climbs with every
valve still open and falls once they are all shut — leave it and the room goes, long before the mission timer matters.

The investigation has no fire at all. Examine all three pieces of evidence, then stand at the seat you believe it
started and call it. Two wrong calls and the scene is released as undetermined.

Progress lives in `unsung-heroes-campaign-v1`. Saves from before the campaign restructure are migrated on first load.

Fires in the second and third missions spread to nearby cells over time, so a slow search costs you. Each run is rated out of three stars and the results screen shows how far you are from the next one.

Timeout triggers a five-second exterior collapse animation before results. Best scores stay in local storage. Existing exterior mission saves are retained. WebGL support is required for 3D; classic.html provides the 2D missions.

Fictional arcade game, not operational training.
