import '@fontsource-variable/dm-sans';
import '@fontsource/libre-caslon-display/latin-400.css';
import './style.css';
import { ACTIVE_CHAPTER } from './chapters/index.js';
import { createI18n, initialLocale } from './i18n.js';
import { renderShell, arrowIcon, escapeHTML } from './view.js';
import { Game } from './simulation.js';
import { Renderer } from './renderer.js';
import { TouchControls } from './touch-controls.js';

// Locale preferences are shared across chapters; changing language never recreates a game.
let storage;
try { storage = window.localStorage; } catch { /* Storage is optional. */ }
const chapter = ACTIVE_CHAPTER;
const i18n = createI18n({chapter, storage, locale:initialLocale(storage, navigator.languages)});
const t = (key, params = {}) => i18n.t(key, {
  number:String(chapter.number).padStart(2,'0'),
  chapter:i18n.t('chapter.title'),
  landmark:i18n.t('chapter.landmark'),
  ...params,
});
const html = (key, params) => escapeHTML(t(key, params));
const $ = selector => document.querySelector(selector);
$('#app').innerHTML = renderShell(chapter, t);
const renderer = new Renderer($('#arena'), {t});
let game = null, paused = false;
let duration = chapter.rules.duration, intensity = chapter.rules.intensity;
let last = performance.now(), lastPhase = 'setup', lastDefenders = 0;
let soundEnabled = false, audio = null, selectedNote = false;
const held = new Set();
const touchControls = new TouchControls($('#touch-controls'), {
  canPlay:() => game?.phase === 'playing' && !paused && !$('#help-dialog').open,
  onSwitch:performSwitch,
});
function clearInput() { held.clear(); touchControls.reset(); }
function performSwitch() {
  if (!game || game.phase !== 'playing' || paused) return;
  game.teleport(); tone(250,.07);
  if (game.phase === 'defeat') { lastPhase='defeat'; result(); }
}

function announce(text) { $('#announcement').textContent = text; }
function tone(freq = 440, length = .08, volume = .025) {
  if (!soundEnabled) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.connect(gain); gain.connect(audio.destination); osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
    osc.start(); osc.stop(audio.currentTime + length);
  } catch { /* Optional audio must not block gameplay. */ }
}

function applyTranslations() {
  document.documentElement.lang = i18n.locale;
  document.title = t('app.documentTitle');
  document.querySelector('meta[name="description"]').content = t('app.description');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n, el.dataset.i18n === 'arena.sector' ? {landmark:t('chapter.sectorName')} : {});
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $('.landmark svg').setAttribute('aria-label', t('chapter.artLabel'));
  $('#language').value = i18n.locale;
  updateSound();
  updateHUD();
  renderOverlay();
}

function setOverlay(className, markup) {
  const overlay = $('#game-overlay');
  overlay.className = 'game-overlay ' + className;
  overlay.innerHTML = markup;
  overlay.querySelector('[data-restart]')?.addEventListener('click', start);
  overlay.querySelector('[data-resume]')?.addEventListener('click', () => setPause(false));
  overlay.querySelector('#arena-start')?.addEventListener('click', start);
}
function renderOverlay() {
  if (!game) {
    setOverlay('ready', `<button id="arena-start" class="secondary-button">${html('action.start')} <span>${arrowIcon}</span></button>`);
  } else if (game.phase === 'defeat' || game.phase === 'victory') {
    const won = game.phase === 'victory';
    const summary = {defenders:game.defenders, kills:game.kills, seconds:Math.floor(game.duration-game.remaining)};
    setOverlay('result ' + game.phase, `<div class="overlay-badge">${won?'✧':'!'}</div><p class="eyebrow">${html(won?'overlay.victoryEyebrow':'overlay.defeatEyebrow')}</p><h2>${html(won?'overlay.victoryFirst':'overlay.defeatFirst')}<br>${html(won?'overlay.victorySecond':'overlay.defeatSecond')}</h2><p>${html(won?'overlay.victory':'overlay.defeat')}<br>${html('overlay.summary',summary)}</p><button class="primary-button" data-restart>${html(won?'action.replay':'action.retry')} <span>${arrowIcon}</span></button>`);
  } else if (paused) {
    setOverlay('paused', `<div class="overlay-badge">||</div><p class="eyebrow">${html('overlay.pauseEyebrow')}</p><h2>${html('overlay.paused')}</h2><p>${html('overlay.pauseFirst')}<br>${html('overlay.pauseSecond')}</p><button class="primary-button" data-resume>${html('action.resume')} <span>→</span></button>`);
  } else {
    $('#game-overlay').className = 'game-overlay hidden';
  }
}
function setPause(value) {
  if (!game || game.phase !== 'playing') return;
  paused = value; clearInput(); renderOverlay(); updateHUD();
  announce(t(value?'announce.pause':'announce.resume'));
}
function settingsLocked(locked) {
  document.querySelectorAll('#settings button').forEach(button => { button.disabled = locked; });
}
function start() {
  $('#breach-indicator').hidden = true;
  game = new Game({duration, intensity, seed:Math.floor(Math.random()*4294967296)});
  paused = false; clearInput(); lastDefenders = 0; lastPhase = 'playing';
  settingsLocked(true);
  $('.arena-wrap').classList.add('active'); $('.arena-wrap').classList.remove('finale');
  $('#new-watch').hidden = false; $('#pause').disabled = false;
  document.activeElement?.blur();
  $('.game-layout').scrollIntoView({block:'start',behavior:'instant'}); window.scrollBy(0,-15);
  renderOverlay(); updateHUD(); tone(330,.15); announce(t('announce.start'));
}
function setup() {
  $('#breach-indicator').hidden = true;
  game = null; paused = false; clearInput(); lastPhase = 'setup'; selectedNote = false;
  settingsLocked(false); $('#pause').disabled = true; $('#new-watch').hidden = true;
  $('.arena-wrap').classList.remove('active','finale'); renderOverlay(); updateHUD();
}
function result() {
  const won = game.phase === 'victory';
  if (!won && game.breach) {
    const marker = $('#breach-indicator'); marker.hidden = false;
    marker.style.left = (game.breach.x/900*100)+'%'; marker.style.top = (game.breach.y/760*100)+'%';
  }
  clearInput(); $('#pause').disabled = true; settingsLocked(false);
  renderOverlay(); updateHUD(); tone(won?660:160,.45);
  announce(t(won?'announce.victory':'announce.defeat'));
}
function updateSound() {
  $('#sound').innerHTML = `♪ <span>${html(soundEnabled?'sound.on':'sound.off')}</span>`;
  $('#sound').setAttribute('aria-label', t(soundEnabled?'sound.disable':'sound.enable'));
  $('#sound').title = t(soundEnabled?'sound.onTitle':'sound.offTitle');
}
function updateHUD() {
  const remaining = game?.remaining ?? duration, seconds = Math.max(0, Math.ceil(remaining-1e-7));
  const state = !game ? 'setup' : paused ? 'paused' : game.phase;
  $('#timer').textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  $('#arena-timer').textContent = $('#timer').textContent;
  touchControls.sync();
  $('.game-panel').classList.toggle('playing', Boolean(game && game.phase === 'playing' && !paused));
  $('#defenders').textContent = String(game?.defenders??0).padStart(2,'0');
  $('#firepower').textContent = game?.defenders??0;
  $('#time-progress').style.width = (remaining/(game?.duration??duration)*100)+'%';
  $('#timer-state').textContent = t('timer.'+state);
  $('#arena-status').textContent = t('status.'+state);
  $('#arena-caption').textContent = game ? t('arena.stopped',{count:game.kills}) : t('arena.caption');
  $('#pause').textContent = paused?'▶':'||';
  $('#pause').setAttribute('aria-label',t(paused?'action.resumeGame':'action.pauseGame'));
  const finished = game && ['defeat','victory'].includes(game.phase);
  const action = !game ? 'action.start' : game.phase==='victory' ? 'action.replay' : 'action.restart';
  // Avoid rebuilding buttons on every animation frame: keep keyboard focus intact.
  const actionKey = action + ':' + i18n.locale;
  if ($('#start').dataset.action !== actionKey) {
    $('#start').dataset.action = actionKey;
    $('#start').innerHTML = `${html(action)} <span>${game?'↻':arrowIcon}</span>`;
  }
  $('#button-note').textContent = t(finished?'note.result':game?'note.playing':selectedNote?'note.selected':'note.setup', {seconds:duration,intensity:t('preset.'+intensity)});
}

$('#start').addEventListener('click', start);
$('#new-watch').addEventListener('click', setup);
$('#pause').addEventListener('click', () => { setPause(!paused); document.activeElement?.blur(); });
$('#language').addEventListener('change', event => {
  if (i18n.setLocale(event.target.value)) {
    clearInput(); applyTranslations(); renderer.draw(game); announce(t('settings.languageChanged'));
  }
});
for (const [id,kind] of [['#durations','duration'],['#intensities','intensity']]) {
  document.querySelectorAll(id+' button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll(id+' button').forEach(other => {
      other.classList.toggle('selected',other===button); other.setAttribute('aria-pressed',String(other===button));
    });
    if (kind === 'duration') duration = Number(button.dataset.value); else intensity = button.dataset.value;
    selectedNote = true; updateHUD();
  }));
}
$('#help').addEventListener('click', () => { if (game?.phase==='playing') setPause(true); $('#help-dialog').showModal(); });
$('.dialog-close').addEventListener('click', () => $('#help-dialog').close());
$('.dialog-done').addEventListener('click', () => $('#help-dialog').close());
$('#sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled; updateSound(); if (soundEnabled) tone(440,.1); document.activeElement?.blur();
});
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || $('#help-dialog').open || !game || game.phase!=='playing') return;
  const onTouchButton = Boolean(event.target.closest('#touch-controls button'));
  if (['Space','ArrowLeft','ArrowRight'].includes(event.code) && event.target.closest('button,a,input,select,textarea') && !onTouchButton) return;
  if (['ArrowLeft','ArrowRight','Space'].includes(event.code)) event.preventDefault();
  if (event.code==='KeyP' || event.code==='Escape') { if (!event.repeat) setPause(!paused); return; }
  if (paused) return;
  if (event.code==='Space' && !event.repeat) {
    performSwitch(); return;
  }
  if (event.code==='ArrowLeft' || event.code==='ArrowRight') held.add(event.code);
});
document.addEventListener('keyup', event => held.delete(event.code));
window.addEventListener('blur', () => { clearInput(); if (game?.phase==='playing') setPause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game?.phase==='playing') setPause(true); });
window.addEventListener('pagehide', clearInput);
window.addEventListener('resize', clearInput);
window.addEventListener('orientationchange', clearInput);
let hudClock = 0;
function frame(now) {
  const dt = Math.min(.05, Math.max(0,(now-last)/1000)); last = now;
  if (game && !paused && ['playing','finale'].includes(game.phase)) {
    game.update(dt,{direction:Math.sign((held.has('ArrowRight')?1:0)-(held.has('ArrowLeft')?1:0)+touchControls.direction)});
    if (game.defenders > lastDefenders) {
      lastDefenders=game.defenders; tone(500+Math.min(400,game.defenders*20),.10);
      announce(t('announce.recruit',{count:game.defenders}));
    }
    if (game.phase !== lastPhase) {
      lastPhase = game.phase;
      if (game.phase === 'finale') {
        clearInput(); $('#pause').disabled=true; $('.arena-wrap').classList.add('finale');
        tone(520,.3); announce(t('announce.finale'));
      }
      if (game.phase==='defeat' || game.phase==='victory') result();
    }
  }
  renderer.draw(game); hudClock += dt;
  if (hudClock > .08) { hudClock=0; updateHUD(); }
  requestAnimationFrame(frame);
}
window.riotDefender = {getState:() => {
  const preferences={locale:i18n.locale,chapter:chapter.id};
  return game ? {...preferences,phase:game.phase,paused,remaining:game.remaining,defenders:game.defenders,kills:game.kills,gate:game.gate,units:game.units.map(unit=>({...unit}))} : {...preferences,phase:'setup',duration,intensity};
}};
if (import.meta.env.DEV) window.riotDefender.test = {get game(){return game;},create:options=>{start();game=new Game(options);},setPause};
setup(); applyTranslations(); requestAnimationFrame(frame);
