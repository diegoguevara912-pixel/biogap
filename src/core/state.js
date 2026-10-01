// Estado de la app: finca de ejemplo, finca vacía y borradores de formularios.

export function demoFarm() {
  return {
    nombre: 'Finca demostrativa', depto: 'Francisco Morazán', area: 45, areaProd: 28, altitud: 800, pendiente: 'ondulada',
    fuenteAgua: 'Quebrada', distAgua: 60, tieneCultivos: true,
    cultivos: [
      { nombre: 'Melón', ha: 20, siembra: [0, 1], cosecha: [2, 3] },
      { nombre: 'Maíz', ha: 8, siembra: [4, 5], cosecha: [8, 9] },
    ],
    especies: [
      { nombre: 'Spathodea campanulata', tipo: 'Árbol', origen: 'exótica', floracion: [0, 1, 2, 3], atrae: true, riesgo: true },
      { nombre: 'Gliricidia sepium', tipo: 'Árbol', origen: 'nativa', floracion: [0, 1, 2], atrae: true, riesgo: false },
      { nombre: 'Trigona fulviventris', tipo: 'Fauna', origen: 'nativa', floracion: [], atrae: false, riesgo: false },
      { nombre: 'Plebeia melanica', tipo: 'Fauna', origen: 'nativa', floracion: [], atrae: false, riesgo: false },
      { nombre: 'Melón', tipo: 'Cultivo', origen: 'exótica', floracion: [1, 2], atrae: true, riesgo: false },
    ],
    riego: 'gravedad', nAplicado: 180, nObjetivo: 150, fertMeses: [0, 1, 5, 6], lluviaMeses: [5, 6, 8, 9],
    plaguicidas: [
      { producto: 'Insecticida de amplio espectro', clase: 'amplio', meses: [1, 2] },
      { producto: 'Fungicida selectivo', clase: 'selectivo', meses: [6, 7] },
    ],
    sueloDesnudoMeses: [3, 4, 5], labranza: 'convencional',
    plagas: [{ nombre: 'Mosca blanca', meses: [1, 2, 3], severidad: 'alta' }],
    gg: 'si', minorAplicables: 60, minorFallas: 1,
    nc: [{ criterio: 'Registro de aplicaciones incompleto', dias: 9 }],
  };
}

export function emptyFarm() {
  return {
    nombre: '', depto: '', area: 0, areaProd: 0, altitud: 0, pendiente: 'plana', fuenteAgua: '', distAgua: 500, tieneCultivos: false,
    cultivos: [], especies: [], riego: 'ninguno', nAplicado: 0, nObjetivo: 0, fertMeses: [], lluviaMeses: [], plaguicidas: [], sueloDesnudoMeses: [],
    labranza: 'cero', plagas: [], gg: 'no', minorAplicables: 60, minorFallas: 0, nc: [],
  };
}

export const blankDrafts = () => ({
  draftEsp: { nombre: '', tipo: 'Árbol', origen: 'nativa', floracion: [], atrae: false, riesgo: false },
  draftPlag: { producto: '', clase: 'amplio', meses: [] },
  draftPlaga: { nombre: '', meses: [], severidad: 'media' },
  draftCult: { nombre: '', ha: 0, siembra: [], cosecha: [] },
  draftNC: { criterio: '', dias: 0 },
});

// Tipos de plantilla de registro.
export const TPL = {
  fert: { nombre: 'Fertilización', unidad: 'kg N/ha', acum: true, obj: 'Dosis máxima anual' },
  riego: { nombre: 'Riego', unidad: 'm³/semana', acum: false, obj: 'Volumen máximo por registro' },
  mec: { nombre: 'Mecanización', unidad: 'horas de tractor', acum: true, obj: 'Horas máximas anuales' },
  custom: { nombre: 'Personalizada', unidad: 'unidades', acum: false, obj: 'Valor objetivo' },
};

// Estado global único de la app.
export const S = {
  farm: demoFarm(), demo: true, view: 'dashboard', step: 0,
  ...blankDrafts(),
  tpl: {
    tipo: 'fert', objetivo: 150, paste: '',
    rows: [
      { fecha: '2026-01-10', lote: 'Lote 1', valor: 40 },
      { fecha: '2026-02-05', lote: 'Lote 1', valor: 45 },
      { fecha: '2026-06-02', lote: 'Lote 2', valor: 50 },
      { fecha: '2026-07-01', lote: 'Lote 2', valor: 45 },
    ],
  },
};
