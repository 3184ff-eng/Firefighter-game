# Unsung Heroes — Into the Smoke

A browser firefighter arcade game built as four levels. Each level is two stages: an exterior ladder mission is the prelude, and clearing it is what opens that level's first-person 3D interior. Finishing the interior opens the next level. The renderer is bundled Three.js 0.170.0 (MIT; license in vendor/THREE-LICENSE.txt). No external game assets or runtime CDN dependency: wall, floor and ceiling textures, flame and smoke sprites, and the fire and water audio beds are all generated at runtime in `src/fx.js`.

## Play
Open index.html through an HTTP server. WASD moves; drag the scene to look; arrow left/right turns; Space sprays; E rescues or operates equipment; T toggles thermal scan; P pauses. Touch controls are provided. Return to the green stairwell to evacuate carried survivors and refill air/water. Clear all fires, rescue all people and complete the special objective to win. Levels unlock in order.

## Levels

| # | Prelude (exterior) | Interior |
|---|---|---|
| 01 | Mariner House | Behind the door — apartment search and rescue |
| 02 | Market Street | Pressure point — warehouse, isolate the gas before full suppression |
| 03 | The Grand Hotel | Room to room — hotel corridor, vent the roof hatch |
| 04 | Last Light Tower | Lights out — garage, restore emergency power |

## Exterior preludes

Pick one of four responders before the call. They are original characters, not licensed likenesses, and the pick is a
trade-off rather than a skin: Engine 04 is the baseline, Sentinel climbs far faster, Nightwatch breathes nearly twice
as long but moves heavy, Highline is quickest on foot and burns air fastest.

You cannot carry a civilian through live fire. Knock it down first, and fight it from a stand-off - crowd a hot fire
with the hose and it flares back at you, costing air instead of knocking it down. Fire now spreads on every incident,
though never close enough to seal off a ladder. The clocks are roughly a third of what they were.

Stars earned on the prelude are added to the interior clock: one star +10s, two +20s, three +30s. Fires inside spread
on a timer that shortens with each spread, so neglect compounds; the teaching level escalates least and the final
level most. Spread is bounded — a capped number of new seats, never beside the stairwell, never inside a wall, never
in the last 45 seconds and never once the building is clear.

Progress lives in `unsung-heroes-campaign-v1`. Saves from before the campaign restructure are migrated on first load.

Fires in the second and third missions spread to nearby cells over time, so a slow search costs you. Each run is rated out of three stars and the results screen shows how far you are from the next one.

Timeout triggers a five-second exterior collapse animation before results. Best scores stay in local storage. Existing exterior mission saves are retained. WebGL support is required for 3D; classic.html provides the 2D missions.

Fictional arcade game, not operational training.
