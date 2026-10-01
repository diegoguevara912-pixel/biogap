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
