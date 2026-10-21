# RIOT DEFENDER
## Game Design Document — v1.0
### Chapter One: Louvre Defender

**Status:** Implementation-ready baseline, with tunable numerical parameters identified below  
**Platform:** Desktop-first web browser (keyboard); responsive presentation where feasible  
**Core genre:** Minimalist perimeter-control / tower-defense variant  
**Creative principle:** Simple appearance, sophisticated behavior, immediate visual readability.

## 1. Vision and scope

Protect a culturally valuable landmark by continuously repositioning **one opening in a square perimeter fence**. Admit blue defenders and keep red intruders outside. Every blue defender who reaches the central defense point increases automatic firepower. Survive until the cavalry arrives; the finale automatically clears the remaining threat.

The game should be approachable, replayable, and satisfying. **The moving opening is the player's primary control and strategic resource.** Do not expand v1.0 into a conventional tower-defense game with aiming, upgrade menus, weapon inventories, or multiple maps.

**Definitive title:** *Riot Defender*  
**v1.0 chapter title:** *Chapter One: Louvre Defender*  
**Win:** Countdown reaches zero without any red entering the compound.  
**Lose:** Any red crosses into the protected compound through the opening. Immediate, clearly communicated defeat.

This is a fictional arcade scenario, **not a reenactment of a specific Paris event**. Red circles represent fictional hostile intruders threatening the landmark; they do not represent peaceful demonstrators or any real ethnic, national, political, or religious group.

## 2. Visual direction

### 2.1 The building is the star

The user-provided Louvre reference image is the **authoritative art-direction reference** for the protected landmark. Its key properties:

- **Frontal elevation**, as shown in the reference; do not convert the building into top-down or isometric perspective.
- Recognizable Louvre palace wings, central pavilion, arches/windows, rooflines, and glass pyramid.
- Elegant, crisp, vector-like architectural illustration; warm stone, restrained shadows, rich detail without photorealism.
- Subtle ground/contact shadows and tonal shading can suggest **fake 2.5D depth**, but must **not distort the frontal perspective**.
- The architecture should be exquisite and clearly more detailed than the surrounding gameplay objects.

The square compound, fence, and moving dots may be rendered in schematic top-down space while the landmark remains a stylized frontal elevation. This deliberate mixed-perspective composition is expressive, not an error to be corrected. Maintain clarity of collision geometry despite the decorative projection.

**Asset handoff requirement:** The reference image must actually be attached to Codex or committed in the working repository. Do not assume Codex can see images supplied in a separate ChatGPT conversation. If copyright/reuse rights are uncertain, use the image as a style reference and produce an original, independently created illustration rather than copying or redistributing it.

### 2.2 Other visuals

- Neutral, understated courtyard and surroundings; strong separation between inside and outside.
- Fence: square, clearly visible, with one visibly moving gap of approximately **20% of a side** (initial tuning value).
- Red intruders: red circles, approximately **10 px diameter at the reference gameplay resolution** (scale responsively).
- Blue defenders: blue circles, same approximate diameter, easy to distinguish.
- Defense apparatus: **optional**. An invisible center-origin defense system is acceptable and preferred over an apparatus obscuring the building. A tiny circle/drone is an alternative only if unobtrusive.
- Fire: brief thin dash/line from central defense origin to target; expressive only, no ballistic simulation required.
- Clear countdown, admitted blue count, and effective eliminations/second; no text-heavy HUD.
- Final cavalry animation: conspicuously overwhelming and celebratory, but short, readable, and inexpensive to render. It can use stylized motorcade/helicopter silhouettes or abstract reinforcement effects; no realistic violence or gore.

## 3. Core controls

| Input | Effect |
|---|---|
| Left arrow | Move opening **counterclockwise** along the fence perimeter while held |
| Right arrow | Move opening **clockwise** along the fence perimeter while held |
| Space | **Instantly teleport** opening to the opposite point of the perimeter |

The opening moves **continuously** along all four sides, including corners, rather than snapping between sides. Model its center using a cyclic perimeter coordinate `s ∈ [0, 4L)`, where `L` is fence side length. Gate width `g ≈ 0.2L`, measured along the perimeter, remains continuous around corners. A gate straddling a corner must expose the appropriate lengths on both adjacent sides.

Space sets `s = (s + 2L) mod 4L`. This **does not sweep** across intervening perimeter positions; only the origin and destination states exist for collision purposes. At the destination, a red already touching the newly exposed fence segment can enter immediately.

Initial gate movement speed is a **playtest-tunable parameter**. Prevent browser scrolling on arrow keys and Space during gameplay; support key hold and release cleanly.

## 4. Entities and movement

### 4.1 Blue defenders

- Spawn outside the compound, at varied positions.
- Travel **quickly in a straight line aimed at the central defense point**.
- If their straight-line path meets a closed fence, stop at that **exact fence contact position** and wait. Do not reroute along the fence.
- If the opening exposes their contact point, move through the opening and resume toward the center.
- A blue counts as **admitted for firepower only upon reaching the central defense point**, then disappears into the defense system. This avoids counting someone still crossing the compound.
- Blues cannot harm the landmark. They do not collide with reds as a gameplay mechanic.

### 4.2 Red intruders

- Spawn outside the compound and move **more slowly than blue defenders**.
- Wander in irregular, zigzagging, unorganized paths generally biased toward the compound.
- At a closed fence they cannot penetrate. They may wander along the fence, reverse, bounce back, pause near it, or approach again. They do **not** possess perfect knowledge of the moving opening.
- Reds near the opening may rush toward it; their motion must remain visually legible and physically grounded.

**Critical red/fence interaction — two cases:**

1. **Touching / pressing against fence:** A red whose collision circle is already in contact with a closed fence is conceptually trying to rush in. If the moving or teleported opening exposes its contact position, the red **enters immediately and the player loses**. No grace timer.
2. **Stopped short with a visible gap:** A red whose circle is visibly separated from the fence must **physically traverse the gap** after an opening appears. If the player moves the opening away before the red reaches the perimeter, it stays outside. If it reaches an open section before closure, it enters and the player loses.

Implement this from geometric position and movement, not an arbitrary countdown. Use collision-circle-to-fence contact consistently, and avoid invisible gaps or deceptive hitboxes. For a moving gate, evaluate swept gate exposure across a frame so rapid movement cannot silently skip a contact red. **Exception:** Space teleportation exposes only its destination, never the intermediate perimeter.

When a red enters, display a clear entry/crossing moment or indicator and immediate loss feedback. Do not make a collision feel arbitrary.

## 5. Automatic defense system

Let `B` be the number of blue defenders who have reached the central defense point.

**Elimination capacity:** `B red units / second` while red targets exist. Examples: `B=0 → 0/s`, `B=1 → 1/s`, `B=10 → 10/s`.

- Use a continuous firing accumulator / cadence (for `B>0`, approximately one elimination per `1/B` seconds), not one large synchronized batch per second.
- **Target the red closest to the fence/perimeter first**, rather than closest to the center. Distance means minimum distance to the square's boundary; this prioritizes immediate threats.
- Firing can target any red visible in the active playfield outside the compound; **no firing-radius mechanic** in v1.0.
- Each elimination draws a brief, thin line from the central defense origin to the target. The apparatus need not be visible.
- Remove the targeted red on impact; simple disappearance/fade is enough. Avoid gore.
- Target acquisition and removal must be deterministic under seeded test runs.

The defense may be visually overpowered late in a successful run. This is an intentional reward for successful blue admission.

## 6. Time, spawning, and escalation

### 6.1 Player-configurable setup

Expose two **presets**, with these initial values:

| Setting | Options | Default |
|---|---|---|
| Cavalry arrival | **60 / 90 / 120 seconds** | **90 seconds** |
| Riot intensity | **Calm / Normal / Chaos** | **Normal** |

Initial red spawn-rate multipliers: Calm `0.6×`, Normal `1.0×`, Chaos `1.6×`. These are **tuning hypotheses**, not final promises of balanced difficulty. Label presets in natural language; don't require players to input numeric dots/second. Blue spawning remains game-controlled.

### 6.2 Escalation

- Red spawning increases as time elapses to create rising pressure and spectacle.
- The director may additionally scale red arrivals **in response to established turret capacity** to keep the late-game visually active. This is intentional theatrical pacing, but must not silently guarantee victory or manufacture unavoidable defeats.
- The player can always lose by exposing the gate to a red; increasing firepower must not eliminate that core risk.
- Avoid sudden unavoidable spawn/contact events. Spawns occur at readable positions outside the fence, not inside or already touching it.
- Use a cap on active units and efficient pooling/drawing to preserve performance. Adjust spawn rates and cap via playtesting.
- The countdown is the authoritative win trigger. The player **does not** need to manually clear all reds before time runs out.

**Balance goal:** A novice can understand why they lost; an attentive player can reliably survive the default 90-second Normal game; successful recruitment creates a satisfying acceleration of defensive power. Test all nine setting combinations for basic playability, but optimize balance primarily for the default.

## 7. Win, loss, and game flow

1. **Title / setup:** `RIOT DEFENDER — CHAPTER ONE: LOUVRE DEFENDER`, choose duration and intensity; show concise controls and objective.
2. **Start:** Countdown begins, reds and blues spawn; center defense initially inactive (`B=0`).
3. **Play:** Rotate/teleport gate; admit blues, exclude reds; turret automatically removes nearest-perimeter reds at `B/s`.
4. **Loss:** The instant any red crosses through the opening into the compound, stop the simulation; clearly show breach location and **Defeat** with Restart.
5. **Victory:** When timer reaches `0`, **freeze player control and switch to a short automatic reinforcement finale**. Show cavalry arriving and an overwhelmingly effective center defense removing **all remaining red units**, then display **Victory / Landmark Protected**. No further player actions required.
6. **Replay:** Return to setup or restart using the selected settings.

A win at countdown zero is definitive: no post-zero breach can reverse it. The finale is a cinematic payoff, not an extra playable phase.

## 8. Presentation, accessibility, and implementation

- Desktop-first Canvas or SVG/DOM hybrid; choose a simple performant architecture.
- Red/blue identity should be reinforced by optional small shape/outline differences or labels in a legend, rather than relying solely on color.
- Use high-contrast UI, visible focus states for menus, readable typography, and reduced-motion consideration for flashes.
- Pause on loss/victory; optionally pause when browser tab becomes hidden to avoid unfair defeat.
- Keep game state and simulation separate from rendering for deterministic tests.
- Use delta-time movement with safe maximum timestep; avoid frame-rate-dependent gate speed, spawn counts, or defense cadence.
- Keep chapter identity, landmark art, background palette, and scenario parameters in configuration rather than hardwiring them throughout gameplay. **Do not implement additional chapters in v1.0.**
- Avoid unnecessary graphic violence and real-world group stereotyping.

## 9. v1.0 acceptance criteria

**Visual**
- Louvre reference is actually available to implementer; final original art follows frontal elevation and rich-but-clean architectural detail.
- Building is not obstructed by turret UI, gate, or defense lines.
- Fence and opening are readable on all sides and while crossing corners.

**Mechanics**
- Holding Left/Right moves one continuous opening correctly around all four corners.
- Space teleports exactly half a perimeter; no intermediate gate exposure.
- Blues follow straight lines, wait at closed contact points, enter when opened, and increment `B` only upon reaching center.
- Reds zigzag/wander, interact physically with closed fence, and behave correctly in both touching and visible-gap cases.
- One red inside means immediate loss, with no hidden collision.
- Defense rate approximates `B/s`, prioritizes nearest perimeter threat, and visibly shoots.
- Countdown victory triggers the automated clearance finale at precisely zero.

**Quality**
- Default 90s Normal mode is winnable through skill and repeatable with seeded scenarios.
- 60/90/120 and Calm/Normal/Chaos configurations function.
- No runaway spawning, severe frame drops, or gameplay-blocking browser errors.
- Working restart, deployment, and clear controls.

## 10. v1.1 — international chapters (planned, not v1.0 scope)

If v1.0 plays well, proceed to **v1.1 international locale expansion** instead of indefinite Chapter One polishing.

Build on a chapter configuration system with distinct architecture and surroundings. Potential landmark categories include **museums, palaces, cathedrals, mosques, Chinese temples, and other culturally meaningful sites** across regions. Do not make Christian or Western landmarks the implicit default for what deserves protection. Treat every location with comparable artistic care and dignity; avoid cultural caricatures and scenarios that conflate communities with attackers. Research local architecture and contextual details before producing assets. Exact locations and chapter count are **not yet selected**.

## 11. Explicitly deferred

No aiming controls, ammo, manual turret upgrades, multiple gates, weapon inventory, realistic riots, real-world political factions, multiplayer, mobile touch controls as a release requirement, or additional international maps in v1.0.

---

**Art reference handoff checklist (do not skip):** Attach the user's Louvre image directly in the Codex task or add it to the repo at `assets/references/louvre-style-reference.png`; explicitly tell Codex to inspect it. Do not assume access from this ChatGPT conversation. Confirm the rights to redistribute before committing the original reference; if unsure, attach it privately instead.
