// WebGL detection and the static fallback: text panel + a numbered list of the demo steps.

import { solveFlisr, flisrSteps, FLISR_TOPOLOGY } from '../sim/flisrSolver.js';

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

/** The demo captions of a slide, without building its 3D scene. */
export function staticSteps(slide) {
  if (slide.flisr) return flisrSteps(solveFlisr(FLISR_TOPOLOGY, { fault: 'S3' }), slide.flisr).map((s) => s.caption);
  return (slide.steps || []).map((s) => s.caption);
}
