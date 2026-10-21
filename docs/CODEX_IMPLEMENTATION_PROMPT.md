# Codex implementation prompt — Riot Defender v1.0

Build **Riot Defender — Chapter One: Louvre Defender** as a complete, playable desktop-first browser game. Read the attached **`RIOT_DEFENDER_GDD_v1.0.md`** in full and treat it as the authoritative specification.

## IMPORTANT — IMAGE HANDOFF (USER ACTION REQUIRED)

**I will attach the Louvre reference image separately to this Codex task.** Before implementing the artwork, confirm that you can actually view the attachment. If it is missing, **ask me to attach it**; do not guess the visual style from the GDD alone. If I supply the image in the repository, it will be at `assets/references/louvre-style-reference.png`. If image reuse rights are uncertain, create an original illustration inspired by the reference's general style, not a copy of its protected artwork.

The image is the visual authority for the building: **frontal elevation, recognizable Louvre palace and pyramid, exquisite clean vector-like architectural detail, gentle fake-2.5D shadows but NO perspective distortion**. Keep the landmark visually dominant. Dots and gate remain minimal. A visible turret is optional; prefer invisible center-origin firing lines over obscuring the building.

## Implementation priorities

1. **Core gate geometry:** one continuous gap, initially 20% of one fence side, slides smoothly around all square sides and corners. Left = counterclockwise, Right = clockwise, Space = instantaneous opposite-perimeter relocation with **no exposure during teleport**.
2. **Unit behavior:** fast straight-line blue defenders wait at closed fence contact points and proceed to center when admitted. Slower red intruders zigzag, wander, bounce or follow fence. Red touching the fence enters immediately when exposed; red with a visible gap must physically traverse it and can be saved from by moving the opening away. One red entry = immediate loss.
3. **Defense:** each blue that reaches center adds one red elimination/second. Prioritize red targets closest to fence, fire from center with brief thin line effects, and remove targets smoothly. Zero blues means no firing.
4. **90-second default survival:** configurable 60/90/120 seconds and Calm/Normal/Chaos red spawn presets. Increase red pressure over time, optionally responding to established defense strength to create satisfying spectacle while keeping outcomes fair.
5. **Finale:** at zero, freeze controls, automatically show cavalry/overpowered defense eliminating every remaining red, then Victory. No extra playable cleanup.
6. **UI/quality:** concise readable start instructions, timer, blue/defense count, defeat/restart, victory/replay. Preserve chapter-friendly architecture for future international landmarks, but **implement only the Louvre chapter** now.

## Work method

- Inspect the repository, or initialize a minimal browser-game project if empty.
- Briefly outline the architecture and tunable parameters before coding; then proceed autonomously.
- Build a **static visual proof** first using the actual reference, inspect a screenshot, and verify that the Louvre remains a recognizable frontal elevation inside the schematic arena. Then complete gameplay.
- Separate simulation logic from drawing. Use seeded scenarios or deterministic test helpers.
- Test continuous gate/corner behavior, opposite-side teleport, both red breach cases, blue fence waiting and center arrival, `B/s` firing, nearest-fence targeting, all configuration choices, loss, and zero-time victory finale.
- Run browser checks, capture screenshots of opening/gameplay/victory/defeat, fix major issues, and report known limitations.
- Commit and deploy through the repository's existing workflow if available and permitted; otherwise give exact run/build steps and playable artifact location.
- **Stop at a stable v1.0.** Do not invent extra features or international chapters. We will consider v1.1 after the user validates v1.0.

## Definition of done

A player can start a 90-second Normal game, continuously reposition the single gate, admit blue units, see proportionally increasing automatic firepower, lose fairly when a red crosses, or survive until a cinematic automatic cavalry victory. The landmark is visually exquisite and matches the supplied frontal-elevation style reference. The game runs reliably and is ready to playtest.
