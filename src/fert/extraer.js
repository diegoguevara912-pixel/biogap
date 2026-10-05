// De una hoja (Excel o CSV) al plan de fertilización. Busca una fila de encabezados con al menos
// "producto" y "dosis", y lee las filas de abajo. Tolerante a tildes, mayúsculas y nombres comunes.
// Lo que no entiende no lo inventa: lo reporta con su fila para que el usuario lo corrija.

import { normalizar } from '../riego/referencias.js';
import { PRODUCTOS, UNIDADES } from './catalogo.js';

const COLS = {
  mes: [/^mes$/, /^fecha/, /^mes de aplicacion/],
  producto: [/^producto/, /^fertilizante/, /^nombre/, /^fuente/],
  dosis: [/^dosis/, /^cantidad/],
  unidad: [/^unidad/],
  metodo: [/^metodo/, /^forma/, /^aplicacion$/, /^tipo de aplicacion/],
  grado: [/^formula/, /^grado/],
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ALIAS = [
  ['urea', /\burea\b/], ['nitrato-amonio', /nitrato de amonio/], ['sulfato-amonio', /sulfato de amonio|sulfamonio/],
  ['dap', /\bdap\b|fosfato diamonico/], ['map', /\bmap\b|fosfato monoamonico/],
  ['kcl', /\bkcl\b|cloruro de potasio|muriato/], ['sulfato-potasio', /sulfato de potasio/], ['nitrato-potasio', /nitrato de potasio/],
];

// Unidad a partir de un texto ("kg/ha", "qq/mz", "lb/acre"...). null si no se reconoce.
export function unidadDe(t) {
  const s = normalizar(String(t ?? '')).replace(/\s/g, '');
  if (/qq\/?mz|quintales?\/?(por)?manzana/.test(s)) return 'qqmz';
  if (/qq\/?ha|quintales?\/?(por)?hectarea/.test(s)) return 'qqha';
  if (/kg\/?mz|kilos?\/?(por)?manzana/.test(s)) return 'kgmz';
  if (/lb\/?ac/.test(s)) return 'lbacre';
  if (/kg\/?ha|kilos?\/?(por)?hectarea/.test(s)) return 'kgha';
  return null;
}

// Mes (0-11) desde un nombre, un número 1-12, una fecha de texto o una fecha de Excel (número de serie).
export function mesDe(v) {
  if (typeof v === 'number') {
    if (Number.isInteger(v) && v >= 1 && v <= 12) return v - 1;
    if (v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * 864e5).getUTCMonth();
    return null;
  }
  const s = normalizar(String(v ?? ''));
  const iso = s.match(/^(\d{4})-(\d{1,2})-\d{1,2}/);
  if (iso) return Number(iso[2]) - 1;
  const dmy = s.match(/^\d{1,2}[/.-](\d{1,2})[/.-]\d{2,4}$/);
  if (dmy) return Number(dmy[1]) - 1;
  const i = MESES.findIndex((m) => s.startsWith(m));
  return i >= 0 ? i : null;
}

// Producto del catálogo, o 'otro' con el grado escrito (p. ej. "18-5-15"). null si no se reconoce.
export function productoDe(nombre, gradoTxt) {
  const s = normalizar(String(nombre ?? ''));
  const g = `${gradoTxt ?? ''} ${s}`.match(/(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)/);
  if (g) {
    const [n, p, k] = g.slice(1).map((x) => Number(x.replace(',', '.')));
    const igual = PRODUCTOS.find((x) => x.id !== 'otro' && x.n === n && x.p === p && x.k === k);
    return igual ? { ...igual } : { id: 'otro', n, p, k };
  }
  const a = ALIAS.find(([, re]) => re.test(s));
  return a ? { ...PRODUCTOS.find((x) => x.id === a[0]) } : null;
}

export function metodoDe(t) {
  const s = normalizar(String(t ?? ''));
  if (/fertirr|goteo|inyect/.test(s)) return 'fertirriego';
  if (/foliar|asperj/.test(s)) return 'foliar';
  if (/incorpor|enterr|banda|tapad|surco/.test(s)) return 'incorporado';
  if (/voleo|superfici|boleo/.test(s)) return 'voleo';
  return null;
}

export function extraerFert(libro) {
  for (const hoja of libro.hojas) {
    const filas = new Map();
    for (const c of hoja.celdas) { if (!filas.has(c.fila)) filas.set(c.fila, new Map()); filas.get(c.fila).set(c.col, c.v); }
    const orden = [...filas.keys()].sort((a, b) => a - b);
    for (const fh of orden) {
      const col = {};
      for (const [cc, v] of filas.get(fh)) {
        const t = normalizar(String(v ?? ''));
        for (const [k, res] of Object.entries(COLS)) if (!col[k] && res.some((re) => re.test(t))) col[k] = { cc, texto: String(v) };
      }
      if (!col.producto || !col.dosis) continue;
      // Encabezado encontrado: unidad del encabezado de dosis, si la trae.
      const unidadCol = unidadDe(col.dosis.texto);
      const plan = [], omitidas = [], avisos = new Set();
      for (const fr of orden.filter((x) => x > fh)) {
        const fila = filas.get(fr);
        const val = (k) => (col[k] ? fila.get(col[k].cc) : undefined);
        if (val('producto') == null && val('dosis') == null) continue;
        const prod = productoDe(val('producto'), val('grado'));
        const dosis = typeof val('dosis') === 'number' ? val('dosis') : Number(String(val('dosis') ?? '').replace(',', '.'));
        const mes = mesDe(val('mes'));
        if (!prod) { omitidas.push({ fila: fr, motivo: `Producto no reconocido: "${val('producto') ?? ''}". Escribe su fórmula (p. ej. 15-15-15).` }); continue; }
        if (!(dosis > 0)) { omitidas.push({ fila: fr, motivo: 'Dosis vacía o no numérica.' }); continue; }
        if (mes == null) { omitidas.push({ fila: fr, motivo: `Mes no reconocido: "${val('mes') ?? ''}".` }); continue; }
        let u = unidadDe(val('unidad')) ?? unidadCol;
        if (!u) { u = 'kgha'; avisos.add('Sin unidad de dosis: se asumió kg/ha.'); }
        let metodo = metodoDe(val('metodo'));
        if (!metodo) { metodo = 'voleo'; avisos.add('Sin método de aplicación en alguna fila: se asumió al voleo (el caso más desfavorable). Corrígelo si no es así.'); }
        plan.push({ mes, producto: prod.id, n: prod.n, p: prod.p, k: prod.k, dosis: dosis * UNIDADES[u].aKgHa, metodo });
      }
      return { plan: plan.sort((a, b) => a.mes - b.mes), omitidas, avisos: [...avisos], hoja: hoja.nombre };
    }
  }
  return { plan: [], omitidas: [], avisos: [], hoja: null };
}

// Plantilla vacía para descargar (CSV con punto y coma, abre bien en Excel en español).
export const PLANTILLA_CSV = [
  'Mes;Producto;Dosis;Unidad;Método',
  'Enero;15-15-15;4.5;qq/mz;Incorporado',
  'Febrero;Urea;1.5;qq/mz;Al voleo',
  'Junio;Sulfato de amonio;2;qq/mz;Incorporado',
].join('\r\n');
