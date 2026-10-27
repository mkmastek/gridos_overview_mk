// Phase 4 scenes: scene id → createScene. Merged into the registry in index.js.

import { createScene as s17 } from './s17-transmission-overview.js';
import { createScene as s18 } from './s18-aems.js';
import { createScene as s19 } from './s19-ddlr.js';
import { createScene as s20 } from './s20-wams.js';
import { createScene as s21 } from './s21-forecasting.js';
import { createScene as s22 } from './s22-markets.js';

export const SCENES_PHASE4 = {
  's17-transmission-overview': s17,
  's18-aems': s18,
  's19-ddlr': s19,
  's20-wams': s20,
  's21-forecasting': s21,
  's22-markets': s22,
};
