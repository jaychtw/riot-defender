import { LOCALES } from './i18n.js';

export const arrowIcon = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

export function renderShell(chapter, t) {
  const label = (key, tag = 'span', className = '') => `<${tag} data-i18n="${key}"${className ? ` class="${className}"` : ''}>${escapeHTML(t(key))}</${tag}>`;
  return `<header class="site-header">
    <a class="wordmark" href="./" data-i18n-aria="header.home">
      <span class="brand-icon" aria-hidden="true"><svg viewBox="0 0 30 30" width="28" height="28"><path d="M3 25 15 4 27 25ZM15 4v21M9 15l12 10M21 15 9 25" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></span>
      ${label('app.name')}<span class="version">V1.0</span>
    </a>
    <span class="edition">${label('header.edition')} <i></i> ${label('header.chapter')}</span>
    <div class="header-settings">
      <label class="language-setting" for="language">${label('settings.language')}<select id="language">${LOCALES.map(locale => `<option value="${locale.id}" lang="${locale.id}">${locale.label}</option>`).join('')}</select></label>
      <button id="sound" class="icon-button"></button>
    </div>
  </header>
  <main>
    <section class="intro">
      <div class="eyebrow"><span class="tiny-line"></span>${label('chapter.location')}<span class="coordinates">${escapeHTML(chapter.coordinates)}</span></div>
      <div class="title-row"><h1>${label('hero.first')}<br>${label('hero.second')}${label('hero.emphasis','em')}</h1>
        <div class="intro-note"><span class="chapter-number">${String(chapter.number).padStart(2,'0')} /</span>${label('chapter.title','h2')}<p>${label('hero.introFirst')}<br>${label('hero.introSecond')}</p></div>
      </div>
    </section>
    <section class="game-layout" data-i18n-aria="arena.label">
      <div class="game-panel">
        <div class="arena-top"><span><i class="status-dot"></i><span id="arena-status"></span></span>${label('arena.sector','span','sector-label')}<button id="pause" class="mini-button" disabled>||</button></div>
        <div class="arena-wrap">
          <canvas id="arena" width="900" height="760" data-i18n-aria="arena.controls"></canvas>
          <div class="landmark">${chapter.artwork()}</div>
          <div class="map-label">${label('chapter.mapLabel')}${label('chapter.established','small')}</div>
          <div id="game-overlay" class="game-overlay ready"></div>
          <div class="corner-mark tl"></div><div class="corner-mark tr"></div><div class="corner-mark bl"></div><div class="corner-mark br"></div>
          <div id="breach-indicator" hidden aria-hidden="true"><i>!</i>${label('arena.breachPoint')}</div>
        </div>
        <div class="arena-bottom"><div><span class="legend-dot blue"></span>${label('legend.defender')}<span class="legend-dot red"></span>${label('legend.intruder')}<span class="legend-gate"></span>${label('legend.gate')}</div><span id="arena-caption"></span></div>
      </div>
      <aside>
        <div class="mission-heading">${label('mission.chapter','span','eyebrow')}${label('mission.mode','span','outline-tag')}</div>
        ${label('mission.title','h2','mission-title')}<p class="mission-copy">${label('mission.first')}<br>${label('mission.second')}</p>
        <div class="stats"><div class="timer-stat">${label('stats.arrival','span','stat-label')}<div><strong id="timer">01:30</strong><span id="timer-state"></span></div><div class="time-track"><span id="time-progress"></span></div></div>
          <div class="stat-pair"><div>${label('stats.defenders','span','stat-label')}<strong id="defenders">00</strong>${label('stats.center','small')}</div><div>${label('stats.firepower','span','stat-label')}<strong><span id="firepower">0</span>${label('stats.perSecond','span','per-second')}</strong>${label('stats.eliminations','small')}</div></div>
        </div>
        <div id="settings">
          <fieldset><legend>${label('settings.arrival')}${label('settings.seconds')}</legend><div class="segments" id="durations">${[60,90,120].map(value => `<button data-value="${value}" class="${value===chapter.rules.duration?'selected':''}" aria-pressed="${value===chapter.rules.duration}">${value}</button>`).join('')}</div></fieldset>
          <fieldset><legend>${label('settings.intensity')}</legend><div class="segments" id="intensities">${['Calm','Normal','Chaos'].map(value => `<button data-value="${value}" data-i18n="preset.${value}" class="${value===chapter.rules.intensity?'selected':''}" aria-pressed="${value===chapter.rules.intensity}">${escapeHTML(t('preset.'+value))}</button>`).join('')}</div></fieldset>
        </div>
        <button id="start" class="primary-button"></button><button id="new-watch" class="text-button" hidden>↺ &nbsp;${label('action.setup')}</button><p class="button-note" id="button-note"></p>
        <div class="controls"><div class="controls-title">${label('controls.title','span','eyebrow')}<button id="help" class="help-button" data-i18n-aria="action.help">?</button></div>
          <div class="control-row"><div><kbd>←</kbd><kbd>→</kbd></div>${label('controls.slide')}</div>
          <div class="control-row">${label('controls.space','kbd','space-key')}${label('controls.jump')}</div>
          <div class="rule"><span class="rule-icon">→</span><p>${label('controls.rule')}<br>${label('controls.loss','strong')}</p></div>
        </div>
      </aside>
    </section>
    <section class="how-it-works">${label('plan.title','span','eyebrow')}${[['open','01'],['grow','02'],['hold','03']].map(([step,number])=>`<div><span class="step-index">${number}</span><p>${label('plan.'+step,'strong')}<br>${label('plan.'+step+'Detail')}</p></div>`).join('')}</section>
  </main>
  <footer><span>${label('app.name')}<i> / </i>${label('mission.chapter')}</span>${label('footer.disclaimer','p')}<span>${label('footer.motto')}<span class="footer-star">✳</span></span></footer>
  <dialog id="help-dialog" aria-labelledby="help-heading">
    <button class="dialog-close" data-i18n-aria="action.closeHelp">×</button>${label('help.title','span','eyebrow')}<h2 id="help-heading" data-i18n="help.heading"></h2>
    <p>${label('help.rotateBefore')}<kbd>←</kbd>${label('help.rotateBetween')}<kbd>→</kbd>${label('help.rotateAfter')}${label('controls.space','kbd')}${label('help.jumpAfter')}</p>
    <p>${label('help.blueTitle','b')}${label('help.blue')}</p><p>${label('help.redTitle','b')}${label('help.red')}</p>
    <p>${label('help.defense')}<kbd>P</kbd>${label('help.pauseBetween')}<kbd>ESC</kbd>${label('help.pauseAfter')}</p>
    ${label('help.disclaimer','p','muted')}<button class="primary-button dialog-done">${label('action.understood')}<span>${arrowIcon}</span></button>
  </dialog>
  <div id="announcement" class="sr-only" aria-live="polite"></div>`;
}
