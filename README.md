# Riot Defender v1.0

**Chapter One: Louvre Defender** is a desktop-first browser survival game. Rotate one opening around a square fence, recruit blue defenders, and protect the Louvre until automatic reinforcements arrive. Only the Louvre chapter is implemented.

The original frontal SVG illustration follows the privately supplied reference's architectural direction. The reference image is not bundled or redistributed. Fonts ship locally under the SIL Open Font License; the game makes no external runtime requests and requires no credentials.

## Run

Node.js 22+ and npm are required. In `/workspace/riot-defender` (or your local checkout):

```sh
npm ci
npm run dev -- --port 5173
```

Hold **Left / Right** to move the opening counterclockwise / clockwise. Tap **Space** for an instantaneous opposite-perimeter jump. **P / Escape** pauses. Switching tabs also pauses. Open field notes with **?**. Sound is optional and starts off. Keyboard controls are required for play; narrow screens receive a responsive presentation, not mobile touch controls.

Choose **60 / 90 / 120 seconds** and **Calm / Normal / Chaos**. Defaults: **90 seconds, Normal**. A red already touching the gate breaches immediately; a separated red still has to reach it. Blue units add firepower only on reaching the center. Every recruited defender adds one nearest-fence elimination per second. At zero, controls lock and a 2.8-second automatic cavalry finale clears the remaining reds before Victory.

## Verify

```sh
npm test                 # deterministic simulation suite; all nine complete preset runs
npm run test:browser     # run while the development server is running
npm run build            # production static site in dist/
npm run preview -- --port 4173
TEST_URL=http://127.0.0.1:4173 npm run test:browser
TEST_URL=http://127.0.0.1:4173 node tests/full-watch.mjs
```

Browser tests use `/usr/bin/chromium` when present, otherwise Playwright's bundled browser. Set `CHROMIUM_PATH` to override. Install Chromium on a fresh machine with `npx playwright install --with-deps chromium`. Screenshots and test reports are generated in `artifacts/` and ignored by Git. Development-only deterministic fixture hooks are stripped from production; the production full-watch test uses real key events and a seeded random generator with a virtual browser clock, without mutating game state.

## Deploy

`dist/` is the complete playable artifact. Serve its contents through any static HTTPS host; relative asset URLs support subdirectory hosting. A server is required; do not open `index.html` with `file://`.

The included `.github/workflows/deploy.yml` tests and builds pushes to `main`, then deploys to **GitHub Pages**. In repository **Settings → Pages**, set **Source: GitHub Actions** before deployment. The workflow needs GitHub Pages enabled for the repository and the standard `pages: write` / `id-token: write` job permissions. The configured workflow performs deployment; the local build alone does not establish public publication.

To publish manually after enabling Pages, push `main` or run **Test and deploy Louvre Defender** from the Actions tab. Check the deployment job and its published URL. No personal token is embedded in the workflow or game.

## Structure and tuning

- `src/simulation.js`: deterministic state, circular perimeter geometry, swept gate exposure, physical circle contacts, recruitment, spawn director, firing cadence, and finale.
- `src/renderer.js`: schematic Canvas arena, outlined blue units, red units, gate, thin fire effects, and abstract helicopter cavalry.
- `src/landmark.js`: independent original frontal Louvre SVG, rendered above Canvas so effects do not obscure the building.
- `src/main.js` / `src/style.css`: setup, HUD, controls, accessible dialogs, sound, responsive layout, and reduced-motion support.
- `tests/`: simulation and browser acceptance checks. Source GDD and implementation prompt are retained in `docs/`.

`CHAPTER` contains the gate dimensions, unit speeds, and cap. Side length is 490 units; opening is 98 units (20% of a side), gate speed 360 units/s, blues 120 units/s, reds approximately 24 units/s, circle radius 5, active-unit cap 180. Red rate is `(0.75 + 4.5 × elapsed / duration + min(10, 0.45 × recruited)) × intensity`, with multipliers 0.6 / 1 / 1.6. The first two blue arrivals approach the initial gate; later arrivals spread around the perimeter. The simulation substeps at a maximum 1/120 second; rendering clamps large frame delays and pauses hidden tabs.

Balance is an initial playtest baseline. Seeded legal controllers complete every preset, but human playtesting is still needed to tune perceived difficulty. No other chapters, manual aiming, upgrades, weapons, multiplayer, or required mobile controls are included.
