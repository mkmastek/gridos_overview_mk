// Phase 5 scenes: scene id → createScene. Merged into the registry in index.js.

import { createScene as s23 } from './s23-resilience.js';
import { createScene as s24 } from './s24-workflow-storm.js';
import { createScene as s25 } from './s25-workflow-solar.js';
import { createScene as s26 } from './s26-deployment.js';
import { createScene as s27 } from './s27-glossary-sources.js';

export const SCENES_PHASE5 = {
  's23-resilience': s23,
  's24-workflow-storm': s24,
  's25-workflow-solar': s25,
  's26-deployment': s26,
  's27-glossary-sources': s27,
};
