// Colour constants shared by the DOM (legend, panels) and the 3D materials.
// No three.js import here, so the text panel can use it too.

// Mastek brand colours (Mastek Brand Book 2023, "Colors").
export const BRAND = {
  blue: '#001689', // Mastek blue (dark) — headlines and text
  turquoise: '#0099A8',
  green: '#5ECC62',
  yellow: '#EBAA01',
  lightBlue: '#0FBDFF',
  violet: '#AE63E4',
};

// Semantic colours (PROMPT.md 6.2), mapped onto the Mastek palette wherever the meaning
// allows. Fault red, warning orange and AI pink have no brand equivalent and keep their
// own colours so the meaning stays unmistakable. Use consistently in EVERY scene and legend.
export const PALETTE = {
  flow: BRAND.turquoise, // normal energized power flow
  warning: '#F28C28', // heavy loading / warning
  fault: '#E63946', // fault / violation / danger
  off: '#7C88A9', // de-energized / out of service
  reverse: BRAND.violet, // reverse flow from DERs back to the grid
  data: BRAND.lightBlue, // data / telemetry
  command: BRAND.yellow, // control command (software → field)
  ai: '#F15BB5', // AI / analytics highlight
  restored: BRAND.green, // restored / OK
};

// Flow-strip types (the "what is moving" chip under each demo step).
export const FLOW_COLORS = {
  power: PALETTE.flow,
  data: PALETTE.data,
  command: PALETTE.command,
  decision: PALETTE.ai,
  event: PALETTE.fault,
  govern: '#C9D3EE',
  reverse: PALETTE.reverse,
};

// Slide 4 layer tints — separate from the semantic flow colours.
export const LAYER_TINTS = {
  L1: '#9AA8C7',
  L2: BRAND.yellow,
  L3: BRAND.green,
  L4: BRAND.violet,
  L5: BRAND.lightBlue,
  L6: BRAND.lightBlue,
  L7: '#9AA8C7',
};

// The 3D stage: a deep Mastek-blue "map table" (the white logo's preferred background).
export const SCENE = {
  background: '#000A3A',
  ground: '#06195E',
  gridMajor: '#1B3E9E',
  gridMinor: '#0E2B7A',
  windowLit: '#FFD69A',
  windowDark: '#16245A',
};
