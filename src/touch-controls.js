// Pointer and button-keyboard input feed the same direction/teleport commands as
// desktop keys. This module owns gestures only; it never advances the simulation.
export class TouchControls {
  constructor(root, {canPlay, onSwitch}) {
    this.root = root;
    this.canPlay = canPlay;
    this.onSwitch = onSwitch;
    this.pointers = new Map();
    this.keys = new Map();
    this.buttons = [...root.querySelectorAll('button')];
    for (const button of this.buttons) {
      button.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !this.canPlay()) return;
        event.preventDefault();
        button.focus({preventScroll:true});
        const source = {button,direction:Number(button.dataset.direction || 0),captured:false};
        this.pointers.set(event.pointerId, source);
        try { button.setPointerCapture(event.pointerId); source.captured = button.hasPointerCapture(event.pointerId); } catch { /* Window release handlers still stop the gesture. */ }
        this.paint();
        if (button.dataset.control === 'switch') this.onSwitch();
      }, {passive:false});
      button.addEventListener('lostpointercapture', event => this.release(event.pointerId));
      button.addEventListener('keydown', event => {
        if (!['Space','Enter'].includes(event.code)) return;
        event.preventDefault();
        if (!this.canPlay() || event.repeat) return;
        if (button.dataset.control === 'switch') this.onSwitch();
        else this.keys.set(event.code, {button,direction:Number(button.dataset.direction)});
        this.paint();
      });
      // Native keyboard activation is handled above so a held key never repeats
      // Switch. A zero-detail click still supports assistive-technology activation.
      button.addEventListener('click', event => {
        if (event.detail === 0 && button.dataset.control === 'switch' && this.canPlay()) this.onSwitch();
      });
    }
    window.addEventListener('pointerup', event => this.release(event.pointerId), true);
    window.addEventListener('pointercancel', event => this.release(event.pointerId), true);
    window.addEventListener('keyup', event => { this.keys.delete(event.code); this.paint(); }, true);
    root.addEventListener('contextmenu', event => { if (this.canPlay()) event.preventDefault(); });
    root.addEventListener('dragstart', event => event.preventDefault());
  }

  get direction() {
    // A stationary finger may delay the browser's lostpointercapture event.
    // Inspect capture before each simulation frame so interruption still stops immediately.
    for (const [id,source] of this.pointers) {
      if (source.captured && !source.button.hasPointerCapture(id)) this.release(id);
    }
    const sources = [...this.pointers.values(), ...this.keys.values()];
    return Number(sources.some(source => source.direction === 1)) - Number(sources.some(source => source.direction === -1));
  }

  paint() {
    const pressed = new Set([...this.pointers.values(), ...this.keys.values()].map(source => source.button));
    for (const button of this.buttons) {
      button.classList.toggle('pressed', pressed.has(button));
      if (button.dataset.direction) button.setAttribute('aria-pressed', String(pressed.has(button)));
    }
  }

  release(pointerId) {
    const source = this.pointers.get(pointerId);
    if (!source) return;
    this.pointers.delete(pointerId);
    try { if (source.button.hasPointerCapture(pointerId)) source.button.releasePointerCapture(pointerId); } catch { /* Capture may already have been cancelled by the browser. */ }
    this.paint();
    // Return physical pointer users to the game keyboard context on release.
    // Keyboard-focused button holds retain their native Space/Enter behavior.
    const stillHeld = [...this.pointers.values(), ...this.keys.values()].some(other => other.button === source.button);
    if (!stillHeld && document.activeElement === source.button) source.button.blur();
  }

  reset() {
    for (const id of [...this.pointers.keys()]) this.release(id);
    this.keys.clear();
    this.paint();
  }

  sync() {
    const enabled = this.canPlay();
    if (!enabled) this.reset();
    for (const button of this.buttons) button.disabled = !enabled;
  }
}
