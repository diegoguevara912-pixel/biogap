// Valores de referencia con fuente. Es el "criterio propio" de la app:
// cada regla compara los datos del usuario contra lo que está aquí.
// Para sumar un cultivo, agrega una entrada a CULTIVOS con su fuente.
// En kc, `valor` es el de FAO-56; `min` y `max` son la tolerancia que aplica la app
// alrededor de ese valor (criterio propio, por calibrar con casos reales).

export const FUENTES = {
  fao56_t11: { cita: 'FAO-56, Tabla 11 (duración de etapas)', url: 'https://www.fao.org/4/x0490e/x0490e0b.htm' },
  fao56_t12: { cita: 'FAO-56, Tabla 12 (Kc)', url: 'https://www.fao.org/4/x0490e/x0490e0b.htm' },
  fao56_t22: { cita: 'FAO-56, Tabla 22 (profundidad radicular y fracción p)', url: 'https://www.fao.org/4/x0490e/x0490e0e.htm' },
  cimmyt2012: { cita: 'CIMMYT (2012), tabla de propiedades por textura usada en el Lab de Riego, Zamorano', url: '' },
  referencia: { cita: 'Valor de referencia común en diseño de riego (fuente por citar)', url: '' },
};

export const CULTIVOS = {
  maiz: {
    nombre: 'Maíz (grano)',
    sinonimos: ['maiz', 'zea mays', 'zea mayz', 'corn'],
    kc: {
      ini: { valor: 0.3, min: 0.15, max: 0.5, fuente: 'fao56_t12', nota: 'FAO-56 ajusta el Kc inicial según la frecuencia de riego' },
      med: { valor: 1.2, min: 1.05, max: 1.3, fuente: 'fao56_t12' },
      fin: { valor: 0.35, min: 0.35, max: 0.6, fuente: 'fao56_t12', nota: '0.60 si se cosecha húmedo; 0.35 si el grano se seca en campo' },
    },
    etapas: { valor: [20, 35, 40, 30], totalMin: 125, totalMax: 180, fuente: 'fao56_t11' },
    p: { valor: 0.55, fuente: 'fao56_t22' },
    raiz: { min: 1.0, max: 1.7, fuente: 'fao56_t22' },
    alturaMax: { valor: 2, fuente: 'fao56_t12' },
  },
};

// Propiedades típicas por textura (tabla de la hoja del Lab de Riego, citada como CIMMYT 2012).
// cc y pmp en % en peso; da en g/cm³; infiltración básica en mm/h.
export const TEXTURAS = {
  A: { nombre: 'Arenoso', da: 1.65, cc: 9, pmp: 4, infiltracion: 30 },
  FA: { nombre: 'Franco arenoso', da: 1.5, cc: 14, pmp: 6, infiltracion: 20 },
  F: { nombre: 'Franco', da: 1.42, cc: 22, pmp: 10, infiltracion: 10 },
  FAR: { nombre: 'Franco arcilloso', da: 1.35, cc: 27, pmp: 13, infiltracion: 7 },
  ARA: { nombre: 'Arcillo arenoso', da: 1.3, cc: 31, pmp: 15, infiltracion: null },
  AR: { nombre: 'Arcilloso', da: 1.25, cc: 35, pmp: 17, infiltracion: 1 },
};

export const EFICIENCIA_GOTEO = { min: 0.85, max: 0.95, fuente: 'referencia' };

export function buscarCultivo(nombre) {
  const n = normalizar(nombre);
  if (!n) return null;
  for (const [id, c] of Object.entries(CULTIVOS)) {
    if (c.sinonimos.some((s) => n.includes(s))) return { id, ...c };
  }
  return null;
}

export function buscarTextura(t) {
  const k = normalizar(t).replace(/[^a-z]/g, '').toUpperCase();
  return TEXTURAS[k] ? { codigo: k, ...TEXTURAS[k] } : null;
}

export const normalizar = (s) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
