// Módulo: Polinizadores. Origen del proyecto (caso Spathodea y abejas nativas).
import { M, clamp } from '../core/utils.js';

export default {
  id: 'poli',
  nombre: 'Polinizadores',
  ifa: '22 Biodiversidad · 31 MIP · 32 Fitosanitarios',
  evaluar(f, ctx) {
    const { atraeFlor, riesgoFlor, aplic, nativasFauna, ov1 } = ctx;
    const P = clamp(0.5 * (riesgoFlor.length > 0 ? 1 : 0) + 0.5 * (aplic.length > 0 ? 1 : 0));
    const E = clamp((ov1.length + riesgoFlor.length * 0.5) / 6);
    const V = nativasFauna ? 1 : 0.7;
    const req = [f.especies.length > 0, atraeFlor.length > 0, f.plaguicidas.length > 0, f.especies.some((e) => e.tipo === 'Fauna')];
    const recs = [];
    if (ov1.length) recs.push(`Mover las aplicaciones fuera de ${ov1.map((m) => M[m]).join(', ')}: coinciden con floración visitada por polinizadores.`);
    if (riesgoFlor.length) recs.push('Hay especies de riesgo para polinizadores en floración. Evaluar refugio o radio de exclusión alrededor de los árboles (método ApiRadar).');
    return {
      P, E, V, req, recs,
      driver: ov1.length ? 'Coincidencia floración–aplicación' : riesgoFlor.length ? 'Especies de riesgo en floración' : '—',
      formula: `P = 0.5·[especie de riesgo] + 0.5·[aplicaciones no biológicas] = ${P.toFixed(2)}\nE = (meses de coincidencia + 0.5·meses de floración de riesgo) / 6 = ${E.toFixed(2)}\nV = 1 si hay abejas nativas registradas, 0.7 si no = ${V.toFixed(2)}`,
    };
  },
};
