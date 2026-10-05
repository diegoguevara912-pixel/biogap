// Casos de EJEMPLO para la memoria de casos. Son fincas ficticias: sirven para demostrar
// que el método funciona (perfil, distancia, vecinos), no para decir qué funciona en campo.
// Todos llevan origen: 'ejemplo' y la app los marca así en pantalla. Nunca se presentan como reales.
// Tres "protagonistas" con riesgo bajo, medio y alto, y seis de relleno para que el k-NN
// tenga entre qué elegir. Ninguno trae coordenadas ni nombres de productores.

import { emptyFarm } from '../core/state.js';

const finca = (o) => ({ ...emptyFarm(), tieneCultivos: true, gg: 'si', ...o });
const esp = (nombre, tipo, origen, floracion = [], atrae = false, riesgo = false) => ({ nombre, tipo, origen, floracion, atrae, riesgo });
const abejas = [esp('Trigona fulviventris', 'Fauna', 'nativa'), esp('Plebeia melanica', 'Fauna', 'nativa')];
const spathodea = esp('Spathodea campanulata', 'Árbol', 'exótica', [0, 1, 2, 3], true, true);

export const CASOS_EJEMPLO = [
  // ── Protagonistas ──────────────────────────────────────────────
  {
    id: 'ej-a', origen: 'ejemplo', etiqueta: 'Finca A · café bajo sombra (riesgo bajo)',
    finca: finca({
      nombre: 'Finca A (ejemplo)', depto: 'El Paraíso', area: 8, areaProd: 6, altitud: 1250, pendiente: 'ondulada',
      fuenteAgua: 'Nacimiento', distAgua: 320, riego: 'goteo',
      cultivos: [{ nombre: 'Café', ha: 6, siembra: [5], cosecha: [10, 11, 0] }],
      especies: [esp('Inga sp.', 'Árbol', 'nativa', [1, 2], true), esp('Gliricidia sepium', 'Árbol', 'nativa', [0, 1], true), ...abejas],
      nAplicado: 120, nObjetivo: 130, fertMeses: [4, 10], lluviaMeses: [5, 6, 8, 9],
      plaguicidas: [{ producto: 'Beauveria bassiana', clase: 'biologico', meses: [6, 7] }],
      plagas: [{ nombre: 'Broca del café', meses: [6, 7], severidad: 'media' }],
      sueloDesnudoMeses: [], labranza: 'cero',
      acciones: ['Cobertura viva en calles', 'Control biológico de broca', 'Registro de aplicaciones al día'],
      resultado: { ncAntes: 2, ncDespues: 0, laminaAntes: 1.05, laminaDespues: 1.0 },
    }),
  },
  {
    id: 'ej-b', origen: 'ejemplo', etiqueta: 'Finca B · maíz con aspersión (riesgo medio)',
    finca: finca({
      nombre: 'Finca B (ejemplo)', depto: 'Olancho', area: 14, areaProd: 10, altitud: 450, pendiente: 'ondulada',
      fuenteAgua: 'Río', distAgua: 45, riego: 'aspersion',
      cultivos: [{ nombre: 'Maíz', ha: 10, siembra: [4, 5], cosecha: [8, 9] }],
      especies: [esp('Gliricidia sepium', 'Árbol', 'nativa', [0, 1, 2], true), esp('Leucaena', 'Árbol', 'nativa', [7, 8], true), esp('Pasto estrella', 'Maleza', 'exótica'), abejas[0]],
      nAplicado: 170, nObjetivo: 150, fertMeses: [5, 6], lluviaMeses: [5, 6, 8, 9],
      plaguicidas: [{ producto: 'Insecticida selectivo', clase: 'selectivo', meses: [6] }, { producto: 'Insecticida de amplio espectro', clase: 'amplio', meses: [5, 8] }],
      plagas: [{ nombre: 'Gusano cogollero', meses: [5, 6], severidad: 'alta' }],
      sueloDesnudoMeses: [4, 5], labranza: 'convencional',
      acciones: ['Fraccionar el nitrógeno en 3 aplicaciones', 'Riego por la noche para bajar pérdidas', 'Análisis de agua por ciclo'],
      resultado: { ncAntes: 4, ncDespues: 2, laminaAntes: 1.4, laminaDespues: 1.15 },
    }),
  },
  {
    id: 'ej-c', origen: 'ejemplo', etiqueta: 'Finca C · frijol en ladera (riesgo alto)',
    finca: finca({
      nombre: 'Finca C (ejemplo)', depto: 'La Paz', area: 6, areaProd: 5.5, altitud: 900, pendiente: 'fuerte',
      fuenteAgua: 'Quebrada', distAgua: 20, riego: 'gravedad',
      cultivos: [{ nombre: 'Frijol', ha: 5.5, siembra: [4, 8], cosecha: [6, 10] }],
      especies: [spathodea, esp('Eucalipto', 'Árbol', 'exótica', [6, 7], true), esp('Gliricidia sepium', 'Árbol', 'nativa', [0, 1], true), ...abejas],
      nAplicado: 210, nObjetivo: 120, fertMeses: [5, 8, 9], lluviaMeses: [5, 6, 8, 9],
      plaguicidas: [{ producto: 'Insecticida de amplio espectro', clase: 'amplio', meses: [0, 1, 5, 6] }, { producto: 'Fungicida de contacto', clase: 'amplio', meses: [8, 9] }],
      plagas: [{ nombre: 'Mosca blanca', meses: [0, 1, 5], severidad: 'alta' }, { nombre: 'Babosa', meses: [8, 9], severidad: 'media' }],
      sueloDesnudoMeses: [4, 5, 8], labranza: 'convencional',
      acciones: ['Franja de protección de 30 m en la quebrada', 'Aplicaciones fuera de la floración (Ene-Feb)', 'Barreras vivas en curvas a nivel', 'Ajustar el nitrógeno al análisis de suelo'],
      resultado: { ncAntes: 7, ncDespues: 3, laminaAntes: 1.8, laminaDespues: 1.25 },
    }),
  },
  // ── Relleno ────────────────────────────────────────────────────
  {
    id: 'ej-d', origen: 'ejemplo', etiqueta: 'Finca D · maíz de temporal',
    finca: finca({
      nombre: 'Finca D (ejemplo)', depto: 'Comayagua', area: 9, areaProd: 7, altitud: 600, pendiente: 'ondulada',
      fuenteAgua: 'Pozo', distAgua: 150, riego: 'ninguno',
      cultivos: [{ nombre: 'Maíz', ha: 7, siembra: [4], cosecha: [8] }],
      especies: [esp('Gliricidia sepium', 'Árbol', 'nativa', [0, 1], true), esp('Pasto jaragua', 'Maleza', 'exótica'), abejas[1]],
      nAplicado: 140, nObjetivo: 150, fertMeses: [5], lluviaMeses: [5, 6, 8, 9],
      plaguicidas: [{ producto: 'Insecticida selectivo', clase: 'selectivo', meses: [5] }],
      plagas: [{ nombre: 'Gusano cogollero', meses: [5], severidad: 'media' }],
      sueloDesnudoMeses: [3], labranza: 'minima',
      acciones: ['Monitoreo semanal de cogollero', 'Rastrojo sobre el suelo'],
      resultado: { ncAntes: 3, ncDespues: 1, laminaAntes: null, laminaDespues: null },
    }),
  },
  {
    id: 'ej-e', origen: 'ejemplo', etiqueta: 'Finca E · arroz por inundación',
    finca: finca({
      nombre: 'Finca E (ejemplo)', depto: 'Yoro', area: 30, areaProd: 26, altitud: 120, pendiente: 'plana',
      fuenteAgua: 'Canal de río', distAgua: 40, riego: 'gravedad',
      cultivos: [{ nombre: 'Arroz', ha: 26, siembra: [5], cosecha: [9] }],
      especies: [esp('Ceiba', 'Árbol', 'nativa', [0, 1], true), esp('Pasto', 'Maleza', 'exótica')],
      nAplicado: 150, nObjetivo: 140, fertMeses: [6, 7], lluviaMeses: [5, 6, 8, 9],
      plaguicidas: [{ producto: 'Herbicida', clase: 'amplio', meses: [5, 6] }],
      plagas: [{ nombre: 'Sogata', meses: [7], severidad: 'media' }],
      sueloDesnudoMeses: [3, 4], labranza: 'convencional',
      acciones: ['Nivelación láser de las pozas', 'Cierre de compuertas después de fertilizar'],
      resultado: { ncAntes: 5, ncDespues: 3, laminaAntes: 1.6, laminaDespues: 1.3 },
    }),
  },
  {
    id: 'ej-f', origen: 'ejemplo', etiqueta: 'Finca F · sorgo sin riego',
    finca: finca({
      nombre: 'Finca F (ejemplo)', depto: 'Choluteca', area: 12, areaProd: 9, altitud: 80, pendiente: 'plana',
      fuenteAgua: 'Ninguna cercana', distAgua: 450, riego: 'ninguno',
      cultivos: [{ nombre: 'Sorgo', ha: 9, siembra: [8], cosecha: [11] }],
      especies: [esp('Jícaro', 'Árbol', 'nativa', [1, 2], true), abejas[0]],
      nAplicado: 80, nObjetivo: 90, fertMeses: [8], lluviaMeses: [5, 8, 9],
      plaguicidas: [], plagas: [{ nombre: 'Pulgón amarillo', meses: [10], severidad: 'baja' }],
      sueloDesnudoMeses: [], labranza: 'cero',
      acciones: ['Siembra directa sobre rastrojo'],
      resultado: { ncAntes: 1, ncDespues: 0, laminaAntes: null, laminaDespues: null },
    }),
  },
  {
    id: 'ej-g', origen: 'ejemplo', etiqueta: 'Finca G · banano con aspersión subfoliar',
    finca: finca({
      nombre: 'Finca G (ejemplo)', depto: 'Cortés', area: 40, areaProd: 35, altitud: 30, pendiente: 'plana',
      fuenteAgua: 'Río', distAgua: 60, riego: 'aspersion',
      cultivos: [{ nombre: 'Banano', ha: 35, siembra: [], cosecha: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }],
      especies: [esp('Heliconia', 'Arbusto', 'nativa', [3, 4, 5], true), esp('Pasto', 'Maleza', 'exótica'), abejas[0]],
      nAplicado: 380, nObjetivo: 400, fertMeses: [1, 4, 7, 10], lluviaMeses: [6, 7, 9, 10],
      plaguicidas: [{ producto: 'Fungicida para sigatoka', clase: 'amplio', meses: [6, 7, 8, 9, 10] }],
      plagas: [{ nombre: 'Sigatoka negra', meses: [6, 7, 8, 9, 10], severidad: 'alta' }],
      sueloDesnudoMeses: [], labranza: 'cero',
      acciones: ['Deshoje sanitario semanal', 'Franja de 15 m sin aplicación junto al río'],
      resultado: { ncAntes: 4, ncDespues: 1, laminaAntes: 1.3, laminaDespues: 1.1 },
    }),
  },
  {
    id: 'ej-h', origen: 'ejemplo', etiqueta: 'Finca H · plátano con goteo',
    finca: finca({
      nombre: 'Finca H (ejemplo)', depto: 'Atlántida', area: 10, areaProd: 8, altitud: 50, pendiente: 'ondulada',
      fuenteAgua: 'Quebrada', distAgua: 110, riego: 'goteo',
      cultivos: [{ nombre: 'Plátano', ha: 8, siembra: [], cosecha: [2, 3, 7, 8] }],
      especies: [esp('Guamo', 'Árbol', 'nativa', [2, 3], true), esp('Pasto', 'Maleza', 'exótica'), ...abejas],
      nAplicado: 300, nObjetivo: 280, fertMeses: [2, 6, 9], lluviaMeses: [6, 7, 9, 10],
      plaguicidas: [{ producto: 'Fungicida sistémico', clase: 'selectivo', meses: [7, 8] }],
      plagas: [{ nombre: 'Picudo negro', meses: [5, 6], severidad: 'media' }],
      sueloDesnudoMeses: [], labranza: 'minima',
      acciones: ['Trampas de feromona para picudo', 'Fertirriego en lugar de aplicación al voleo'],
      resultado: { ncAntes: 3, ncDespues: 1, laminaAntes: 1.2, laminaDespues: 1.05 },
    }),
  },
  {
    id: 'ej-i', origen: 'ejemplo', etiqueta: 'Finca I · caña de azúcar',
    finca: finca({
      nombre: 'Finca I (ejemplo)', depto: 'Valle', area: 60, areaProd: 52, altitud: 60, pendiente: 'plana',
      fuenteAgua: 'Pozo profundo', distAgua: 90, riego: 'gravedad',
      cultivos: [{ nombre: 'Caña de azúcar', ha: 52, siembra: [5], cosecha: [11, 0, 1, 2] }],
      especies: [spathodea, esp('Madreado', 'Árbol', 'nativa', [0, 1], true), abejas[1]],
      nAplicado: 210, nObjetivo: 160, fertMeses: [6, 7], lluviaMeses: [5, 6, 8, 9],
      plaguicidas: [{ producto: 'Herbicida', clase: 'amplio', meses: [1, 6] }],
      plagas: [{ nombre: 'Salivazo', meses: [6, 7], severidad: 'media' }],
      sueloDesnudoMeses: [3, 4], labranza: 'convencional',
      acciones: ['Riego por surco alterno', 'Retirar Spathodea de los bordes del lote'],
      resultado: { ncAntes: 6, ncDespues: 4, laminaAntes: 1.5, laminaDespues: 1.25 },
    }),
  },
];
