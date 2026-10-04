// Módulo: Suelo (labranza, pendiente y suelo desnudo en lluvias).
import { clamp, inter } from '../core/utils.js';

export default {
  id: 'suelo',
  nombre: 'Suelo',
  ifa: '28 Suelo',
  evaluar(f, ctx, { cfg }) {
    const P = cfg.labranza[f.labranza];
    const E = cfg.pendiente[f.pendiente];
    const ovs = inter(f.sueloDesnudoMeses, f.lluviaMeses).length;
    const V = clamp(0.4 + (0.6 * ovs) / Math.max(1, f.lluviaMeses.length));
    const req = [true, true, f.sueloDesnudoMeses.length > 0, f.lluviaMeses.length > 0];
    const recs = [];
    if (ovs) recs.push('Cubrir el suelo en los meses de lluvia en que queda desnudo.');
    if (f.labranza === 'convencional') recs.push('Evaluar labranza mínima en lotes con pendiente.');
    return {
      P, E, V, req, recs,
      driver: ovs ? 'Suelo desnudo en lluvias' : f.labranza === 'convencional' ? 'Labranza convencional' : 'Sin causa dominante',
      formula: `P = labranza (convencional 0.9; mínima 0.5; cero 0.2) = ${P.toFixed(2)}\nE = pendiente (plana 0.3; ondulada 0.6; fuerte 1) = ${E.toFixed(2)}\nV = 0.4 + 0.6·meses desnudos con lluvia / meses de lluvia = ${V.toFixed(2)}`,
    };
  },
};
