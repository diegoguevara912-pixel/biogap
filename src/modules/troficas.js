// Módulo: Cadenas tróficas (plaguicidas de amplio espectro y enemigos naturales).
import { clamp, inter } from '../core/utils.js';

export default {
  id: 'troficas',
  nombre: 'Cadenas tróficas',
  ifa: '22 Biodiversidad · 31 MIP',
  evaluar(f, ctx) {
    const { amplio, plagaM } = ctx;
    const tot = f.plaguicidas.length;
    const P = tot ? f.plaguicidas.filter((p) => p.clase === 'amplio').length / tot : 0;
    const E = amplio.length ? inter(amplio, plagaM).length / amplio.length : 0;
    const nat = f.especies.length ? f.especies.filter((e) => e.origen === 'nativa').length / f.especies.length : 0;
    const V = clamp(1 - 0.6 * nat);
    const req = [tot > 0, f.plagas.length > 0, f.especies.length > 0, true];
    const recs = [];
    if (P > 0 && E > 0) recs.push('Preferir productos selectivos o biológicos en los meses de plaga para proteger a los enemigos naturales.');
    if (nat < 0.5 && f.especies.length) recs.push('Aumentar la proporción de especies nativas en cercas y bordes.');
    return {
      P, E, V, req, recs,
      driver: P > 0 ? 'Plaguicidas de amplio espectro' : '—',
      formula: `P = aplicaciones de amplio espectro / total = ${P.toFixed(2)}\nE = meses de amplio espectro que coinciden con plagas / meses de amplio espectro = ${E.toFixed(2)}\nV = 1 − 0.6·proporción de especies nativas = ${V.toFixed(2)}`,
    };
  },
};
