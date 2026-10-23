# Verification — 2026-10-23

## Automated

`node --test tests/*.test.mjs`: 7 passing tests. Includes all four campaign missions completed through normal movement/spray/interact simulation, exactly-once rescue delivery, no scoring after terminal state, hose facing/floor/range/resource rules, carrying restrictions, equipment refill, two ladders, failure freeze and bounded fire spread.

## Browser

Desktop: completed Mariner House with held keyboard inputs, extinguished fire with Space, picked up both civilians with E, delivered them to the safe zone, and reached a three-star result. Rescue total 2/2 and score 1695 in the observed run. Next incident loads correctly. Pause held the clock at 3:15 across separate checks. Sound toggle changed state. Graphics inspected during civilian carrying.

Mobile viewport: inspected in a 390×844 iframe using the same game source. Document width and scroll width both measured 390 pixels. Held the on-screen climb button and observed the firefighter reach a floor. Touch controls use Pointer Events with capture and cancellation cleanup; tap/hold controls do not depend on keyboard access. Browser viewport emulation does not replace testing on physical iOS/Android devices.

## Limits

No observed retention, monetization, App Store approval or real-player enjoyment claims. Four missions and deterministic layouts are the implemented scope. Optional audio synthesized in Web Audio; the sound toggle was checked but audio quality has not been judged on physical speakers/headphones.
