# Riot Defender v1.1 — International Landmarks & Customizable Arenas

[Play Riot Defender](https://jaychtw.github.io/riot-defender/)

Protect a landmark by moving one opening around its fence. Admit blue defenders, block red intruders, and survive until reinforcements arrive. One intruder through the open gate ends the watch.

Choose independently:

| Landmark | Place | Recommended perimeter |
| --- | --- | --- |
| Louvre | Paris, France | Square |
| Forbidden City | Beijing, China | Rectangle |
| Blue Mosque | Istanbul, Türkiye | Octagon |
| Longshan Temple | Taipei, Taiwan | Irregular |
| St. Peter’s Basilica | Vatican City | Circle |

All 25 landmark/perimeter combinations are available. Selecting a landmark suggests its recommended shape; choosing another shape overrides that suggestion. Duration (60/90/120 seconds), intensity (Calm/Normal/Chaos), language, and arena selections persist locally when browser storage is available. No chapters are locked and there is no campaign progression. Arenas are fictional and do not represent actual security layouts.

English and Traditional Chinese (`en`, `zh-TW`) switch live without resetting a watch. Existing `zh-Hant` saved language preferences migrate automatically.

## Controls and rules

- Hold **← / Counterclockwise / 逆時針** or **→ / Clockwise / 順時針** to move the opening continuously. Releasing stops movement.
- **Space / Switch / 切換** instantly jumps half the perimeter’s arc length. On irregular shapes, that is not necessarily visually opposite. Intermediate sections remain closed during the jump.
- **P**, **Escape**, or the pause button pauses. Focus loss/backgrounding pauses safely. Touch cancellation, pointer capture loss, orientation changes, and restart clear held inputs.
- Blue defenders approach in a straight line, wait at their actual closed-fence contact point, then continue to the center when admitted. Each recruited defender adds one automatic elimination per second.
- Defense prioritizes the red closest to the actual fence. A red already touching an exposed gate causes immediate loss; a visibly separated red still has to travel to the fence.
- At timer zero, controls lock and reinforcements clear the arena before victory. There is no additional combat phase.

Unit visibility retains the v1.0 10-unit outer ring and 5-unit solid collision core. Contact is judged by the solid core. Keyboard and native touch inputs share the same game engine.

## Development

Use Node 22 (`.nvmrc`) and npm:

```sh
npm ci
npm run dev
npm test
npm run test:browser
npm run build
npm run preview
```

Browser checks expect Vite on port 5173 by default. Install Playwright Chromium with `npx playwright install --with-deps chromium`, or set `CHROMIUM_PATH` to an installed Chromium. `TEST_URL` overrides the target origin. Artifacts are generated under `artifacts/` and intentionally excluded from Git.

A full 90-second production acceptance run uses only actual keyboard/touch input events, with an accelerated browser clock:

```sh
TEST_URL=http://127.0.0.1:4173 node tests/full-watch.mjs
TEST_URL=http://127.0.0.1:4173 TEST_LANDMARK=longshan-temple TEST_PERIMETER=irregular TEST_LOCALE=zh-TW TEST_INPUT=touch node tests/full-watch.mjs
```

## Shared architecture

- `src/perimeter.js`: closed arc-length paths; analytic circle and authored polygons; true Euclidean projection, outward placement, continuous swept circle/segment contact, gate intervals, and canvas tracing.
- `src/simulation.js`: one fixed-step game engine for every landmark and shape. Gate position is stored as normalized `u`; the physical `gate` getter retains compatibility with the v1.0 test surface. All shapes use the original 98-unit gap, 360-unit/second gate speed, 5-unit collision radius, spawn-pressure formula, and firing cadence.
- `src/chapters/`: selectable landmark metadata and bilingual identity. All five reference the same rules, with no separate engines.
- `src/landmark.js` and `src/artworks.js`: five original frontal SVG illustrations, with text-free architectural detail and subtle shading. Reference PNGs are neither runtime assets nor redistributed. Safe art rectangles vary by fence shape; illustrations retain their frontal perspective and aspect ratio.
- `src/i18n.js`, `src/locales/`, `src/settings.js`: live localization, legacy locale migration, and validated saved setup choices.
- `src/touch-controls.js`: shared hold/cancel/Switch handling, retained from v1.0.

`npm run build` exports five standalone illustrations into `dist/artwork/`: `louvre.svg`, `forbidden-city.svg`, `blue-mosque.svg`, `longshan-temple.svg`, and `st-peters.svg`. The inline artwork and exported assets use the same source functions.

See [the product GDD](docs/GDD-v1.1.md), [validation coverage and limitations](docs/VALIDATION.md), and [the change log](CHANGELOG.md). Intentional accuracy corrections to nearest-fence targeting near square corners and within-step gate/contact timing are documented in the change log.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`: clean dependency install, unit/regression tests, desktop/mobile browser acceptance including the 100-combination device/language matrix, production build, full survival checks on all five fence types, then GitHub Pages deployment. The workflow uploads browser screenshots and JSON evidence as `browser-evidence`. Pages must use the GitHub Actions source.

The game has no external runtime service, remote font request, analytics, or image dependency. Generated `dist/` is the complete static deployment.
