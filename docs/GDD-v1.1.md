# RIOT DEFENDER — Game Design Document v1.1
**Status:** Design-approved direction; engineering implementation pending  
**Product:** Riot Defender  
**Release:** v1.1 — International Landmarks & Customizable Arenas  
**Authority:** This GDD specifies product behavior. Existing v1.0 source and tested mechanics are the implementation baseline. Do not silently change established rules.

## 1. Product intent
Riot Defender is a short, readable, lightly abstract perimeter-control survival game. The player rotates a single gap in a defensive fence to admit blue defenders while keeping red fictional intruders outside until reinforcements arrive. The landmark is an exquisite architectural centerpiece; the moving dots, fence, and thin defensive firing strokes are deliberately simple.

**v1.1 differentiator:** Players independently choose a landmark and perimeter shape, as well as reinforcement arrival time and riot intensity. Curated landmark presets provide an inviting starting point, not a locked campaign. This is **not** five bespoke games.

**Respectful framing:** Landmark choices celebrate cultural and architectural heritage across regions and faiths. Fictional red intruders have no assigned religious, ethnic, or national identity. The game must not suggest that real protesters or religious groups are inherently violent. No real-world security layouts or operational procedures are represented.

## 2. Inherited v1.0 gameplay (preserve)
- Single movable opening in a closed perimeter. Left / counterclockwise and right / clockwise move continuously along the boundary; Space / Switch instantly relocates to the point halfway around the *perimeter arc length* (not necessarily screen-opposite).
- On mobile: three side-by-side, comfortably sized controls: **↶ | Switch | ↷**; directional buttons support press-and-hold and cancel cleanly on release, pointer cancel, blur, and pause. Desktop keyboard continues to work.
- Blue dots travel quickly along a straight line toward the defense center; if stopped by a closed fence, wait at their contact location. When the opening admits them, they proceed inward and add permanent defensive power upon reaching the center.
- Red dots move more slowly, irregularly and with zigzags; at closed fences they may wander along the boundary, reverse, or bounce back. If touching the boundary when the gap exposes their contact position, entry is immediate and the player loses. If visibly short of the fence, they must travel the remaining distance; moving the opening away in time can prevent entry.
- Defense auto-targets the **red unit with the smallest distance to the protected perimeter**, not simply the closest to the visual center. With N blue defenders admitted, defense capacity is N red eliminations per second, limited by available targets. Brief thin firing dashes originate unobtrusively from the center; no visible turret is required.
- Red arrival pressure ramps with elapsed time and can respond to accumulated defensive power for dramatic, fair spectacle. Keep the balance transparent enough that players can still lose through risky gate placement.
- **Lose:** one red intruder crosses into the protected area. **Win:** survive until the configured timer reaches zero; then show an automatic reinforcement arrival and overwhelming final clearing animation, followed by victory. No additional player combat phase.
- Preserve existing collision geometry, difficulty behavior, settings, and UI unless changes are necessary to support a new perimeter; document all intentional differences.

## 3. v1.1 feature scope
### 3.1 Four independent setup choices
| Field | Values | Default |
|---|---|---|
| Landmark | Louvre; Forbidden City; Blue Mosque; Longshan Temple; St. Peter’s Basilica | Louvre |
| Perimeter | Square; Rectangle; Octagon; Irregular; Circle | Landmark's recommendation, initially Square |
| Reinforcement arrival | 60 / 90 / 120 seconds | 90 s |
| Riot intensity | Calm / Normal / Chaos | Normal |

When the user selects a landmark, initially apply its recommended perimeter. If the user then changes the perimeter, respect that override. Clearly indicate the recommended option; never force a landmark/shape pairing. Preserve selected settings across sessions when feasible. Do not reset settings unexpectedly when changing language.

### 3.2 Landmark presets and identity
| Landmark | Place | Recommended perimeter | Visual signature |
|---|---|---|---|
| Louvre | Paris, France | Square | Classical palace wings and glass pyramid |
| Forbidden City | Beijing, China | Rectangle | Red walls, imperial gates, layered golden roofs |
| Blue Mosque (Sultan Ahmed Mosque) | Istanbul, Türkiye | Octagon | Central dome, cascading domes, slender minarets |
| Longshan Temple | Taipei, Taiwan | Irregular | Ornate sweeping roofs, carved details, richly layered temple façade |
| St. Peter’s Basilica | Vatican City | Circle | Central dome, monumental façade and colonnade motifs |

These pairings are **fictional arena geometry**, not actual fence or security configurations at the sites. All landmarks should receive comparable illustration quality and visual dignity. No mandatory progression or locked chapters.

## 4. Art direction and asset handoff
- Use the user's supplied Louvre image as the **primary style authority**: elegant **frontal elevation**, simplified vector-like geometry, restrained palette, recognizable details, no embedded text, subtle shadows for a faux 2.5D feel **without changing the frontal perspective**.
- The attached five `*_style_reference.png` files are **generated concept crops** for direction and recognition, not final production assets. They are low-resolution enlarged crops from `overview_concept_board.png`; inspect them and create clean, original, sufficiently detailed artwork rather than simply stretching these images in-game. `louvre_user_original_reference.png` is the original user-provided stylistic reference.
- The protected building is visually dominant; game dots, gate, UI, and firing strokes are readable but understated. Both blue and red units must remain legible on mobile, at approximately the improved v1.0 visual scale; do not silently change collision dimensions when changing drawing scale.
- Every landmark must remain recognizable at phone size. Avoid obstructing the architecture with turret art or labels. Preserve visual separation of the frontal building illustration and top-down perimeter mechanics; do not distort the architecture to match the arena.
- Use original illustrations based on architectural features; do not copy unlicensed photographs or proprietary commercial illustrations into the shipped game. If licensing or redistribution of any provided asset is uncertain, use it only as a reference and generate an original implementation.
- Avoid generating labels or letterforms inside illustration assets. Localized names belong in the UI.

## 5. Perimeter geometry specification
### 5.1 Unified path model
Represent every fence as a closed, non-self-intersecting path with total length L, and gate center as normalized arc position u in [0,1). Clockwise/counterclockwise controls adjust u at a calibrated constant physical speed along the path; Switch sets u=(u+0.5) mod 1. The opening is a **continuous arc-length interval** that can straddle vertices or corners. Its width is specified in physical units or a consistent fraction of path length and should remain perceptually comparable across shapes; start from the v1.0 square gate width and calibrate.

Support the following authored, collision-safe paths:
- **Square:** existing baseline.
- **Rectangle:** distinct long/short sides, large enough to fit the landmark.
- **Octagon:** convex eight-sided polygon.
- **Irregular:** simple, stepped, non-self-intersecting polygon; avoid extremely narrow corridors or acute corners that break unit collision.
- **Circle:** smooth closed curve with stable arc-length sampling.

### 5.2 Movement and collision correctness
- No fence holes except the active opening; the moving gap never duplicates or shrinks at corners.
- Collision and red/blue crossing behavior must use actual shape geometry, not a square bounding box.
- Waiting blue dots must remain blocked until their specific contact location is exposed by the gap; do not teleport them to the gate.
- Red dots touching the fence are immediately dangerous if exposed. Red dots with a visible gap must traverse that distance before crossing. Gate motion and instant Switch must not sweep intermediate fence sections open.
- Frame-rate-independent updates and swept/continuous crossing checks are required where necessary to prevent tunneling or missed losses, especially for rapid gate motion and small mobile displays.
- The defense priority metric is shortest distance to the **actual current perimeter**, including curved and stepped sections.
- If a landmark/shape pairing would cause clipping or an unfair corridor, scale and position the **artwork within a safe inner region** without changing its frontal elevation. All 25 landmark/shape pairings must at least load, display, and remain playable.

## 6. UI and accessibility — universal development standard
**Mandatory languages:** English (`en`) and Traditional Chinese (`zh-TW`) from the first implementation, with live switching without restart or loss of game state. Localize landmark names, place descriptions, shape labels, menus, controls, instructions, timer messages, win/loss, settings, and accessibility text. Centralize strings and validate typography, clipping, and both languages on mobile.

**Mandatory mobile:** fully playable by touch with a responsive viewport, large readable units and text, touch targets >=44x44 CSS pixels where practical, no accidental page scroll during held controls, and no keyboard requirement. Support desktop keyboard/mouse. Keep the controls and HUD outside the gameplay field where possible. Respect reduced-motion preference for nonessential animation; provide readable non-color-only explanations/legend for red and blue units where practical. No flashing effects that create accessibility hazards.

**Game states:** menu, playing, paused when appropriate, win animation, win result, loss result, retry, and settings. Predictable restart/quit flow. Store language and settings locally; progress saving is not required for this arcade mode.

## 7. Balancing
- Use the existing v1.0 90s/Normal square/Louvre mode as the baseline.
- Time and intensity are independent. Intensities should be understandable presets; do not expose raw spawn rates to players.
- Scaling to other perimeters should avoid accidental advantage from total perimeter length or sharp turns; tune gate physical speed, gap width, and spawn positions consistently.
- Do not promise equal difficulty across 25 configurations; target fair, distinct experiences and test representative extremes.
- Final reinforcement animation should clearly end the match and must not allow a late collision after victory has been triggered.

## 8. Acceptance criteria and verification
| ID | Requirement | Verification |
|---|---|---|
| CFG-01 | Four settings independent; presets optional | Change landmark then override perimeter; save/reload |
| CFG-02 | All five landmark artworks present and recognizable | Screenshot each at desktop and phone size |
| GEO-01 | Five perimeter shapes playable | Automated geometry tests + browser playthrough |
| GEO-02 | Gate continuity across corners and circle | Slow motion/step test, including gate spanning vertices |
| GEO-03 | Switch exposes only destination interval | Place red at intervening perimeter and switch |
| COL-01 | Red touching gate causes loss | Deterministic collision test for all shapes |
| COL-02 | Red with visible gap can be avoided | Move opening before red reaches boundary |
| COL-03 | Blue waits at actual fence contact point | Test straight approach and opening alignment |
| DEF-01 | N blue = N eliminations/sec; nearest fence threat first | Deterministic target-selection tests |
| END-01 | Timer zero triggers reinforcement clearing and win | End-to-end win test; no post-win loss |
| LOC-01 | EN/zh-TW complete and switchable in-game | Language matrix, overflow screenshots |
| MOB-01 | Mobile touch fully functional | Real mobile browser or device emulation plus touch event tests |
| VIS-01 | Frontal elevation, no embedded text, landmark dominates | Compare screenshots to supplied art references |
| REG-01 | v1.0 Louvre square behavior preserved | Run existing automated tests and replay baseline |

## 9. Delivery and scope discipline
Deliver the updated game, five original landmark assets, configurable arena engine, localized setup UI, automated tests, desktop/mobile screenshots, updated README and change log, deployed playable URL, and a concise report of known limitations. Use the existing repository, test infrastructure, and deployment workflow. **Do not add bosses, weapons, religious factions, campaign progression, monetization, or speculative features.**

## 10. Engineering ambiguity policy
Codex may decide architecture and implementation details, but must flag any uncertainty that changes gameplay, landmark identity, collision fairness, or mobile usability. Prefer a concise plan followed by implementation. For art references, confirm the files can actually be inspected before work begins. No claim of completion without test and screenshot evidence.
