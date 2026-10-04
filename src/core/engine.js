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
  const cosechaM = uniq(f.cultivos.flatMap((c) => c.cosecha));
  const siembraM = uniq(f.cultivos.flatMap((c) => c.siembra));
  const ov1 = inter(atraeFlor, aplic);
  return { atraeFlor, riesgoFlor, aplic, amplio, plagaM, cosechaM, siembraM, nativasFauna, ov1 };
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
  // Índice global: promedio ponderado de los módulos activos (pesos renormalizados).
  const pesoTotal = mods.reduce((s, m) => s + (cfg.pesos?.[m.id] ?? 0), 0);
  const overall = pesoTotal ? Math.round(mods.reduce((s, m) => s + m.score * (cfg.pesos[m.id] ?? 0), 0) / pesoTotal) : 0;
  const conf = mods.length ? mods.reduce((s, m) => s + m.conf, 0) / mods.length : 0;

  // Coincidencias de riesgo por mes (para el gráfico de presión).
  const mh = Array.from({ length: 12 }, () => []);
  inter(ctx.atraeFlor, ctx.aplic).forEach((m) => mh[m].push('Aplicación durante floración visitada'));
  inter(f.fertMeses, f.lluviaMeses).forEach((m) => mh[m].push('Fertilización con lluvia fuerte'));
  inter(f.sueloDesnudoMeses, f.lluviaMeses).forEach((m) => mh[m].push('Suelo desnudo con lluvia'));
  inter(ctx.amplio, ctx.plagaM).forEach((m) => mh[m].push('Amplio espectro con plaga presente'));
  inter(ctx.aplic, ctx.cosechaM).forEach((m) => mh[m].push('Aplicación en mes de cosecha'));

  return { mods, overall, conf, mh, ...ctx };
}

// Simulador: aplica cambios hipotéticos a una copia de la finca y recalcula. No toca los datos reales.
export function simular(f, sim, cfg = CONFIG) {
  const g = structuredClone(f);
  const base = contexto(f);
  if (sim.n && g.nObjetivo > 0) g.nAplicado = Math.min(g.nAplicado, g.nObjetivo);
  if (sim.pol) g.plaguicidas.forEach((p) => { if (p.clase !== 'biologico') p.meses = p.meses.filter((m) => !base.atraeFlor.includes(m)); });
  if (sim.riego && (g.riego === 'gravedad' || g.riego === 'aspersion')) g.riego = 'goteo';
  if (sim.suelo) { g.sueloDesnudoMeses = []; if (g.labranza === 'convencional') g.labranza = 'minima'; }
  if (sim.selec) g.plaguicidas.forEach((p) => { if (p.clase === 'amplio') p.clase = 'selectivo'; });
  return evaluar(g, cfg);
}
