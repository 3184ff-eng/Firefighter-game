# Unsung Heroes — Into the Smoke

A browser firefighter arcade game with three first-person 3D missions and the original four exterior ladder missions. The renderer is bundled Three.js 0.170.0 (MIT; license in vendor/THREE-LICENSE.txt). No external game assets or runtime CDN dependency: wall, floor and ceiling textures, flame and smoke sprites, and the fire and water audio beds are all generated at runtime in `src/fx.js`.

## Play
Open index.html through an HTTP server. WASD moves; drag the scene to look; arrow left/right turns; Space sprays; E rescues or operates equipment; T toggles thermal scan; P pauses. Touch controls are provided. Return to the green stairwell to evacuate carried survivors and refill air/water. Clear all fires, rescue all people and complete the special objective to win. All three 3D missions are unlocked.

1. Behind the door: apartment search and rescue.
2. Pressure point: warehouse search with gas isolation before complete suppression.
3. Lights out: garage search with emergency-power restoration.

Fires in the second and third missions spread to nearby cells over time, so a slow search costs you. Each run is rated out of three stars and the results screen shows how far you are from the next one.

Timeout triggers a five-second exterior collapse animation before results. Best scores stay in local storage. Existing exterior mission saves are retained. WebGL support is required for 3D; classic.html provides the 2D missions.

Fictional arcade game, not operational training.
