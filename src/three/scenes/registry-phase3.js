// Phase 3 scenes: scene id → createScene. Merged into the registry in index.js.

import { createScene as s11 } from './s11-vvo.js';
import { createScene as s12 } from './s12-oms.js';
import { createScene as s13 } from './s13-derms-overview.js';
import { createScene as s14 } from './s14-derms-demo.js';
import { createScene as s15 } from './s15-field.js';
import { createScene as s16 } from './s16-visual-intelligence.js';

export const SCENES_PHASE3 = {
  's11-vvo': s11,
  's12-oms': s12,
  's13-derms-overview': s13,
  's14-derms-demo': s14,
  's15-field': s15,
  's16-visual-intelligence': s16,
};
