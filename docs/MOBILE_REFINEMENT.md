# v1.0 mobile and visual refinement

## Changes

- Removed the separate Louvre map-caption overlay and redundant ready-screen tagline. The existing frontal SVG contains no baked-in lettering, and its source, architecture, proportions, colors, and shadows are unchanged. Accessibility descriptions remain nonvisual.
- Red and blue units now render a 10-arena-unit outer radius instead of the original 5. A darker solid core stays at the original 5-unit collision radius, with contrasting outlines. This is a visibility change only.
- Added a horizontal **Left | Switch | Right** control row beneath the field and legend, with 56px-high portrait targets, at least 44px-high landscape targets, and 10–12px spacing. Arrows use the same SVG icons in both languages; Switch is localized as **切換** in Traditional Chinese.
- Pointer-down starts movement or teleports immediately. Pointer-up, cancellation, lost capture, pause, blur, hidden tabs, resize/orientation change, language changes, restart, loss, and the finale clear held input. Capture is also checked before simulation frames to handle delayed browser capture-loss notifications.
- Controls and desktop keys call the same direction and teleport paths. Space/Enter can hold a focused directional button; a focused Switch activates once per key press. Opposing pointers cancel directions and release independently.
- The active play area and controls suppress panning, text selection, drag selection, and control context menus. Scrolling the field is available while paused. A compact countdown beside Pause stays visible without scrolling to the sidebar.

## Scope protection

`src/simulation.js`, `src/chapters/louvre.js`, and `src/landmark.js` remain byte-for-byte unchanged from the previous release. Spawn timing and rates, difficulty presets, collision dimensions, gate width/speed, recruitment, targeting, firing, and victory/defeat conditions are preserved. There are no added chapters or runtime dependencies.

## Validation

- All 42 existing simulation/localization unit tests pass, including complete seeded runs of all nine presets.
- Existing desktop and bilingual browser acceptance checks pass. New tests use Chromium's real touchscreen input dispatch, rather than only synthetic touch handlers, for hold/release, dragging outside controls, field swipes, cancellation, capture loss, Switch, and keyboard/touch speed equivalence. Independent multi-pointer and interruption signals are also covered.
- Both languages were checked at 320, 360, 390, and 430 CSS-pixel widths. Controls are horizontal, separated, at least 44 × 44px, below the field, within the playing viewport, and free of horizontal overflow. Short 844 × 390 touch landscape is checked too.
- Full production 90-second Normal watches pass using keyboard controls in English and Traditional Chinese, plus real touch-button input in Traditional Chinese. Every run reaches the automatic victory finale with no browser exceptions.
- `npm run build` passes. The existing GitHub Pages workflow now runs the touch regression checks and an additional production touch survival watch before deployment.

Screenshots and JSON reports are under the ignored `artifacts/` directory: `touch-en-mobile-gameplay.png`, `touch-zh-Hant-mobile-gameplay.png`, `touch-*-game-panel.png`, `touch-landscape.png`, `touch-results-*.json`, and `production-zh-Hant-touch-*.png/json`. Viewport validation uses Chromium touch emulation; physical iOS/Android hardware was not available in this cloud environment.

## Remaining usability tradeoffs

The enlarged outer ring is not a larger collider. It can reach or overlap the fence before the solid core does. The difference is 5 arena units, approximately **1.7–2.2 CSS pixels** across the tested portrait widths (about **2px at 390px**). A note below the controls explains that solid cores mark contact. No physics adjustment was made, since that would change the established game rules.

Rendered dot diameters are approximately 6.6 / 7.3 / 7.9 / 8.7 CSS pixels at 320 / 360 / 390 / 430px viewport widths. Short landscape fits the full arena and controls by reducing the field, so portrait offers clearer unit readability. No stuck movement, unwanted scrolling during play gestures, horizontal overflow, or touch-control obstruction was observed in the tested viewports.
