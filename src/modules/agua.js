// Módulo: Agua (riego y cercanía a cuerpos de agua).
import { clamp } from '../core/utils.js';

export default {
  id: 'agua',
  nombre: 'Agua',
  ifa: '30 Agua',
  evaluar(f, ctx, { cfg, factorDistancia }) {
    const P = cfg.riego[f.riego];
    const E = clamp(f.area > 0 ? f.areaProd / f.area : 0);
    const V = factorDistancia(f.distAgua);
    const req = [f.riego !== 'ninguno' || f.area > 0, f.area > 0, f.areaProd > 0, !!f.fuenteAgua];
    const recs = [];
    if (f.riego === 'gravedad') recs.push('Evaluar riego por goteo en los lotes de mayor consumo.');
    if (f.distAgua < 30) recs.push('Mantener una franja de amortiguamiento junto al cuerpo de agua.');
    return {
      P, E, V, req, recs,
      driver: f.riego === 'gravedad' ? 'Riego por gravedad' : '—',
      formula: `P = sistema de riego (gravedad 0.9; aspersión 0.6; goteo 0.3) = ${P.toFixed(2)}\nE = área productiva / área total = ${E.toFixed(2)}\nV = distancia al agua = ${V.toFixed(2)}`,
    };
  },
};
