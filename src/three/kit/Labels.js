// CSS2D labels floating in the 3D scene (PROMPT.md 2.1 rule 3).
//   label()     two-line label: line 1 = title / abbreviation (bold), line 2 = full form
//   tagLabel()  small diagram tag (SW2, S3 …) that expands on hover/tap via data-tip
// Label text always comes from slides.js; scenes pass the { title, sub } object through.

import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const div = (cls, text) => {
  const d = document.createElement('div');
  d.className = cls;
  if (text !== undefined) d.textContent = text;
  return d;
};

/**
 * @param def      { title, sub? } from slides.js
 * @param variant  extra class: 'big' | 'accent' | 'left'
 * @param anchor   'bottom' (label sits above the point) | 'center' | 'right' (label sits left of the point)
 */
export function label(def, { variant = '', anchor = 'bottom' } = {}) {
  const el = div(`label3d ${variant ? variant.split(' ').map((v) => `label3d--${v}`).join(' ') : ''}`);
  el.append(div('label3d__title', def.title));
  if (def.sub) el.append(div('label3d__sub', def.sub));
  const obj = new CSS2DObject(el);
  setAnchor(obj, anchor);
  return obj;
}

export function tagLabel(tag, tip, { anchor = 'bottom' } = {}) {
  const el = div('tag3d', tag);
  if (tip) el.setAttribute('data-tip', tip);
  const obj = new CSS2DObject(el);
  setAnchor(obj, anchor);
  return obj;
}

/** Wrap any element (e.g. a counter chip) as a 3D-positioned label. */
export function elementLabel(el, { anchor = 'bottom' } = {}) {
  const obj = new CSS2DObject(el);
  setAnchor(obj, anchor);
  return obj;
}

function setAnchor(obj, anchor) {
  if (anchor === 'bottom') obj.center.set(0.5, 1.15);
  else if (anchor === 'right') obj.center.set(1.05, 0.5);
  else if (anchor === 'left') obj.center.set(-0.05, 0.5);
  else obj.center.set(0.5, 0.5);
}

/** Fade a label; fully transparent labels are hidden so they cannot be hovered. */
export function setLabelOpacity(obj, v) {
  const o = Math.max(0, Math.min(1, v));
  const s = o.toFixed(2);
  if (obj.element.style.opacity !== s) obj.element.style.opacity = s;
  obj.visible = o > 0.02;
}
