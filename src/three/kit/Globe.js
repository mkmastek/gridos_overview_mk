// Low-poly globe with glowing location pins (deployment slide).
// The land mask is a deliberately coarse sketch of the continents — a stylised globe,
// not a map to measure from.

import * as THREE from 'three';
import { stdMat, glowMat } from '../materials.js';

const D2R = Math.PI / 180;

/** Point on a sphere of radius r for a latitude / longitude in degrees. */
export function latLonToVector3(lat, lon, r) {
  const phi = (90 - lat) * D2R;
  const theta = (lon + 180) * D2R;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

// Rough continent boxes [latMin, latMax, lonMin, lonMax].
const LAND = [
  [15, 72, -168, -55], // North America
  [60, 83, -73, -12], // Greenland
  [-56, 12, -82, -34], // South America
  [36, 71, -10, 40], // Europe
  [-35, 37, -18, 52], // Africa
  [5, 77, 40, 180], // Asia
  [-10, 20, 95, 140], // South-East Asia
  [-44, -10, 112, 154], // Australia
  [-90, -66, -180, 180], // Antarctica
];
const hash = (x, y) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
function isLand(lat, lon) {
  // A little noise so the coasts are not perfectly straight
  const j = (hash(lat, lon) - 0.5) * 8;
  return LAND.some(([a, b, c, d]) => lat + j > a && lat - j < b && lon + j > c && lon - j < d);
}

/** Returns { group, mesh, radius }. Faces are coloured land / ocean; a soft halo surrounds it. */
export function createGlobe({ radius = 3.6, detail = 3, ocean = '#0B2A86', land = ['#0099A8', '#2FB58E', '#5ECC62'] } = {}) {
  const group = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const v = new THREE.Vector3();
  for (let f = 0; f < pos.count; f += 3) {
    v.set(0, 0, 0);
    for (let k = 0; k < 3; k += 1) v.add(new THREE.Vector3().fromBufferAttribute(pos, f + k));
    v.divideScalar(3).normalize();
    const lat = Math.asin(v.y) / D2R;
    const lon = Math.atan2(v.z, -v.x) / D2R - 180;
    const lonN = ((lon + 540) % 360) - 180;
    if (isLand(lat, lonN)) c.set(land[Math.floor(hash(f, 1) * land.length)]);
    else c.set(ocean);
    for (let k = 0; k < 3; k += 1) c.toArray(colors, (f + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const globe = new THREE.Mesh(geo, stdMat('#ffffff', { vertexColors: true, flatShading: true, roughness: 0.8 }));
  globe.castShadow = true;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.08, 32, 20), glowMat('#0FBDFF', { opacity: 0.12, side: THREE.BackSide }));
  group.add(globe, halo);
  return { group, mesh: globe, radius };
}

/**
 * A glowing pin standing on the globe surface at lat/lon.
 * Returns { group, head, normal, setActive(0..1), update(t) }. head.userData can carry an id for picking.
 */
export function createPin(lat, lon, radius, { color = '#0FBDFF' } = {}) {
  const group = new THREE.Group();
  const normal = latLonToVector3(lat, lon, 1).normalize();
  group.position.copy(normal).multiplyScalar(radius);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 6).translate(0, 0.35, 0), stdMat('#E8EDF4'));
  const headMat = stdMat(color, { emissive: color, emissiveIntensity: 0.9 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), headMat);
  head.position.y = 0.78;
  const ringMat = glowMat(color, { opacity: 0.6, blending: THREE.NormalBlending, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 28).rotateX(-Math.PI / 2), ringMat);
  ring.position.y = 0.02;
  group.add(stem, head, ring);
  let active = 0;
  return {
    group,
    head,
    normal,
    setActive(v) {
      active = v;
      head.scale.setScalar(1 + 0.6 * v);
      headMat.emissiveIntensity = 0.9 + 1.2 * v;
    },
    update(t) {
      const pulse = (t * 0.8) % 1;
      ring.scale.setScalar(1 + pulse * (1.5 + 2.5 * active));
      ringMat.opacity = (1 - pulse) * (0.35 + 0.5 * active);
    },
  };
}
