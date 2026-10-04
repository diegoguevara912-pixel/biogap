// Garantiza que la división en módulos no cambió los resultados del prototipo original.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluar } from '../src/core/engine.js';
import { CONFIG } from '../src/core/config.js';
import { demoFarm, emptyFarm } from '../src/core/state.js';

const resumen = (f, cfg) => evaluar(f, cfg).mods.map((m) => [m.id, m.score, m.level, +m.conf.toFixed(4)]);

test('finca demostrativa: mismos puntajes que el prototipo v0.1', () => {
  assert.deepEqual(resumen(demoFarm()), EXPECT_DEMO);
});

test('finca vacía: mismos puntajes que el prototipo v0.1', () => {
  assert.deepEqual(resumen(emptyFarm()), EXPECT_EMPTY);
});

test('desactivar un módulo lo quita del resultado', () => {
  const cfg = { ...CONFIG, modulosActivos: ['poli', 'agua'] };
  assert.deepEqual(evaluar(demoFarm(), cfg).mods.map((m) => m.id), ['poli', 'agua']);
});

test('cada módulo devuelve P, E y V entre 0 y 1', () => {
  for (const m of evaluar(demoFarm()).mods) {
    for (const k of ['P', 'E', 'V']) assert.ok(m[k] >= 0 && m[k] <= 1, `${m.id}.${k}`);
  }
});

const EXPECT_DEMO = [["poli", 67, "Alto", 1], ["fert", 22, "Bajo", 1], ["agua", 39, "Medio", 1], ["suelo", 30, "Bajo", 1], ["troficas", 32, "Bajo", 1]];
const EXPECT_EMPTY = [["poli", 0, "Bajo", 0], ["fert", 0, "Bajo", 0], ["agua", 0, "Bajo", 0], ["suelo", 2, "Bajo", 0.5], ["troficas", 0, "Bajo", 0.25]];

import { simular } from '../src/core/engine.js';

test('índice global: promedio ponderado de los módulos activos', () => {
  const R = evaluar(demoFarm());
  // (67·0.25 + 22·0.2 + 39·0.2 + 30·0.15 + 32·0.2) / 1.0 = 39.85 → 40
  assert.equal(R.overall, 40);
  const solo = evaluar(demoFarm(), { ...CONFIG, modulosActivos: ['poli'] });
  assert.equal(solo.overall, 67); // con un solo módulo, el índice es ese módulo
});

test('presión por mes: febrero y marzo acumulan coincidencias en la finca demo', () => {
  const R = evaluar(demoFarm());
  assert.ok(R.mh[1].includes('Aplicación durante floración visitada'));
  assert.ok(R.mh[2].includes('Aplicación en mes de cosecha'));
  assert.equal(R.mh[3].length, 0);
});

test('el simulador baja el riesgo y no modifica la finca original', () => {
  const f = demoFarm();
  const antes = JSON.stringify(f);
  const R = evaluar(f);
  const RS = simular(f, { n: true, pol: true, riego: true, suelo: true, selec: true });
  assert.equal(JSON.stringify(f), antes);
  assert.ok(RS.overall < R.overall);
  assert.equal(RS.mods.find((m) => m.id === 'poli').score < R.mods.find((m) => m.id === 'poli').score, true);
});
