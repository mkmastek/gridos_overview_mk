// Helpers shared by scene modules.
//
// Every scene module exports createScene(stage, kit, ctx) and returns (via finishScene):
//   scene, camera                three.js objects
//   timeline                     gsap.timeline({ paused: true }) with labels "step1".."stepN"
//   steps                        [{ id, caption, flow, camera }] — captions and flows come from the content files
//   startPreset                  name of the camera preset at step 0
//   cameraPreset(name)           → { pos, target }  (steps name their preset in `camera`)
//   onEnter(), onExit()          start / stop idle loops
//   update(dt, t)                per-frame update (only called while the scene is visible)
//   setReducedMotion(on)
//   dispose()                    free geometries, materials, textures, labels
// Optional: interactions (slide-specific controls), onClick / onHover (picking), onStep(k).
//
// ctx (from DeckEngine): { content, ui, setHud(hud|null), emit(type, data), timelineChanged() }

import { gsap } from 'gsap';
import { disposeHierarchy } from '../materials.js';

export function finishScene(def) {
  const flows = def.flows || [];
  const obj = {
    interactions: [],
    controlsLimits: {},
    startPreset: null,
    update() {},
    onEnter() {},
    onExit() {},
    ...def,
  };
  // Presets are looked up by name at fly time, so scenes can compute them from live state.
  obj.cameraPreset = def.cameraPreset || ((name) => def.presets?.[name] || null);
  obj.setReducedMotion = (on) => {
    for (const f of flows) f.setReducedMotion?.(on);
    def.setReducedMotion?.(on);
  };
  obj.dispose = () => {
    obj.timeline?.kill();
    def.dispose?.();
    for (const f of flows) f.dispose?.();
    disposeHierarchy(obj.scene);
    obj.scene.clear();
  };
  return obj;
}

/** Steps from the content file (caption + flow strip) plus a camera preset name per step. */
export function stepsFromContent(content, cameras) {
  return (content.steps || []).map((s, i) => ({ id: s.id, caption: s.caption, flow: s.flow || null, camera: cameras[i] }));
}

/** A paused timeline with step labels at the given beat lengths (seconds). */
export function stepTimeline(durations, build) {
  const tl = gsap.timeline({ paused: true });
  let t = 0;
  durations.forEach((d, i) => {
    tl.addLabel(`step${i + 1}`, t);
    build(tl, `step${i + 1}`, i + 1);
    t += d;
  });
  // Pad the end so the last beat has its full length even if its tweens are shorter.
  tl.set({}, {}, t);
  return tl;
}

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const lerp = (a, b, t) => a + (b - a) * t;
