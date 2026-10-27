// Slide 27 — glossary, sources and caveats.
// The reference page itself is in the text panel. The 3D view shows a calm dusk view of the
// Slide 1 landscape with the GridOS slab glowing — no demo, no timeline.

import { createScene as createLandscape } from './s01-title.js';

export function createScene(stage, kit, ctx) {
  // Build the Slide 1 landscape with this slide's own label text and no demo steps.
  const obj = createLandscape(stage, kit, { ...ctx, content: { ...ctx.content, steps: [] } });

  // Jump the landscape to its final state: data and commands flowing, GridOS slab lit.
  obj.timeline.progress(1);
  obj.steps = [];
  obj.startPreset = 'gridos';

  // Dusk: dimmer, warmer light.
  obj.scene.traverse((o) => {
    if (o.isDirectionalLight) {
      o.intensity *= 0.55;
      o.color.set('#FFB27A');
    }
    if (o.isHemisphereLight) o.intensity *= 0.6;
  });
  return obj;
}
