// Simplified educational heat-balance model for Slide 19 (DDLR). NOT IEEE 738 — the real
// GridOS DDLR follows IEEE 738. Formulas exactly as in PROMPT.md, Slide 19:
//
//   Tmax = 75 °C
//   qc = kc * sqrt(max(wind, 0.1)) * (0.4 + 0.6 * sin(angle)) * (Tmax - Tamb)   convective cooling
//   qr = kr * (Tmax - Tamb)                                                    radiative cooling
//   qs = ks * solar                                                            solar heating
//   I  = sqrt(max(qc + qr - qs, 0) / R)                                        ampacity
//
// R is derived from the static assumption, so that assumption gives exactly 1.00 pu.
// All numbers are illustrative; 1.00 pu = 400 MW.

export const T_MAX = 75;
export const MW_PER_PU = 400;
export const DEMAND_MW = 480;

// The static (worst-case) weather assumed by a Static Line Rating.
export const STATIC_WEATHER = { tamb: 40, wind: 0.6, angle: 90, solar: 1000 };

// Constants chosen so that, at the static assumption, convection ≈ 10, radiation ≈ 30 and
// solar ≈ 3 (arbitrary heat units). This keeps the teaching model in a plausible range:
// roughly 0.8 pu on a hot, still, sunny day up to about 2 pu on a freezing, windy night.
const KC = 10 / (Math.sqrt(0.6) * (T_MAX - 40));
const KR = 30 / (T_MAX - 40);
const KS = 3 / 1000;

const rad = (deg) => (deg * Math.PI) / 180;
const angleFactor = (angle) => 0.4 + 0.6 * Math.sin(rad(angle));

function heatTerms({ tamb, wind, angle, solar }) {
  const dT = T_MAX - tamb;
  const qc = KC * Math.sqrt(Math.max(wind, 0.1)) * angleFactor(angle) * dT;
  const qr = KR * dT;
  const qs = KS * solar;
  return { qc, qr, qs };
}

const net = (w) => {
  const { qc, qr, qs } = heatTerms(w);
  return Math.max(qc + qr - qs, 0);
};

// R: exactly 1.00 pu at the static assumption.
const R = net(STATIC_WEATHER);

/** Ampacity in per unit for the given weather. */
export function ampacityPu(weather) {
  return Math.sqrt(net(weather) / R);
}

/**
 * Rating for a mode:
 *   'SLR' — always the static value (1.00 pu)
 *   'AAR' — real ambient temperature, static wind and sun
 *   'DLR' — all real weather values
 */
export function ratingPu(mode, weather) {
  if (mode === 'SLR') return ampacityPu(STATIC_WEATHER);
  if (mode === 'AAR') return ampacityPu({ ...STATIC_WEATHER, tamb: weather.tamb });
  return ampacityPu(weather);
}

/**
 * Conductor temperature (°C) for a current in per unit under the given weather:
 * the heat balance solved for T instead of I.
 */
export function conductorTemp(currentPu, weather) {
  const { tamb, wind, angle, solar } = weather;
  const cool = KC * Math.sqrt(Math.max(wind, 0.1)) * angleFactor(angle) + KR;
  return tamb + (R * currentPu * currentPu + KS * solar) / cool;
}

export const MODES = ['SLR', 'AAR', 'DLR'];

/**
 * Seeded illustrative 10-day weather series (daily worst hour) and the DLR rating for each day.
 * Deterministic so the chart looks the same every time.
 */
export function forecastDays(days = 10, seed = 7) {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const out = [];
  for (let d = 0; d < days; d += 1) {
    const weather = {
      tamb: 20 + 18 * rnd(),
      wind: 0.4 + 4.5 * rnd(),
      angle: 15 + 75 * rnd(),
      solar: 400 + 600 * rnd(),
    };
    out.push({ day: d + 1, weather, pu: ampacityPu(weather) });
  }
  return out;
}
