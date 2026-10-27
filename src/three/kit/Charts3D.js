// Small 3D chart pieces. Phase 1: a vertical bar gauge with a limit line
// (Feeder B loading on the FLISR slide). Later phases add ribbons, area charts and dials.

import * as THREE from 'three';
import { stdMat, glowMat } from '../materials.js';

/**
 * Vertical bar gauge. Value is a percentage; the frame spans 0..maxPct, with a
 * bright limit line at limitPct.
 */
export function createBarGauge({ height = 4, width = 0.7, maxPct = 140, limitPct = 100 } = {}) {
  const group = new THREE.Group();

  const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, width));
  const frameMat = new THREE.LineBasicMaterial({ color: '#9AA8BF', transparent: true, opacity: 0.6 });
  const frame = new THREE.LineSegments(frameGeo, frameMat);
  frame.position.y = height / 2;

  const base = new THREE.Mesh(new THREE.BoxGeometry(width * 1.6, 0.12, width * 1.6), stdMat('#2A3550'));
  base.position.y = 0.06;

  const fillGeo = new THREE.BoxGeometry(width * 0.82, 1, width * 0.82);
  fillGeo.translate(0, 0.5, 0);
  const fillMat = stdMat('#80ED99', { emissive: '#80ED99', emissiveIntensity: 0.55, transparent: true, opacity: 0.92 });
  const fill = new THREE.Mesh(fillGeo, fillMat);
  fill.scale.y = 0.001;

  const limitY = (limitPct / maxPct) * height;
  const limit = new THREE.Mesh(new THREE.BoxGeometry(width * 1.5, 0.05, width * 1.5), glowMat('#E63946', { blending: THREE.NormalBlending }));
  limit.position.y = limitY;

  group.add(base, frame, fill, limit);

  return {
    group,
    limitY,
    topY: height,
    setValue(pct) {
      fill.scale.y = Math.max(0.001, (Math.min(pct, maxPct) / maxPct) * height);
    },
    setColor(color) {
      fillMat.color.copy(color);
      fillMat.emissive.copy(color);
    },
    setOpacity(o) {
      group.visible = o > 0.01;
      frameMat.opacity = 0.6 * o;
      fillMat.opacity = 0.92 * o;
      limit.material.opacity = o;
      base.material.transparent = true;
      base.material.opacity = o;
    },
  };
}
