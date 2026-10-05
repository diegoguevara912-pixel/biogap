// Plan de fertilización: nutrientes, costos, unidades, hallazgos y conexión con el motor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nutrientes, conPlan, resumen } from '../src/fert/calculo.js';
import { extraerFert, mesDe, productoDe, unidadDe, metodoDe, PLANTILLA_CSV } from '../src/fert/extraer.js';
import { leerCsv } from '../src/riego/csv.js';
import { CONFIG } from '../src/core/config.js';
import { PRODUCTOS, QQ_KG, MZ_HA, UNIDADES } from '../src/fert/catalogo.js';
import { evaluar, simular } from '../src/core/engine.js';
import { demoFarm, emptyFarm } from '../src/core/state.js';
import { normalizarFinca, importarTexto, exportarTexto, configBase } from '../src/core/storage.js';

const cerca = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
const ap = (o) => ({ mes: 0, producto: 'otro', n: 0, p: 0, k: 0, dosis: 100, metodo: 'incorporado', ...o });

test('reproduce las cantidades de producto de la calculadora de UT Extension', () => {
  // UT: 60 lb N, 30 lb P2O5, 30 lb K2O por acre; el N del DAP se acredita y el resto lo pone la urea.
  const g = (id) => PRODUCTOS.find((p) => p.id === id);
  const nDap = (30 * g('dap').n) / g('dap').p;
  cerca(nDap, 11.739);
  cerca((60 - nDap) / (g('urea').n / 100), 104.915); // lb de urea
  cerca(30 / (g('dap').p / 100), 65.217); // lb de DAP
  cerca(30 / (g('kcl').k / 100), 50); // lb de KCl
});

test('nutrientes de una aplicación', () => {
  assert.deepEqual(nutrientes(ap({ n: 15, p: 15, k: 15, dosis: 300 })), { n: 45, p: 45, k: 45 });
});

test('unidades: quintal exacto y manzana de 10 000 varas²', () => {
  assert.equal(QQ_KG, 45.359237);
  cerca(MZ_HA, 0.8359 ** 2, 1e-4);
  cerca(UNIDADES.qqmz.aKgHa, 64.917, 0.01);
  cerca(UNIDADES.lbacre.aKgHa, 1.12085, 1e-4);
});

test('con plan, el N total y los meses salen del plan', () => {
  const f = { ...emptyFarm(), nAplicado: 999, fertMeses: [11], fertPlan: [ap({ mes: 2, n: 46, dosis: 100 }), ap({ mes: 5, n: 46, dosis: 50 })] };
  const g = conPlan(f);
  assert.equal(g.nAplicado, 69);
  assert.deepEqual(g.fertMeses, [2, 5]);
  const vacia = emptyFarm();
  assert.equal(conPlan(vacia), vacia); // sin plan, la finca queda igual
});

test('hallazgos de la finca demo: exceso de N, urea al voleo y lluvia', () => {
  const r = resumen(demoFarm());
  const t = r.hallazgos.map((h) => `${h.nivel}|${h.titulo}`);
  assert.ok(t.some((x) => x.startsWith('error|El nitrógeno')));
  assert.ok(t.some((x) => x.startsWith('error|El 51 % del N es urea')));
  assert.ok(t.some((x) => x.startsWith('advertencia|El 49 % del N cae')));
  assert.ok(r.fracMaxN < 0.5); // repartido en 4 meses
});

test('el simulador reduce el plan al objetivo de N sin tocar la finca', () => {
  const f = demoFarm();
  const antes = JSON.stringify(f);
  const fert = (R) => R.mods.find((m) => m.id === 'fert');
  assert.ok(fert(simular(f, { n: true })).score < fert(evaluar(f)).score);
  assert.equal(JSON.stringify(f), antes);
});

test('el plan viaja en el .json y se valida', () => {
  const f = { ...demoFarm(), fertPlan: [...demoFarm().fertPlan, { mes: 14, dosis: 10 }, { mes: 3, dosis: -5 }, { mes: 3, dosis: 50, n: 250, metodo: 'x', precioQQ: 900 }] };
  const r = importarTexto(exportarTexto(f, configBase(), null)).farm;
  assert.equal(r.fertPlan.length, 5); // descarta mes 14 y dosis negativa
  assert.equal(r.fertPlan[4].n, 100); // grado limitado a 100 %
  assert.equal(r.fertPlan[4].metodo, 'voleo');
  assert.equal('precioQQ' in r.fertPlan[4], false); // los costos ya no se guardan
  assert.deepEqual(normalizarFinca({}).fertPlan, []);
});

test('lee la plantilla de fertilización (CSV) y convierte unidades', () => {
  const x = extraerFert(leerCsv(PLANTILLA_CSV, 'plantilla.csv'));
  assert.equal(x.plan.length, 3);
  assert.deepEqual(x.plan.map((a) => [a.mes, a.producto, a.metodo]), [[0, '15-15-15', 'incorporado'], [1, 'urea', 'voleo'], [5, 'sulfato-amonio', 'incorporado']]);
  cerca(x.plan[0].dosis, 4.5 * 64.917, 0.05); // 4.5 qq/mz en kg/ha
  assert.deepEqual(x.omitidas, []);
});

test('lector tolerante: encabezados distintos, fechas, fórmulas propias y filas malas', () => {
  const csv = ['Finca El Ejemplo', '', 'Fecha;Fertilizante;Cantidad (kg/ha);Forma', '2026-03-10;18-5-15;200;banda', '15/07/2026;UREA;100;', 'Agosto;Abono raro;50;voleo', 'Sep;KCl;;voleo'].join('\n');
  const x = extraerFert(leerCsv(csv));
  assert.deepEqual(x.plan.map((a) => [a.mes, a.producto, a.n, a.p, a.k, a.dosis, a.metodo]),
    [[2, 'otro', 18, 5, 15, 200, 'incorporado'], [6, 'urea', 46, 0, 0, 100, 'voleo']]);
  assert.equal(x.omitidas.length, 2); // producto no reconocido y dosis vacía
  assert.ok(x.avisos.some((a) => a.includes('al voleo'))); // método faltante: se avisa
});

test('reconoce meses, productos, unidades y métodos', () => {
  assert.deepEqual(['enero', 'Dic', 3, 45000, '2026-11-02', 'x'].map(mesDe), [0, 11, 2, 2, 10, null]);
  assert.equal(productoDe('Fórmula 12-24-12').id, '12-24-12');
  assert.equal(productoDe('Muriato de potasio').id, 'kcl');
  assert.equal(productoDe('algo'), null);
  assert.deepEqual(['kg/ha', 'QQ/MZ', 'lb/acre', 'litros'].map(unidadDe), ['kgha', 'qqmz', 'lbacre', null]);
  assert.deepEqual(['Fertirriego', 'Foliar', 'enterrado', '?'].map(metodoDe), ['fertirriego', 'foliar', 'incorporado', null]);
});

test('vínculo Fertilización → Suelo: fertilizar sobre suelo desnudo en lluvias', () => {
  const suelo = (f) => evaluar(f).mods.find((m) => m.id === 'suelo');
  const base = { ...demoFarm(), sueloDesnudoMeses: [5], lluviaMeses: [5] };
  const fuera = suelo({ ...base, fertPlan: [ap({ mes: 0, n: 46 })] });
  const dentro = suelo({ ...base, fertPlan: [ap({ mes: 5, n: 46 })] });
  assert.ok(dentro.score > fuera.score);
  assert.equal(suelo({ ...base, fertPlan: [] }).variables.find((v) => v.id === 'fertSueloDesnudo').aplica, false); // sin plan, no aplica
});

test('vínculo Fertilización → Agua: fertirriego con un diseño que escurre', () => {
  const agua = (f, x) => evaluar(f, CONFIG, x).mods.find((m) => m.id === 'agua');
  const f = { ...demoFarm(), fertPlan: [ap({ n: 46, metodo: 'fertirriego' })] };
  const escurre = { riego: [{ id: 'escorrentia', nivel: 'error' }] };
  assert.ok(agua(f, escurre).score > agua({ ...f, fertPlan: [ap({ n: 46 })] }, escurre).score);
  // Sin fertirriego, la variable no aplica: no cambia ni el riesgo ni la confianza.
  const sinFR = agua({ ...f, fertPlan: [ap({ n: 46 })] });
  assert.equal(sinFR.variables.find((v) => v.id === 'fertirriegoEscorrentia').aplica, false);
});
