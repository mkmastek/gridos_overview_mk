// Scene registry: a slide names its scene by id; DeckEngine builds it from here.
// To add a slide scene: create sNN-name.js exporting createScene(stage, kit, ctx), add it to
// the registry file of its phase, and set `scene: 'sNN-name'` on the slide's content.

import { createScene as s01 } from './s01-title.js';
import { createScene as s04 } from './s04-architecture.js';
import { createScene as s10 } from './s10-flisr.js';
import { SCENES_PHASE2 } from './registry-phase2.js';
import { SCENES_PHASE3 } from './registry-phase3.js';
import { SCENES_PHASE4 } from './registry-phase4.js';
import { SCENES_PHASE5 } from './registry-phase5.js';

export const SCENES = {
  's01-title': s01,
  's04-architecture': s04,
  's10-flisr': s10,
  ...SCENES_PHASE2,
  ...SCENES_PHASE3,
  ...SCENES_PHASE4,
  ...SCENES_PHASE5,
};
