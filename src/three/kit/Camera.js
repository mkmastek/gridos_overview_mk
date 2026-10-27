// Camera presets and smooth moves.
// A preset is { pos: [x, y, z], target: [x, y, z] }, authored for a ~1.5 wide stage.
// On narrower screens (tablet, phone) the camera is pushed back along its view line so
// the same content still fits.

import * as THREE from 'three';
import { gsap } from 'gsap';

export const REF_ASPECT = 1.5;

export function fitPreset(preset, aspect) {
  const target = new THREE.Vector3(...preset.target);
  const pos = new THREE.Vector3(...preset.pos);
  const k = Math.max(1, REF_ASPECT / Math.max(aspect, 0.3)) ** 0.85;
  if (k > 1) pos.sub(target).multiplyScalar(k).add(target);
  return { pos, target };
}

/** A preset moved `factor` times further out — used for the fly-in when a slide opens. */
export function farther(preset, factor = 1.35) {
  const t = new THREE.Vector3(...preset.target);
  const p = new THREE.Vector3(...preset.pos).sub(t).multiplyScalar(factor).add(t);
  return { pos: p.toArray(), target: preset.target };
}

/**
 * Fly `camera` + OrbitControls `controls` to a preset. Returns the tween (or null if instant).
 */
export function flyTo(camera, controls, preset, { duration = 1.4, instant = false, from = null } = {}) {
  const dest = fitPreset(preset, camera.aspect);
  if (from) {
    const f = fitPreset(from, camera.aspect);
    camera.position.copy(f.pos);
    controls.target.copy(f.target);
  }
  if (instant) {
    camera.position.copy(dest.pos);
    controls.target.copy(dest.target);
    controls.update();
    return null;
  }
  const p0 = camera.position.clone();
  const t0 = controls.target.clone();
  const s = { t: 0 };
  return gsap.to(s, {
    t: 1,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.position.lerpVectors(p0, dest.pos, s.t);
      controls.target.lerpVectors(t0, dest.target, s.t);
    },
  });
}
