// De una cuadrícula de celdas (Excel o CSV) a los datos de riego, buscando por etiquetas.
// Tolerante a propósito: las etiquetas pueden estar en cualquier hoja y posición,
// con o sin tildes y con errores de escritura comunes. Guarda la celda de origen de cada dato.

import { normalizar } from './referencias.js';
import { riegoVacio } from './calculo.js';

// Campos simples: etiqueta → primer número (o texto) a su derecha en la misma fila.
const CAMPOS = [
  { clave: 'cultivo', nombre: 'Cultivo', tipo: 'texto', si: [/^nombre comun$/, /^cultivo$/, /^nombre del cultivo$/] },
  { clave: 'kcIni', nombre: 'Kc inicial', si: [/kc .*inicial/], no: /duracion/ },
  { clave: 'kcMed', nombre: 'Kc medio', si: [/kc .*(media|mediado|medio)/], no: /duracion/ },
  { clave: 'kcFin', nombre: 'Kc final', si: [/kc .*final/], no: /duracion/ },
  { clave: 'etapa0', nombre: 'Duración etapa inicial', si: [/duracion .*inicial/] },
  { clave: 'etapa1', nombre: 'Duración etapa de desarrollo', si: [/duracion .*desa?rr?oll?o/] },
  { clave: 'etapa2', nombre: 'Duración etapa media', si: [/duracion .*(media|mediado|medio)/] },
  { clave: 'etapa3', nombre: 'Duración etapa final', si: [/duracion .*final/] },
  { clave: 'p', nombre: 'Fracción p', si: [/agua facilmente aprovechable/, /fraccion (de agotamiento|p)\b/, /^p$/] },
  { clave: 'distPlantas', nombre: 'Distancia entre plantas', si: [/distancia entre plantas?/] },
  { clave: 'distSurcos', nombre: 'Distancia entre surcos', si: [/distancia entre surcos?/] },
  { clave: 'hileras', nombre: 'Hileras por cama', si: [/n(umero|°|o\.?) de hileras/, /cintas por cama/] },
  { clave: 'alturaPlanta', nombre: 'Altura de la planta', si: [/altura de la planta/] },
  { clave: 'profRaiz', nombre: 'Profundidad radicular', si: [/profundidad radicular/, /profundidad de raices/] },
  { clave: 'eficiencia', nombre: 'Eficiencia de riego', si: [/eficiencia (de riego|del sistema)/] },
  { clave: 'caudalEmisor', nombre: 'Caudal del emisor', si: [/(caudal|cuadal) del (emisor|gotero)/] },
  { clave: 'distEmisores', nombre: 'Distancia entre emisores', si: [/distancia entre (emisor|emisores|gotero|goteros)\b/] },
  { clave: 'distLaterales', nombre: 'Distancia entre laterales', si: [/distancia entre laterales/, /centro y centro de camas/] },
  { clave: 'eto', nombre: 'ETo de diseño', si: [/^eto\b.*mm/, /evapotranspiracion de referencia/] },
  { clave: 'areaLote', nombre: 'Área del lote', si: [/^area (del )?lote/, /^area total/] },
  { clave: 'horasLaborales', nombre: 'Horas laborales', si: [/horas (laborales|de trabajo|disponibles)/] },
  // Valores que el archivo trae ya calculados: se comparan contra el recálculo.
  { clave: 'etc', nombre: 'ETc declarada', declarado: true, si: [/^etc\b/] },
  { clave: 'pp', nombre: 'Precipitación horaria declarada', declarado: true, si: [/precipitacion (horaria|instantanea)/] },
  { clave: 'tiempoRiego', nombre: 'Tiempo de riego declarado', declarado: true, si: [/tiempo de riego por sector/] },
  { clave: 'caudalHa', nombre: 'Caudal por hectárea declarado', declarado: true, si: [/caudal ?\/ ?hectarea/, /caudal unitar/] },
  { clave: 'sectores', nombre: 'Sectores declarados', declarado: true, si: [/numero de sectores real/, /^sectores$/] },
  { clave: 'caudalSector', nombre: 'Caudal por sector declarado', declarado: true, si: [/caudal instantaneo/] },
];

// Campos de suelo: una columna por sección (Parte 1, Parte 2...).
const SUELO = [
  { clave: 'area', nombre: 'Suelo: área (ha)', si: [/^area( \(ha\))?$/] },
  { clave: 'textura', nombre: 'Suelo: textura', tipo: 'texto', si: [/^textura$/] },
  { clave: 'pedregosidad', nombre: 'Suelo: pedregosidad (%)', si: [/pedregosidad/] },
  { clave: 'da', nombre: 'Suelo: densidad aparente', si: [/densidad aparente/] },
  { clave: 'cc', nombre: 'Suelo: capacidad de campo (%W)', si: [/capacidad de campo/], no: /cm\/m/ },
  { clave: 'pmp', nombre: 'Suelo: punto de marchitez (%W)', si: [/punto de marchitez/], no: /cm\/m/ },
  { clave: 'infiltracion', nombre: 'Suelo: infiltración básica', si: [/infiltracion/] },
  { clave: 'laa', nombre: 'Lámina aprovechable declarada', declarado: true, si: [/lamina de agua aprovechable/, /^laa/] },
];

// Números fijos comunes en fórmulas agronómicas que no son sospechosos.
const CONSTANTES = new Set([0, 0.5, 1, 2, 3, 4, 5, 10, 12, 24, 60, 100, 1000, 10000]);

const coincide = (texto, def) => def.si.some((r) => r.test(texto)) && !(def.no && def.no.test(texto));

export function extraerRiego(libro) {
  const datos = riegoVacio();
  const declarados = {};
  const origen = {};

  // Índice de filas por hoja.
  const hojas = libro.hojas.map((h) => {
    const filas = new Map();
    for (const c of h.celdas) {
      if (!filas.has(c.fila)) filas.set(c.fila, []);
      filas.get(c.fila).push(c);
    }
    for (const f of filas.values()) f.sort((a, b) => a.col - b.col);
    return { nombre: h.nombre, celdas: h.celdas, filas };
  });

  const etiquetas = [];
  for (const h of hojas) for (const c of h.celdas) {
    if (typeof c.v === 'string' && c.v.trim()) etiquetas.push({ h, c, texto: normalizar(c.v).replace(/\s*:\s*$/, '') });
  }

  // Campos simples
  for (const def of CAMPOS) {
    for (const { h, c, texto } of etiquetas) {
      if (!coincide(texto, def)) continue;
      const derecha = (h.filas.get(c.fila) || []).filter((x) => x.col > c.col && x.col <= c.col + 4);
      const val = derecha.find((x) => (def.tipo === 'texto' ? typeof x.v === 'string' && x.v.trim() : typeof x.v === 'number'));
      if (!val) continue;
      const valor = def.tipo === 'texto' ? val.v.trim() : val.v;
      if (def.declarado) declarados[def.clave] = valor;
      else if (def.clave.startsWith('etapa')) datos.etapas[Number(def.clave.slice(5))] = valor;
      else datos[def.clave] = valor;
      origen[def.clave] = { nombre: def.nombre, valor, celda: `${h.nombre.trim()}!${val.ref}`, etiqueta: c.v.trim() };
      break;
    }
  }

  // Suelo: buscar una fila de encabezados con "Parte 1", "Sección A"...
  let secciones = null;
  for (const h of hojas) {
    for (const fila of h.filas.values()) {
      const cols = fila.filter((x) => typeof x.v === 'string' && /^(parte|seccion|lote|bloque|zona)\s*\w+$/.test(normalizar(x.v)));
      if (cols.length >= 1) { secciones = { h, cols }; break; }
    }
    if (secciones) break;
  }
  if (secciones) {
    const { h, cols } = secciones;
    datos.suelo = cols.map((x) => ({ nombre: x.v.trim(), area: null, textura: '', da: null, cc: null, pmp: null, pedregosidad: null, infiltracion: null }));
    declarados.laa = [];
    for (const def of SUELO) {
      for (const { h: hh, c, texto } of etiquetas) {
        if (hh !== h || !coincide(texto, def)) continue;
        const fila = h.filas.get(c.fila) || [];
        const valores = cols.map((col) => fila.find((x) => x.col === col.col));
        const validos = valores.filter((x) => x && (def.tipo === 'texto' ? typeof x.v === 'string' : typeof x.v === 'number'));
        if (!validos.length) continue;
        valores.forEach((x, i) => {
          if (!x) return;
          const ok = def.tipo === 'texto' ? typeof x.v === 'string' : typeof x.v === 'number';
          if (!ok) return;
          if (def.declarado) declarados[def.clave][i] = x.v;
          else datos.suelo[i][def.clave] = def.tipo === 'texto' ? x.v.trim() : x.v;
        });
        origen[`suelo.${def.clave}`] = { nombre: def.nombre, valor: validos.map((x) => x.v).join(' · '), celda: `${h.nombre.trim()}!fila ${c.fila}`, etiqueta: c.v.trim() };
        break;
      }
    }
  }

  // Números escritos a mano dentro de fórmulas.
  const entradas = { areaLote: 'el área del lote', eto: 'la ETo', caudalEmisor: 'el caudal del emisor', horasLaborales: 'las horas laborales', distPlantas: 'la distancia entre plantas', distSurcos: 'la distancia entre surcos' };
  declarados.numerosFijos = [];
  for (const h of hojas) for (const c of h.celdas) {
    if (!c.f || /^=\s*-?[\d.]+\s*$/.test(c.f)) continue; // una celda que solo contiene un número es un dato
    const limpia = c.f.replace(/'[^']*'!/g, ' ').replace(/"[^"]*"/g, ' ').replace(/\[[^\]]*\]/g, ' ').replace(/\$?[A-Z]{1,3}\$?\d+/g, ' ');
    for (const m of limpia.matchAll(/(?<![\w.])(\d+(?:\.\d+)?)(?![\w.])/g)) {
      const n = Number(m[1]);
      if (CONSTANTES.has(n)) continue;
      const igual = Object.entries(entradas).find(([k]) => typeof datos[k] === 'number' && Math.abs(datos[k] - n) <= 1e-6 * Math.max(1, Math.abs(n)));
      const largo = (m[1].split('.')[1] || '').length >= 3 && n >= 10;
      if (igual || largo) {
        declarados.numerosFijos.push({ celda: `${h.nombre.trim()}!${c.ref}`, formula: c.f, numero: m[1], coincide: igual ? igual[1] : (largo ? 'un valor sin origen visible' : null) });
      }
    }
  }

  const faltan = CAMPOS.filter((d) => !d.declarado && !origen[d.clave]).map((d) => d.nombre);
  return { datos, declarados, origen, faltan };
}
