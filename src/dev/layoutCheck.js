// Development-only layout check (loaded by main.js on the dev server, never in the build).
// In the browser console:
//   __measureAll()          every slide, every step: overlapping or clipped labels, broken text
//   __measureAll(9, 10)     one slide (index range)
// It forces reduced motion (instant camera moves) and renders each step by hand, so it gives
// the same answer whether or not the browser is currently drawing animation frames.

export function install(engine) {
  const overlaps = () => {
    const visible = (el) => {
      for (let p = el; p; p = p.parentElement) if (getComputedStyle(p).display === 'none') return false;
      return Number(getComputedStyle(el).opacity) >= 0.15;
    };
    const stage = document.querySelector('.stage-canvas').getBoundingClientRect();
    const els = [...document.querySelectorAll('.label-layer .label3d, .label-layer .counter3d, .label-layer > .tag3d, .label-layer .packet3d, .stage-overlay .hud__item, .stage-overlay .flow-row')].filter(visible);
    const name = (el) => `${el.className.split(' ')[0]}:${el.textContent.trim().slice(0, 22)}`;
    const rects = els
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.right > stage.left && r.left < stage.right && r.bottom > stage.top && r.top < stage.bottom);
    const out = [];
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const sameStrip = rects[i].el.parentElement === rects[j].el.parentElement && rects[i].el.closest('.stage-overlay');
        if (sameStrip) continue;
        const a = rects[i].r;
        const b = rects[j].r;
        const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ix > 3 && iy > 3) out.push(`${name(rects[i].el)} × ${name(rects[j].el)} (${Math.round(ix)}x${Math.round(iy)})`);
      }
    }
    for (const { el, r } of rects) {
      if (!el.closest('.stage-overlay') && (r.left < stage.left - 2 || r.right > stage.right + 2 || r.top < stage.top - 2 || r.bottom > stage.bottom + 2)) out.push(`CLIP ${name(el)}`);
    }
    for (const el of document.querySelectorAll('.label-layer *, .flow, .hud, .caption')) {
      if (!el.children.length && /NaN|undefined|\{\w+\}/.test(el.textContent)) out.push(`TEXT? ${el.textContent.slice(0, 50)}`);
    }
    return out;
  };

  // The stage normally hears about canvas size changes from a ResizeObserver before the next
  // paint; with no frames being drawn that never runs, so resize explicitly.
  const render = () => {
    engine.stage.resize();
    for (let n = 0; n < 3; n += 1) engine.stage.renderOnce(0.016);
  };

  window.__overlaps = overlaps;
  window.__render = render;
  window.__measureAll = (from = 0, to = engine.slides.length) => {
    const prev = engine.reducedMotion;
    engine.setReducedMotion(true);
    const all = {};
    const errs = [];
    for (let i = from; i < to; i += 1) {
      const id = engine.slides[i].id;
      try { engine.goTo(i); render(); } catch (e) { errs.push(`${id}: ${e}`); continue; }
      const res = {};
      for (let k = 0; k <= engine.demo.count; k += 1) {
        // Twice: the first call can change the caption height, the second frames for it.
        try { engine.demo.goTo(k, { animate: false }); render(); engine.demo.goTo(k, { animate: false }); render(); } catch (e) { errs.push(`${id} s${k}: ${e}`); }
        const o = overlaps();
        if (o.length) res[`s${k}`] = o;
      }
      if (Object.keys(res).length) all[id] = res;
    }
    engine.setReducedMotion(prev);
    return { all, errs };
  };

  // Live experiments: __try(9, (scene) => { __lab('Feeder').position.x += 2; }) — edit the cached
  // scene, then re-run the check for that slide. Reload the page to undo.
  window.__lab = (text) => {
    let found = null;
    engine.stage.active.scene.traverse((o) => { if (!found && o.isCSS2DObject && o.element.textContent.startsWith(text)) found = o; });
    return found;
  };
  window.__try = (i, fn) => {
    engine.goTo(i);
    fn(engine.stage.active);
    return JSON.stringify(window.__issues(i, i + 1).out);
  };

  // Same check, one line per distinct problem: "problem — steps s0,s3,s4".
  window.__issues = (from, to) => {
    const { all, errs } = window.__measureAll(from, to);
    const out = {};
    for (const [id, steps] of Object.entries(all)) {
      const byIssue = new Map();
      for (const [step, list] of Object.entries(steps)) {
        for (const issue of list) {
          const key = issue.replace(/ \(\d+x\d+\)$/, '');
          byIssue.set(key, [...(byIssue.get(key) || []), step]);
        }
      }
      out[id] = [...byIssue].map(([k, s]) => `${k} — ${s.join(',')}`);
    }
    return { out, errs };
  };
}
