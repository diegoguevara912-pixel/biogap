// Utilidades compartidas por el motor y la interfaz.
export const M = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const uniq = (a) => [...new Set(a)].sort((x, y) => x - y);
export const inter = (a, b) => a.filter((x) => b.includes(x));
