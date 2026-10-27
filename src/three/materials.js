// Shared palette materials and helpers.
// Materials marked userData.shared are reused by every scene and are NOT disposed when a
// scene is left. A scene that animates a material's colour or opacity must use its own
// copy (stdMat / glowMat / .clone()), never mutate a shared one.

import * as THREE from 'three';
import { PALETTE, SCENE, LAYER_TINTS, BRAND, FLOW_COLORS } from './palette.js';

export { PALETTE, SCENE, LAYER_TINTS, BRAND, FLOW_COLORS };

export const COLOR = Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, new THREE.Color(v)]));

const markShared = (o) => { o.userData.shared = true; return o; };

/** New matte low-poly material (owned by the caller). */
export function stdMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, flatShading: true, ...opts });
}

/** New unlit glowing material, for flows, beams, sparks (owned by the caller). */
export function glowMat(color, opts = {}) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 1, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, ...opts,
  });
}

let MATS = null;
/** Shared, never-mutated materials for static scenery. */
export function mats() {
  if (MATS) return MATS;
  const m = (color, opts) => markShared(stdMat(color, opts));
  MATS = {
    ground: m(SCENE.ground, { roughness: 1 }),
    tableSide: m('#020C3A', { roughness: 1 }),
    road: m('#122A73', { roughness: 1 }),
    concrete: m('#6B7486'),
    metal: m('#A9B4C4', { metalness: 0.4, roughness: 0.5 }),
    darkMetal: m('#4B5567', { metalness: 0.3, roughness: 0.6 }),
    wood: m('#6D5643'),
    insulator: m('#C9D3E0', { roughness: 0.4 }),
    wall: m('#D9DEE8'),
    roof: m('#7C4A3A'),
    roofAlt: m('#4F5D73'),
    solar: m('#1E3A6E', { metalness: 0.5, roughness: 0.3, emissive: '#0c1f44', emissiveIntensity: 0.6 }),
    battery: m('#EEF2F7'),
    trunk: m('#5A4433'),
    foliage: m('#2F6B4F'),
    white: m('#E8EDF4'),
    building: m('#8C97A8'),
    buildingDark: m('#3A4558'),
    turbine: m('#EEF1F5', { roughness: 0.6 }),
    truck: m('#F2F4F7'),
    truckStripe: m('#F4A261'),
    tyre: m('#1A1F29', { roughness: 1 }),
    glassDark: m('#22324D', { metalness: 0.3, roughness: 0.3 }),
    person: m('#B9C4D6'),
  };
  return MATS;
}

let GLOW_TEX = null;
/** Soft round sprite used by particle flows (shared). */
export function glowTexture() {
  if (GLOW_TEX) return GLOW_TEX;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  GLOW_TEX = markShared(new THREE.CanvasTexture(c));
  GLOW_TEX.colorSpace = THREE.SRGBColorSpace;
  return GLOW_TEX;
}

const TEXTURE_KEYS = ['map', 'alphaMap', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'bumpMap', 'envMap', 'lightMap'];

/** Free GPU memory of everything under `root` except shared geometries/materials/textures. */
export function disposeHierarchy(root) {
  root.traverse((obj) => {
    if (obj.geometry && !obj.geometry.userData.shared) obj.geometry.dispose();
    const list = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const mat of list) {
      if (mat.userData.shared) continue;
      for (const k of TEXTURE_KEYS) {
        const t = mat[k];
        if (t && t.isTexture && !t.userData.shared) t.dispose();
      }
      mat.dispose();
    }
    if (obj.isInstancedMesh) obj.dispose();
    if (obj.isLight && obj.shadow?.map) obj.shadow.dispose();
    if (obj.isCSS2DObject) obj.element.remove();
  });
}

/** Lerp a THREE.Color between palette colours without allocating. */
export function mixColor(out, a, b, t) {
  return out.copy(a).lerp(b, Math.max(0, Math.min(1, t)));
}
