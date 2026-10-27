// Phase 2 scenes: scene id → createScene. Merged into the registry in index.js.

import { createScene as s02 } from './s02-portfolio.js';
import { createScene as s03 } from './s03-why-gridos.js';
import { createScene as s05 } from './s05-data-fabric.js';
import { createScene as s06 } from './s06-zero-trust-cloud.js';
import { createScene as s07 } from './s07-distribution-overview.js';
import { createScene as s08 } from './s08-gnm.js';
import { createScene as s09 } from './s09-adms-overview.js';

export const SCENES_PHASE2 = {
  's02-portfolio': s02,
  's03-why-gridos': s03,
  's05-data-fabric': s05,
  's06-zero-trust-cloud': s06,
  's07-distribution-overview': s07,
  's08-gnm': s08,
  's09-adms-overview': s09,
};
