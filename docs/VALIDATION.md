# v1.1 validation and release limits

The written [v1.1 GDD](GDD-v1.1.md) is the product authority. The existing v1.0 simulation tests remain the mechanics baseline. The attached implementation prompt and overview board were treated as handoff/reference material, not as a replacement for the user's scope or the GDD.

## References actually inspected

Before code changes, the complete GDD and implementation prompt were read, and these seven files from `Riot_Defender_v1.1_Handoff.zip` were opened with the image viewer:

- `references/louvre_user_original_reference.png` — primary style authority: frontal elevation, restrained color, fine architectural detail, subtle shading.
- `references/louvre_style_reference.png`
- `references/forbidden_city_style_reference.png`
- `references/blue_mosque_style_reference.png`
- `references/longshan_temple_style_reference.png`
- `references/st_peters_basilica_style_reference.png`
- `references/overview_concept_board.png` — overall direction only; its sample UI and lettering were not used as specifications.

No reference PNG is included in the repository's public assets or deployment. The five shipped illustrations are original SVG geometry, generated from `src/landmark.js` and `src/artworks.js`, with no embedded visible text, raster image, or external dependency. Localized names and accessible descriptions are supplied by the interface. Build output also includes five standalone SVG files under `artwork/`.

## Acceptance coverage

| GDD IDs | Evidence |
| --- | --- |
| CFG-01 | Settings tests exercise all 25 saved combinations, recommendations, manual overrides, invalid/blocked storage; browser matrix verifies reload and language switching without losing selections. |
| CFG-02, VIS-01 | 20 recommended-pairing screenshots: five landmarks × English/Traditional Chinese × desktop/phone; all 100 combinations verify clean, named SVG artwork and a visible field/HUD. Safe artwork bounds are checked against actual geometry. |
| GEO-01, GEO-02 | Shape tests cover closed arc length, wrapped gates, exact traced opening length across vertices, circle arcs, and a full exterior fence-following circuit including re-entrant corners. All 45 shape/duration/intensity seeded survival runs reach victory with a legal controller. |
| GEO-03 | Switch tests check normalized +0.5, no exposure of intervening red contacts, destination breach, and effect placement on the selected shape. |
| COL-01, COL-02 | Every shape tests touching reds, visibly separated avoidance, side/vertex continuous contact, and gate exposure at the actual within-step contact time. |
| COL-03 | Blues wait at their real contact point, remain stationary while blocked, enter when exposed, and reach the center without teleporting. Moving-gate timing is tested. |
| DEF-01 | Target ordering uses shortest actual perimeter distance; firing cadence, no idle banking, and the original nearest-fence rule are covered. The square corner projection correction is explicit in the change log. |
| END-01 | Unit tests and real-input browser playthroughs verify timer zero, locked controls, final clearing, victory, and no post-zero loss. |
| LOC-01 | Complete dictionaries and interpolation checks for `en`/`zh-TW`; live in-game switching and saved `zh-Hant` compatibility. Browser matrix covers both languages on both viewport classes. |
| MOB-01 | Native CDP touch holds/releases, off-button release, cancellation, capture loss, blur/background interruptions, pause/restart/orientation changes, Switch, and desktop key parity. Setup is checked at 320/360/430px; controls stay visible at 844×390 landscape. |
| REG-01 | Original 32 simulation tests, all original configuration survival checks, and three v1.0 seeded snapshots of recruitment, unit counts, elapsed time, gate position, and firing cadence. Corrected corner target ordering is intentionally excluded from exact red identity comparison. |

The local unit run passes **156 tests**. The final production browser suite passes its existing desktop/localization/touch checks plus the **100-combination** device/language/landmark/perimeter matrix. Full production survival is exercised on all five fence types through real input events; CI repeats seven full 90-second acceptance runs, including the square/Louvre baseline in both languages and keyboard/touch modes.

Browser artifacts are generated locally and uploaded by CI as `browser-evidence`:

- `artifacts/v1.1/gallery.html` — 20 desktop/phone bilingual landmark/shape screenshots.
- `artifacts/v1.1/browser-matrix.json` — detailed combination results.
- `artifacts/v1.1/setup-320-en.png`, `setup-320-zh-TW.png`, and `phone-landscape.png` — narrow and short-screen evidence.
- `artifacts/production-*-full-watch.json` — complete real-input survival outcomes.
- `artifacts/v1.1/performance-1x.json` and `performance-4x.json` — optional 180-unit stress measurements.

## Reproducing checks

```sh
npm test
# With npm run dev already listening on 5173:
npm run test:browser
node tests/performance.mjs
CPU_SLOWDOWN=1 node tests/performance.mjs
# After npm run build and npm run preview:
TEST_URL=http://127.0.0.1:4173 npm run test:browser
TEST_URL=http://127.0.0.1:4173 TEST_PERIMETER=circle TEST_LANDMARK=st-peters TEST_LOCALE=zh-TW TEST_INPUT=touch node tests/full-watch.mjs
```

## Limits and intentional differences

- Testing uses Chromium desktop and phone emulation with native touch events. Physical iOS/Android devices and Safari were not tested.
- With no CPU throttling, the 180-unit phone stress run recorded mean frame intervals of about 16.7–17.2 ms and a 95th percentile of about 16.8 ms across all five shapes (cloud Chromium observation).
- The 180-unit, DPR-2 phone stress run with 4× CPU slowdown recorded 95th-percentile frame intervals of about 33.4–50 ms across the five shapes. This is a cloud-host stress observation, not a physical-device FPS guarantee; isolated frames reached about 83.4 ms. Typical seeded 90-second checks held far fewer units.
- Distinct paths are not promised to have equal difficulty. The original spawn formula and physical gate speed/width are retained; perimeter length, approach distance, and corner layout produce different experiences. Authored paths keep a safe route to the center and avoid narrow corridors.
- The visible ring remains larger than the physical contact core, as in refined v1.0. The localized note below the controls explains that the solid core marks contact.
- True nearest-segment projection corrects the v1.0 square corner targeting bug. Gate exposure now respects exact contact time within a substep. These accuracy corrections can alter edge-case outcomes without changing spawn rates, elimination rate, collision radius, or victory conditions. See [the change log](../CHANGELOG.md).
- Live-site verification compares published HTTPS file hashes against the tested production build after Pages reports successful deployment. Production browser interaction is tested against that build locally; this environment's Chromium does not trust the network proxy certificate for direct public-site navigation. No TLS bypass or trust-store modification is used.
