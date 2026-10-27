// Boots the deck. Add ?nowebgl to the URL to preview the no-WebGL fallback.

import './styles.css';
import { slides, sections, ui, legendItems } from './content/slides.js';
import { glossary, exemptions, CATEGORIES } from './content/glossary.js';
import { factById, SOURCES } from './content/facts.js';
import { DeckEngine } from './deck/DeckEngine.js';
import { hasWebGL } from './fallback/noWebGL.js';
import { Stage } from './three/Stage.js';
import { SCENES } from './three/scenes/index.js';
import * as assets from './three/kit/GridAssets.js';
import * as flow from './three/kit/PowerFlow.js';
import * as labels from './three/kit/Labels.js';
import * as charts from './three/kit/Charts3D.js';
import * as cameraKit from './three/kit/Camera.js';
import * as materials from './three/materials.js';

const forceFallback = new URLSearchParams(location.search).has('nowebgl');
const webgl = !forceFallback && hasWebGL();

const engine = new DeckEngine(document.getElementById('app'), {
  slides, sections, ui, legendItems, glossary, categories: CATEGORIES, exemptions, factById, sources: SOURCES,
});

if (webgl) {
  try {
    const stage = new Stage(engine.layout.stageCanvas, { tooltip: engine.tooltip });
    engine.attachStage(stage, { assets, flow, labels, charts, camera: cameraKit, materials }, SCENES);
  } catch (err) {
    console.error('3D stage could not start; showing the static fallback.', err);
  }
}

engine.start();

// Dev server only: expose the engine and the layout checker in the browser console.
if (import.meta.env.DEV) {
  window.__deck = engine;
  if (engine.stage) import('./dev/layoutCheck.js').then((m) => m.install(engine));
}
