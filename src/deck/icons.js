// Inline SVG icons for buttons (no icon font, no external files).
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;

export const ICONS = {
  prev: svg('M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z'),
  next: svg('M8.6 18.6 10 20l8-8-8-8-1.4 1.4 6.6 6.6z'),
  menu: svg('M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z'),
  close: svg('M18.3 5.7 16.9 4.3 12 9.2 7.1 4.3 5.7 5.7 10.6 10.6 5.7 15.5l1.4 1.4 4.9-4.9 4.9 4.9 1.4-1.4-4.9-4.9z'),
  play: svg('M7 4.5v15l12.5-7.5z'),
  pause: svg('M6 4.5h4.5v15H6zm7.5 0H18v15h-4.5z'),
  stepBack: svg('M6 5h2v14H6zm3.5 7L19 18.5v-13z'),
  stepForward: svg('M16 5h2v14h-2zM5 5.5v13l9.5-6.5z'),
  restart: svg('M12 5V2L7.5 6 12 10V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z'),
  resetView: svg('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-8 3H1v2h3a8 8 0 0 0 7 7v3h2v-3a8 8 0 0 0 7-7h3v-2h-3a8 8 0 0 0-7-7V1h-2v3a8 8 0 0 0-7 7zm8-5a6 6 0 1 1 0 12 6 6 0 0 1 0-12z'),
};
