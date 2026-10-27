// Demo controller: play / pause / step / restart / speed, with captions synced to the timeline.
//
// A scene's timeline is a paused gsap.timeline with labels "step1".."stepN". Step k's
// animation ("beat") runs from label k to label k+1 (or the end). Being "at step k" means
// the beat of step k has played. Step 0 is the initial state (timeline time 0).
// Scenes only tween numbers on a state object, so seeking in any direction is exact.

import { gsap } from 'gsap';
import { ICONS } from './icons.js';
import { fillTpl } from './SlideLayout.js';

const SPEEDS = [0.5, 1, 2];

export class DemoController {
  constructor(layout, ui, { onCamera, onStep }) {
    this.layout = layout;
    this.ui = ui;
    this.onCamera = onCamera;
    this.onStep = onStep;
    this.speed = 1;
    this.scene = null;
    this.reset();

    layout.btnPlay.addEventListener('click', () => this.togglePlay());
    layout.btnStepForward.addEventListener('click', () => this.next());
    layout.btnStepBack.addEventListener('click', () => this.prev());
    layout.btnRestart.addEventListener('click', () => this.restart());
    layout.btnResetView.addEventListener('click', () => this.resetView());
    for (const b of layout.speedButtons) b.addEventListener('click', () => this.setSpeed(Number(b.dataset.speed)));
  }

  reset() {
    this.killMotion();
    this.step = 0;
    this.playing = false;
    this.beatDone = true;
  }

  get count() { return this.scene?.steps?.length || 0; }

  /** Attach to a scene object ({ timeline, steps, startPreset }). Call again after the timeline is rebuilt. */
  bind(scene) {
    this.reset();
    this.scene = scene;
    const has = this.count > 0 && scene.timeline;
    this.layout.demo.hidden = !scene;
    for (const b of [this.layout.btnPlay, this.layout.btnStepBack, this.layout.btnStepForward, this.layout.btnRestart]) b.disabled = !has;
    this.buildDots();
    if (has) {
      scene.timeline.pause();
      scene.timeline.time(0);
    }
    this.onStep?.(0);
    this.updateUI();
  }

  unbind() {
    this.reset();
    this.scene = null;
  }

  killMotion() {
    this.playhead?.kill();
    this.playhead = null;
    this.gap?.kill();
    this.gap = null;
  }

  start(k) { return this.scene.timeline.labels[`step${k}`] ?? 0; }
  end(k) { return k < this.count ? this.start(k + 1) : this.scene.timeline.duration(); }

  /** Jump to step k; `animate` plays that step's beat from its start. */
  goTo(k, { animate = true, keepPlaying = false } = {}) {
    if (!this.count) return;
    this.killMotion();
    k = Math.max(0, Math.min(this.count, k));
    if (!keepPlaying) this.playing = false;
    this.step = k;
    const tl = this.scene.timeline;
    tl.pause();

    if (k === 0) {
      tl.time(0);
      this.beatDone = true;
      this.onCamera?.(this.scene.startPreset);
    } else {
      const a = this.start(k);
      const b = this.end(k);
      tl.time(a);
      this.onCamera?.(this.scene.steps[k - 1].camera);
      if (animate && b > a) {
        this.beatDone = false;
        this.playhead = gsap.to(tl, { time: b, duration: b - a, ease: 'none', onComplete: () => this.beatFinished() });
        this.playhead.timeScale(this.speed);
      } else {
        tl.time(b);
        this.beatDone = true;
      }
    }
    this.onStep?.(k);
    this.updateUI();
  }

  beatFinished() {
    this.playhead = null;
    this.beatDone = true;
    if (this.playing) {
      if (this.step < this.count) {
        // Reading pause scales with caption length, then the next beat starts.
        const words = this.scene.steps[this.step - 1]?.caption.split(/\s+/).length || 8;
        const pause = Math.min(4.8, 1.2 + words * 0.11);
        this.gap = gsap.delayedCall(pause, () => this.goTo(this.step + 1, { keepPlaying: true }));
        this.gap.timeScale(this.speed);
      } else {
        this.playing = false;
      }
    }
    this.updateUI();
  }

  play() {
    if (!this.count) return;
    this.playing = true;
    if (this.playhead) this.playhead.resume();
    else if (this.gap) this.gap.resume();
    else if (this.step >= this.count) this.goTo(1, { keepPlaying: true });
    else this.goTo(this.step + 1, { keepPlaying: true });
    this.updateUI();
  }

  pause() {
    this.playing = false;
    this.playhead?.pause();
    this.gap?.kill();
    this.gap = null;
    this.updateUI();
  }

  togglePlay() {
    if (this.playing) this.pause();
    else this.play();
  }

  next() { if (this.step < this.count) this.goTo(this.step + 1); }
  prev() { this.goTo(this.step - 1); }

  restart() {
    this.goTo(0);
    this.play();
  }

  setSpeed(s) {
    this.speed = SPEEDS.includes(s) ? s : 1;
    this.playhead?.timeScale(this.speed);
    this.gap?.timeScale(this.speed);
    for (const b of this.layout.speedButtons) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === this.speed));
  }

  resetView() {
    if (!this.scene) return;
    this.onCamera?.(this.step === 0 ? this.scene.startPreset : this.scene.steps[this.step - 1].camera, { force: true });
  }

  // ── UI ────────────────────────────────────────────────────────
  buildDots() {
    const { dots } = this.layout;
    dots.replaceChildren();
    this.dotButtons = [];
    for (let k = 1; k <= this.count; k += 1) {
      const label = fillTpl(this.ui.stepDot, { n: k });
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot';
      b.setAttribute('aria-label', label);
      b.title = label;
      b.addEventListener('click', () => this.goTo(k));
      dots.append(b);
      this.dotButtons.push(b);
    }
  }

  updateUI() {
    const { layout, ui } = this;
    const n = this.count;
    layout.btnPlay.innerHTML = this.playing ? ICONS.pause : ICONS.play;
    layout.btnPlay.setAttribute('aria-label', this.playing ? ui.pause : ui.play);
    layout.btnPlay.title = this.playing ? ui.pause : ui.play;
    layout.btnPlay.classList.toggle('is-pulsing', n > 0 && this.step === 0 && !this.playing);
    layout.btnStepBack.disabled = !n || this.step === 0;
    layout.btnStepForward.disabled = !n || this.step >= n;

    layout.stepCounter.textContent = fillTpl(ui.stepCounter, { n: this.step, total: n });
    layout.stepCounter.hidden = !n;
    const current = this.step === 0 ? null : this.scene.steps[this.step - 1];
    const caption = current ? current.caption : (n ? ui.step0 : ui.noDemo);
    if (layout.caption.dataset.text !== caption) {
      layout.caption.dataset.text = caption;
      layout.caption.replaceChildren(layout.rich(caption));
    }
    // What is moving in this step, from where to where (shown inside the 3D view)
    layout.setFlow(current?.flow || null);
    this.dotButtons?.forEach((b, i) => {
      b.classList.toggle('is-done', i + 1 < this.step);
      b.classList.toggle('is-current', i + 1 === this.step);
      b.setAttribute('aria-current', i + 1 === this.step ? 'step' : 'false');
    });
  }
}
