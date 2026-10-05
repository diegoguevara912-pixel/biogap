// Plan de fertilización: nutrientes, costos, unidades, hallazgos y conexión con el motor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nutrientes, costoHa, conPlan, resumen } from '../src/fert/calculo.js';
import { PRODUCTOS, QQ_KG, MZ_HA, UNIDADES } from '../src/fert/catalogo.js';
import { evaluar, simular } from '../src/core/engine.js';
import { demoFarm, emptyFarm } from '../src/core/state.js';
import { normalizarFinca, importarTexto, exportarTexto, configBase } from '../src/core/storage.js';

const cerca = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
const ap = (o) => ({ mes: 0, producto: 'otro', n: 0, p: 0, k: 0, dosis: 100, metodo: 'incorporado', precioQQ: null, ...o });

test('reproduce la calculadora de UT Extension (63.152 $/acre)', () => {
  // UT: urea 440 $/ton, DAP 535 $/ton, KCl 705 $/ton; 60 lb N, 30 lb P2O5, 30 lb K2O por acre; aplicación 5 $/acre.
  // El N del DAP se acredita y el resto lo pone la urea; todo el costo del DAP va al P2O5.
  const precioLb = { urea: 440 / 920, dap: 535 / 920, kcl: 705 / 1200 };
  const nDap = (30 * 18) / 46;
  const total = 5 + (60 - nDap) * precioLb.urea + 30 * precioLb.dap + 30 * precioLb.kcl;
  cerca(total, 63.152);
  // Libras de producto con el mismo grado que usa el catálogo.
  const g = (id) => PRODUCTOS.find((p) => p.id === id);
  cerca((60 - nDap) / (g('urea').n / 100), 104.915);
  cerca(30 / (g('dap').p / 100), 65.217);
  cerca(30 / (g('kcl').k / 100), 50);
});

test('nutrientes y costo de una aplicación', () => {
  const a = ap({ producto: '15-15-15', n: 15, p: 15, k: 15, dosis: 300, precioQQ: 1000 });
  assert.deepEqual(nutrientes(a), { n: 45, p: 45, k: 45 });
  cerca(costoHa(a), (300 / QQ_KG) * 1000);
  assert.equal(costoHa(ap({})), null);
});

test('unidades: quintal exacto y manzana de 10 000 varas²', () => {
  assert.equal(QQ_KG, 45.359237);
  cerca(MZ_HA, 0.8359 ** 2, 1e-4);
  cerca(UNIDADES.qqmz.aKgHa, 64.917, 0.01);
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

test('compara fuentes de N por costo por kg de N', () => {
  const f = { ...emptyFarm(), fertPlan: [ap({ producto: 'urea', n: 46, precioQQ: 900 }), ap({ producto: 'nitrato-amonio', n: 34, precioQQ: 800 })] };
  const r = resumen(f);
  cerca(r.nMasBarato.costoKgN, 900 / (QQ_KG * 0.46));
  assert.equal(r.nMasBarato.producto, 'urea'); // más caro por quintal, más barato por kg de N
  assert.equal(r.filas[0].n, 46); // el grado (%) no se pisa con los kg
  assert.equal(r.filas[0].kgN, 46);
});

test('el simulador reduce el plan al objetivo de N sin tocar la finca', () => {
  const f = demoFarm();
  const antes = JSON.stringify(f);
  const fert = (R) => R.mods.find((m) => m.id === 'fert');
  assert.ok(fert(simular(f, { n: true })).score < fert(evaluar(f)).score);
  assert.equal(JSON.stringify(f), antes);
});

test('el plan viaja en el .json y se valida', () => {
  const f = { ...demoFarm(), fertPlan: [...demoFarm().fertPlan, { mes: 14, dosis: 10 }, { mes: 3, dosis: -5 }, { mes: 3, dosis: 50, n: 250, metodo: 'x' }] };
  const r = importarTexto(exportarTexto(f, configBase(), null)).farm;
  assert.equal(r.fertPlan.length, 5); // descarta mes 14 y dosis negativa
  assert.equal(r.fertPlan[4].n, 100); // grado limitado a 100 %
  assert.equal(r.fertPlan[4].metodo, 'voleo');
  assert.deepEqual(normalizarFinca({}).fertPlan, []);
});
