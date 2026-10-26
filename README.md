# Unsung Heroes — Into the Smoke

A browser firefighter arcade game built as four levels. Each level is two stages: an exterior ladder mission is the prelude, and clearing it is what opens that level's first-person 3D interior. Finishing the interior opens the next level. The renderer is bundled Three.js 0.170.0 (MIT; license in vendor/THREE-LICENSE.txt). No external game assets or runtime CDN dependency: wall, floor and ceiling textures, flame and smoke sprites, and the fire and water audio beds are all generated at runtime in `src/fx.js`.

## Play
Open index.html through an HTTP server. WASD moves; drag the scene to look; arrow left/right turns; Space sprays; E rescues or operates equipment; T toggles thermal scan; P pauses. On a phone or tablet a floating analog thumbstick appears wherever your left thumb lands; the right half of the screen drags the view, and the hose and interact buttons sit on the picture under your right thumb. The arrow pad is hidden on touch screens. Return to the green stairwell to evacuate carried survivors and refill air/water. Clear all fires, rescue all people and complete the special objective to win. Levels unlock in order.

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

## Mobile field kit
Settings offers Auto/Battery saver/High detail graphics, automatic or explicit touchscreen controls, and look sensitivity. Touch controls support a left floating analog stick with a dead zone; the right side looks around, and holding then dragging the hose button aims while spraying. Settings pause the mission. Both safe exits appear on the map. Portrait and landscape layouts retain the mission timer and secondary hull/pressure readings. Texture anisotropy, readable civilian details and a visible gloved hose hand improve presentation; a nearby-light budget and reduced water particles in Battery saver limit rendering cost.

Validation: 53 tests pass, including the existing campaign/exterior/interior tests and four new input/graphics tests. Browser checks used 390x844 portrait and 844x390 landscape fixtures; no horizontal overflow was measured, held spray consumed water, settings persisted, and the canvas remained aligned after menu navigation. Fixtures were removed. Physical iOS/Android multi-touch and GPU performance still require device testing.

## Seven-level casework expansion

The public release target remains https://3184ff-eng.github.io/Firefighter-game/.
Seven paired exterior/interior levels (14 stages) include Waterworks, Ashes & Alibis,
and Freight Terminal. Existing four-level campaign and exterior saves are extended.
The hotel and archive each have five recoverable exhibits and four linked casebook
puzzles. Pump routing/flow balancing and circuit isolation/access sequencing add
four operational puzzles, for twelve total. These are authored fictional scenarios,
not real-world operating procedures. Hotel cause remains Undetermined; the archive
has an explicitly fictional lab finding supporting Accidental, with a custody gap
recorded as a limitation. Origin and cause are separate findings.

Open **Casebook / Tasks** (J) to review collected records. Cold-scene puzzles unlock
after evidence collection; operational puzzles are accessed at the blue terminal
beside entry. The clock pauses while reading/solving. Hints, retry feedback and
completed explanations remain available. Solving puzzles is required for completion.

Design references: Supergiant's [Hades FAQ](https://www.supergiantgames.com/blog/hades-faq/)
for challenge, expression and replayability; NIJ's
[Guide for Investigating Fire and Arson](https://nij.ojp.gov/topics/articles/guide-investigating-fire-and-arson)
for evidence preservation, testing hypotheses and considering alternatives. These
informed the design; they do not establish retention, revenue or dopamine outcomes.

Validation: 58 Node tests pass, including simulated completion of all seven interior
and exterior missions, save expansion, puzzle gating, malformed answers, repeat-score
prevention, and system-gated suppression. A local 390×844 browser fixture verified
casebook opening, ordered selections and progression from timeline to preservation.
The fixture pre-collected evidence only for UI testing and is not shipped. Physical
multi-touch iPhone/Android testing remains outstanding.

## First Response driving level

Open `response.html`, also linked prominently from both mission menus. This standalone
level preserves the seven existing paired incidents. Answer dispatch at Station 04,
board the engine, follow a live GPS street route around three closures and crossing
traffic, then brake inside the destination zone before the 100-second clock expires.
Timeout triggers a five-second collapsing-building cutscene before the loss screen.
Arrival offers a link to the existing Mariner House exterior rescue. Best response
score is stored separately and never changes existing campaign locks or records.

Keyboard: W/up accelerate, S/down reverse, A/D or left/right steer, Space brake,
P pause. Touch controls support separate held pointers for steering and throttle.
Blur/hidden-page pauses prevent a background countdown. Optional synthesized siren.
Textured streets/buildings, detailed truck fittings, rotating wheels, smoke and
layered flame effects are procedural and require no external assets or GPS service.
The map is fictional; it never requests device location.

Validation: 64 automated tests pass, including dispatch gates, GPS closure avoidance,
collision response, timed collapse, stopped arrival and a driven route completing
inside the deadline. Browser verified dispatch, boarding, keyboard movement and GPS.
An accelerated local-only fixture exercised the phone collapse path; its original
camera was obstructed, and the production camera was moved to the open east side.
The final graphics revision still needs visual verification because the browser
connection stopped responding. Physical multi-touch device testing is outstanding.

## Level 08 integration and timer clarification

First Response is now numbered Level 08 in the main mission list and has a prominent
launch card above the main game. `/?mission=first-response` hosts the driving level
inside the main game URL. Existing seven incident indexes and saves remain unchanged.
The timer explicitly displays seconds (100s), resets to the full 100 on departure,
and stays stopped during the station briefing. Browser verification measured 100s
before departure and 90s after ten seconds driving. 65 tests pass, including full
100-second countdown tests at 30/60/120fps. The obsolete localhost QA tab used a 1.8s
collapse timer; it was closed and is never part of the public deployment.

## Expanded city response

Level 08 now spans 42 city blocks across Dockside, Old Town, Market District and
Riverside. Twenty-one closures force staggered detours, eighteen vehicles share the
roads, and a railway barrier closes for five seconds in each sixteen-second cycle.
GPS shows the route, closures and crossing state; district, remaining distance and
escalating radio warnings help the player respond. The full 100-second timer starts
only on departure. Static scenery is instanced and window textures are shared to
reduce rendering overhead. The expanded route has a separate best-score record.

Validation: 67 automated tests pass, including all junctions reaching the incident,
traffic staying on open segments, railway collision timing, a complete drive with
traffic and railway active within 100 seconds, and countdown checks at 30/60/120fps.
Local browser checks confirmed the expanded GPS and dispatch/boarding presentation.
Physical iPhone/Android multi-touch and frame-rate testing remain outstanding.

## Joystick and high-rise exterior update

Driving now has a visible proportional joystick: up accelerates, down reverses,
and left/right steer. DRIVE, REVERSE and BRAKE buttons remain available for a
second finger. Pointer release/cancel, pause and focus loss reset joystick input.
Keyboard controls and the 100-second response deadline are preserved.

Exterior incidents now have 3, 4, 6, 8, 5, 6 and 7 storeys respectively. A vertical
camera follows the climb. Rolling debris warns before spawning and before dropping
to the next floor, reverses direction on each ledge, and leaves both ladders clear.
Hose it away for 50 points, or shelter at a ladder while carrying a civilian. Hits
cost 12 air with a 1.5-second cooldown. Mission timers accommodate longer rescues;
existing incident indexes and campaign progress remain intact.

Validation: 71 Node tests pass, including completion of all exterior missions,
analog driving, debris warnings/collisions/clearing and roof camera bounds. Local
browser verified joystick acceleration, braking and climbing to floor eight with
no reported console errors on the exterior page. Physical phone multi-touch and
performance testing remain outstanding.
