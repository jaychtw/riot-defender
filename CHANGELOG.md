# Change log

## 1.1.0 — International Landmarks & Customizable Arenas

- Added selectable Forbidden City, Blue Mosque, Longshan Temple, and St. Peter’s Basilica alongside the Louvre, with original text-free frontal SVG illustrations. The original Louvre remains the primary visual style reference; concept crops and the overview board are reference-only.
- Added independent square, rectangle, octagon, stepped irregular, and analytic circle perimeters through one shared arc-length/collision abstraction. All 25 pairings are available, with optional recommendations and safe artwork placement.
- Added persisted landmark, perimeter, duration, and intensity settings; a phone-friendly setup panel; complete English/Traditional Chinese switching; and canonical `zh-TW` with compatibility for saved `zh-Hant` preferences.
- Preserved the v1.0 gate width/speed, physical collision radius, unit drawing scale, spawn-pressure formula, firing cadence, blue waiting/recruitment behavior, red touching-versus-approaching distinction, half-perimeter Switch, and automatic timer-zero victory finale.
- **Intentional correction:** v1.0’s square projection sometimes chose a farther corner instead of the nearest segment for corner-adjacent threats. Projection now minimizes true Euclidean distance to the actual perimeter, as required by the v1.1 GDD. This can change which red is eliminated first, including in square/Louvre mode; it does not change elimination rate or spawn difficulty parameters. Regression snapshots preserve recruitment, unit counts, elapsed time, and firing cadence while explicitly allowing this corrected target order.
- Continuous contact timing now checks gate exposure at and after the exact within-step contact time, rather than only at the end of the substep. This prevents missed admissions when the opening closes just after contact, while preserving avoidance when it closes before contact. Already-waiting blues also detect an opening that passes during the step.
- Re-entrant corners trim the outside offset used for spawning and red fence-following so physical cores remain outside adjacent fence segments. The circle uses exact geometry rather than a polygon approximation. Artwork may resize between shapes; it never rotates into a top-down view.
- Added deterministic geometry/collision tests, all 45 shape/duration/intensity seeded survival checks, the 100-combination browser matrix, and desktop/phone bilingual screenshot evidence.

## 1.0.0 baseline

Louvre square arena; 60/90/120-second watches; Calm/Normal/Chaos; bilingual UI; keyboard and reliable touch controls; improved unit visibility; and clean original Louvre artwork.
