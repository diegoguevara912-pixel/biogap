// Cuestionario: propósito sin cultivos, plagas sugeridas por cultivo, cultivos aledaños y presencia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluar, modulosDe } from '../src/core/engine.js';
import { CONFIG } from '../src/core/config.js';
import { emptyFarm, demoFarm } from '../src/core/state.js';
import { normalizarFinca } from '../src/core/storage.js';
import { plagasDe } from '../src/especies/plagas.js';

test('sin cultivos, el propósito enfoca los módulos; con cultivos no cambia nada', () => {
  const f = { ...emptyFarm(), tieneCultivos: false, proposito: ['polinizadores'] };
  assert.deepEqual(modulosDe(f), ['poli', 'troficas']);
  assert.deepEqual(evaluar({ ...f, proposito: ['polinizadores', 'riego'] }).mods.map((m) => m.id), ['poli', 'agua', 'troficas']);
  assert.deepEqual(modulosDe({ ...f, proposito: [] }), CONFIG.modulosActivos);
  assert.deepEqual(modulosDe({ ...f, tieneCultivos: true }), CONFIG.modulosActivos);
});

test('cada propósito apunta a módulos que existen', () => {
  for (const p of CONFIG.propositos) for (const m of p.modulos) assert.ok(CONFIG.modulosActivos.includes(m), `${p.id} → ${m}`);
});

test('plagas sugeridas según el cultivo escrito por el usuario', () => {
  assert.ok(plagasDe('Maíz').some((p) => p.startsWith('Gusano cogollero')));
  assert.ok(plagasDe('maiz amarillo').length > 0);
  assert.ok(plagasDe('Caña').length > 0);
  assert.deepEqual(plagasDe('Pitahaya'), []);
});

test('campos nuevos se validan al cargar una finca', () => {
  const f = normalizarFinca({
    tieneCultivos: false, proposito: ['riego', 'inventado'],
    cultivosAledanos: [{ nombre: ' Café ', distancia: 200 }, { nombre: '' }, { nombre: 'Maíz', distancia: -3 }],
    especies: [{ nombre: 'a', presencia: 'alta' }, { nombre: 'b', presencia: 'muchísima' }],
    plagas: [{ nombre: 'x', cultivo: 'Maíz', presencia: 'baja' }],
  });
  assert.deepEqual(f.proposito, ['riego']);
  assert.deepEqual(f.cultivosAledanos, [{ nombre: 'Café', distancia: 200 }, { nombre: 'Maíz', distancia: null }]);
  assert.equal(f.especies[0].presencia, 'alta');
  assert.equal('presencia' in f.especies[1], false);
  assert.equal(f.plagas[0].cultivo, 'Maíz');
  assert.deepEqual(normalizarFinca(demoFarm()).cultivosAledanos, demoFarm().cultivosAledanos);
});
