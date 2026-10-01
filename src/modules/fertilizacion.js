// Módulo: Fertilización (nitrógeno y escorrentía).
import { clamp, inter } from '../core/utils.js';

export default {
  id: 'fert',
  nombre: 'Fertilización',
  ifa: '29 Fertilizantes',
  evaluar(f, ctx, { cfg, factorDistancia }) {
    const ratio = f.nObjetivo > 0 ? f.nAplicado / f.nObjetivo : f.nAplicado > 0 ? 1.5 : 0;
    const P = clamp(ratio - 0.5);
    const ovr = inter(f.fertMeses, f.lluviaMeses).length;
    const E = clamp(cfg.pendiente[f.pendiente] * (0.5 + (0.5 * ovr) / Math.max(1, f.fertMeses.length)));
    const V = factorDistancia(f.distAgua);
    const req = [f.nAplicado > 0, f.nObjetivo > 0, f.fertMeses.length > 0, f.lluviaMeses.length > 0];
    const recs = [];
    if (ratio > 1) recs.push(`La dosis supera el objetivo de la finca en ${Math.round((ratio - 1) * 100)} %. Ajustar hacia ${f.nObjetivo} kg N/ha.`);
    if (ovr) recs.push('Evitar fertilizar en meses de lluvia fuerte para reducir la escorrentía.');
    return {
      P, E, V, req, recs,
      driver: ratio > 1 ? 'Dosis sobre el objetivo' : ovr ? 'Fertilización en lluvias' : '—',
      formula: `P = (N aplicado / N objetivo) − 0.5 = ${P.toFixed(2)}\nE = pendiente × (0.5 + 0.5·meses con lluvia / meses de fertilización) = ${E.toFixed(2)}\nV = distancia al agua (<30 m: 1; <100 m: 0.7; resto 0.4) = ${V.toFixed(2)}`,
    };
  },
};
