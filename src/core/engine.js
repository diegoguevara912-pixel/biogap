// Motor de riesgo: Riesgo = 100 × P × E × V por módulo.
// P = presión de la práctica, E = exposición, V = vulnerabilidad del receptor.
// Cada módulo vive en src/modules/ y solo recibe la finca y un contexto común.

import { CONFIG } from './config.js';
import { uniq, inter } from './utils.js';
import { MODULOS } from '../modules/index.js';

export const nivel = (v, cfg = CONFIG) => (v >= cfg.niveles.alto ? 'Alto' : v >= cfg.niveles.medio ? 'Medio' : 'Bajo');

export const factorDistancia = (d, cfg = CONFIG) => cfg.distanciaAgua.find((t) => d < t.menorQue).factor;

// Calendarios derivados que comparten varios módulos.
export function contexto(f) {
  const atraeFlor = uniq(f.especies.filter((e) => e.atrae).flatMap((e) => e.floracion));
  const riesgoFlor = uniq(f.especies.filter((e) => e.riesgo).flatMap((e) => e.floracion));
  const aplic = uniq(f.plaguicidas.filter((p) => p.clase !== 'biologico').flatMap((p) => p.meses));
  const amplio = uniq(f.plaguicidas.filter((p) => p.clase === 'amplio').flatMap((p) => p.meses));
  const plagaM = uniq(f.plagas.flatMap((p) => p.meses));
  const nativasFauna = f.especies.some((e) => e.tipo === 'Fauna' && e.origen === 'nativa');
  const ov1 = inter(atraeFlor, aplic);
  return { atraeFlor, riesgoFlor, aplic, amplio, plagaM, nativasFauna, ov1 };
}

export function evaluar(f, cfg = CONFIG) {
  const ctx = contexto(f);
  const helpers = { cfg, factorDistancia: (d) => factorDistancia(d, cfg) };
  const mods = cfg.modulosActivos
    .map((id) => MODULOS.find((m) => m.id === id))
    .filter(Boolean)
    .map((mod) => {
      const r = mod.evaluar(f, ctx, helpers);
      const score = Math.round(100 * r.P * r.E * r.V);
      return {
        id: mod.id, nombre: mod.nombre, ifa: mod.ifa, ...r,
        score, level: nivel(score, cfg), conf: r.req.filter(Boolean).length / r.req.length,
      };
    });
  return { mods, ...ctx };
}
