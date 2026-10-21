# Bilingual settings and chapter organization

The header offers **English** and **繁體中文**. Language changes are immediate and do not reset an active game, paused game, result, or selected gameplay settings. The preference is stored under `riot-defender.locale`; a fresh profile uses its supported browser language, then English fallback. Storage errors do not prevent session language switching.

Shared UI text is in `src/locales/en.js` and `src/locales/zh-Hant.js`. `src/i18n.js` composes shared and chapter messages, interpolates named values, handles fallback, and persists the preference. Translations are text; HTML structure stays in `src/view.js` and the controller's overlay templates, with translated markup insertions escaped.

A chapter owns its identifier, chapter number, coordinates, artwork renderer, rules, and locale-specific landmark messages. `src/chapters/index.js` registers only Louvre and chooses it as the active chapter. Generic views use the active chapter and translation keys rather than hardcoded Louvre names. This update prepares that separation; it does not add other chapters or a runtime chapter picker.

To extend later, add a chapter definition following `src/chapters/louvre.js`, supply each supported language, and register it when that chapter is ready. Another language needs its dictionary, native option label, browser aliases, and chapter copy. The simulation's active geometry remains bound to the chosen chapter configuration; future runtime chapter switching must explicitly initialize that geometry per session.

## Verification

- 42 Node tests pass: the original 32 mechanics tests plus 10 checks for translation coverage, matching interpolation tokens, preference storage, locale aliases, restricted storage, fallback, and chapter registry scope.
- English browser acceptance checks pass, and added bilingual browser checks cover setup, persisted preferences, selected settings, the complete paused simulation, active game progress, native selector keys, translated instructions, Canvas labels, screen-reader labels, defeat, finale, victory, and replay.
- Traditional Chinese screenshots were inspected at desktop, 390px, and 320px widths. The narrow layout stacks the heading and mission statistics to keep Chinese copy readable. Chinese fonts use supported system fonts and no external font service.
- Full production 90-second Normal watches completed with real keyboard input and a virtual browser clock in both English and Traditional Chinese. Both reached victory without browser exceptions.
- `npm run build` passes with no new runtime dependencies. The GitHub Pages workflow runs the same mechanics, localization, browser, and both-language production survival checks before publishing.

Screenshots and JSON evidence are generated under `artifacts/`. Development-only scenario hooks are excluded from production. Existing Louvre art and gameplay tuning are preserved.
