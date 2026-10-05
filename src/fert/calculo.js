// Plan de fertilización: nutrientes aplicados, reparto por mes, costos y hallazgos.
// Cada aplicación guarda su dosis en kg de producto por ha y el grado del producto (%).
// Nutriente aplicado (kg/ha) = dosis × grado / 100.

import { CONFIG } from '../core/config.js';
import { QQ_KG, FUENTE_UT, producto } from './catalogo.js';

const r1 = (x) => Math.round(x * 10) / 10;

// Nutrientes de una aplicación, en kg/ha.
export const nutrientes = (a) => ({ n: (a.dosis * a.n) / 100, p: (a.dosis * a.p) / 100, k: (a.dosis * a.k) / 100 });

// Costo de una aplicación en lempiras por ha (precio por quintal de producto), o null sin precio.
export const costoHa = (a) => (a.precioQQ > 0 ? (a.dosis / QQ_KG) * a.precioQQ : null);

// Si la finca tiene plan detallado, el N total y los meses de fertilización salen del plan.
export function conPlan(f) {
  if (!f.fertPlan?.length) return f;
  const n = f.fertPlan.reduce((s, a) => s + nutrientes(a).n, 0);
  return { ...f, nAplicado: Math.round(n * 10) / 10, fertMeses: [...new Set(f.fertPlan.map((a) => a.mes))].sort((x, y) => x - y) };
}

export function resumen(f, cfg = CONFIG) {
  const plan = f.fertPlan ?? [];
  const tot = { n: 0, p: 0, k: 0 };
  const nMes = Array(12).fill(0);
  let costo = 0, conPrecio = 0;
  const filas = plan.map((a) => {
    const nu = nutrientes(a);
    tot.n += nu.n; tot.p += nu.p; tot.k += nu.k;
    nMes[a.mes] += nu.n;
    const c = costoHa(a);
    if (c != null) { costo += c; conPrecio++; }
    // Costo por kg de N, solo para fuentes cuyo único nutriente es N (comparación de UT Extension).
    const soloN = a.n > 0 && !a.p && !a.k;
    return { ...a, kgN: nu.n, kgP: nu.p, kgK: nu.k, nombre: producto(a.producto).nombre, costoHa: c, costoKgN: soloN && a.precioQQ > 0 ? a.precioQQ / (QQ_KG * a.n / 100) : null };
  });
  const lluvia = new Set(f.lluviaMeses);
  const nLluvia = plan.filter((a) => lluvia.has(a.mes)).reduce((s, a) => s + nutrientes(a).n, 0);
  const nVoleoUrea = plan.filter((a) => a.producto === 'urea' && a.metodo === 'voleo').reduce((s, a) => s + nutrientes(a).n, 0);
  const res = {
    filas, tot, nMes,
    fracMaxN: tot.n ? Math.max(...nMes) / tot.n : null, // mayor parte del N en un solo mes
    partesN: nMes.filter((x) => x > 0).length,
    fracLluviaN: tot.n && f.lluviaMeses.length ? nLluvia / tot.n : null,
    fracUreaVoleo: tot.n ? nVoleoUrea / tot.n : null,
    ratio: {
      n: f.nObjetivo > 0 ? tot.n / f.nObjetivo : null,
      p: f.pObjetivo > 0 ? tot.p / f.pObjetivo : null,
      k: f.kObjetivo > 0 ? tot.k / f.kObjetivo : null,
    },
    costoHa: conPrecio ? costo : null,
    costoTotal: conPrecio && f.areaProd > 0 ? costo * f.areaProd : null,
    sinPrecio: plan.length - conPrecio,
  };
  // Fuente de N más barata por kg de N, entre las que tienen precio.
  const fuentes = filas.filter((x) => x.costoKgN != null).sort((a, b) => a.costoKgN - b.costoKgN);
  res.nMasBarato = fuentes[0] ?? null;
  res.hallazgos = hallazgos(f, res, cfg);
  return res;
}

function h(nivel, titulo, detalle, fuente = null) { return { nivel, titulo, detalle, fuente }; }

function hallazgos(f, r, cfg) {
  const out = [];
  if (!f.fertPlan?.length) return out;
  const R = cfg.rubrica.fert;
  const nombres = { n: 'nitrógeno (N)', p: 'fósforo (P₂O₅)', k: 'potasio (K₂O)' };
  for (const x of ['n', 'p', 'k']) {
    const q = r.ratio[x];
    if (q == null) { if (r.tot[x] > 0) out.push(h('criterio', `Sin objetivo de ${nombres[x]}`, `Aplicas ${r1(r.tot[x])} kg/ha, pero no hay un objetivo para compararlo. Defínelo con tu análisis de suelo o tu agrónomo.`)); continue; }
    const pct = Math.round(q * 100);
    if (q > R.dosis.cortes[1]) out.push(h('error', `El ${nombres[x]} supera el objetivo en ${pct - 100} %`, `Aplicas ${r1(r.tot[x])} de ${f[x + 'Objetivo']} kg/ha. El exceso no lo usa el cultivo: se pierde por lavado o escorrentía y cuesta dinero.`));
    else if (q > 1) out.push(h('advertencia', `El ${nombres[x]} está ${pct - 100} % sobre el objetivo`, `Aplicas ${r1(r.tot[x])} de ${f[x + 'Objetivo']} kg/ha.`));
    else if (q < 0.8) out.push(h('advertencia', `El ${nombres[x]} cubre solo el ${pct} % del objetivo`, `Aplicas ${r1(r.tot[x])} de ${f[x + 'Objetivo']} kg/ha. Revisa si el cultivo queda corto.`));
    else out.push(h('ok', `El ${nombres[x]} está en el objetivo (${pct} %)`, `${r1(r.tot[x])} de ${f[x + 'Objetivo']} kg/ha.`));
  }
  if (r.fracMaxN > R.fraccionamiento.cortes[0]) out.push(h(r.fracMaxN > R.fraccionamiento.cortes[1] ? 'error' : 'advertencia',
    `El ${Math.round(r.fracMaxN * 100)} % del N se aplica en un solo mes`,
    'Fraccionar el nitrógeno en varias aplicaciones, cuando el cultivo lo absorbe, reduce lo que se lava antes de usarse. Umbral: criterio propio.'));
  if (r.fracLluviaN > 0) out.push(h(r.fracLluviaN > R.lluvia.cortes[1] ? 'error' : 'advertencia',
    `El ${Math.round(r.fracLluviaN * 100)} % del N cae en meses de lluvia fuerte`,
    'Con lluvia fuerte, el fertilizante recién aplicado puede escurrir o lavarse hacia el agua. Umbral: criterio propio.'));
  if (r.fracUreaVoleo > 0) out.push(h(r.fracUreaVoleo > R.metodo.cortes[1] ? 'error' : 'advertencia',
    `El ${Math.round(r.fracUreaVoleo * 100)} % del N es urea al voleo sin incorporar`,
    'La urea en la superficie puede perder nitrógeno al aire como amoníaco. Incorporarla o aplicarla antes de un riego ligero reduce la pérdida. Umbral: criterio propio.'));
  if (r.nMasBarato && r.filas.filter((x) => x.costoKgN != null).length > 1) out.push(h('criterio',
    `La fuente de N más barata es ${r.nMasBarato.nombre}`, `L ${r1(r.nMasBarato.costoKgN)} por kg de N. Compara por kg de nutriente, no por quintal de producto.`, FUENTE_UT));
  if (r.sinPrecio) out.push(h('criterio', `${r.sinPrecio} aplicación(es) sin precio`, 'Agrega el precio por quintal para calcular el costo por hectárea.'));
  const orden = { error: 0, advertencia: 1, criterio: 2, ok: 3 };
  return out.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
}
