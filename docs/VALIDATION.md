# v1.0 validation

Validated in Chromium on 21 October 2026. Scope: Chapter One, Louvre Defender only.

- **32 deterministic simulation tests passed**, including complete seeded runs of all nine presets. Geometry tests cover both movement directions, all four corners, gate sweep exposure, physical circle contact, both red breach cases, and teleport destination-only exposure. Recruitment, exact firing capacity, nearest-fence priority, loss, restart, and the authoritative zero-time finale are covered.
- **18 development-browser checks passed**, including real-time recruitment, held keys, teleport, pause, instructions, sound toggle, defeat, restart, automatic victory, visible keyboard focus, a 390px layout, reduced motion, and no console exceptions.
- **15 production-browser checks passed.** Development mutation hooks are absent from production.
- **A complete production 90-second Normal watch passed**, using real arrow/Space key events and a virtual browser clock. Seed 71: victory, 60 recruits, 970 eliminations, maximum 6 simultaneous units, no surviving reds, no browser exceptions. No game-state mutation or shortened countdown was used.
- **Production build passed** after a frozen `npm ci`; output is approximately 188 KB, including locally hosted fonts and licenses. Production assets make no external runtime requests. Production dependencies have no reported npm audit vulnerabilities.
- **Balance check:** leaving the initial gate untouched lost 37 of 50 default seeded runs. This is an initial tuning baseline, not a claim of human playtest validation.

Opening, gameplay, finale, defeat, victory, mobile, original visual proof, and production-watch screenshots and JSON reports are retained in the local `artifacts/` directory. These generated files are ignored by Git; the CI workflow uploads its own browser evidence as an Actions artifact. `artifacts/riot-defender-v1.0.zip` contains the complete static build.

The supplied private Louvre image was visually inspected before the original SVG was implemented. The frontal elevation, pavilion, wings, windows, roofline, and glass pyramid were checked in a static visual proof before gameplay was added. The original reference image is not distributed.

Public deployment is separate from these local results. The included Pages workflow must complete and its public endpoint must be checked before deployment can be called verified. Keyboard play is desktop-first; touch controls and other chapters are deliberately outside v1.0. Difficulty still needs human playtesting.

Publication blocker observed: the GitHub integration can push and run Actions, but the Pages creation API returns `403 Resource not accessible by integration`. Enable GitHub Pages with Source **GitHub Actions** in the repository settings, then rerun the deployment workflow. No public deployment is claimed by the local test evidence.
