const paths = {
  names: '<path d="M5 6h14v4M5 6v4m7-7v3M8 11h8l-4 4v5h-3M5 16h14"/>',
  music: '<path d="M9 17V6l11-3v11M9 9l11-3"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="15" rx="3" ry="2"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  book: '<path d="M3 5c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2zM12 7v14"/>',
  expand: '<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/>',
  exit: '<path d="M9 3v6H3m12-6v6h6m0 6h-6v6M3 15h6v6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16.8 7.2-3.1 6.5-6.5 3.1 3.1-6.5z"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  pin: '<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2.2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  atlas: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/>',
  layers: '<path d="m2 8 10-5 10 5-10 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  right: '<path d="m9 5 7 7-7 7"/>'
};
export const icon = name =>
    '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    paths[name] + '</svg>';
