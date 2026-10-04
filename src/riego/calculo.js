// Cálculo del diseño agronómico de riego por goteo. Funciones puras: dato → resultado.
// Fórmulas documentadas en docs/catalogo-riego.md.

import { buscarCultivo, buscarTextura } from './referencias.js';

// Datos de entrada vacíos. null = el usuario no lo dio (se usa la referencia si existe).
export function riegoVacio() {
  return {
    cultivo: '', kcIni: null, kcMed: null, kcFin: null, etapas: [null, null, null, null],
    p: null, profRaiz: null, alturaPlanta: null,
    distPlantas: null, distSurcos: null, hileras: 1,
    caudalEmisor: null, distEmisores: null, distLaterales: null, eficiencia: null,
    eto: null, areaLote: null, horasLaborales: null, frecuenciaDias: 1,
    suelo: [],
  };
}

// Caso de ejemplo: diseño agronómico del Lab de Riego, Zamorano (Anner Almendárez, 2025),
// publicado con autorización del autor. Valores tal como están en la hoja original.
export function casoEjemplo() {
  return {
    cultivo: 'Maíz', kcIni: 0.35, kcMed: 1.2, kcFin: 0.35, etapas: [20, 35, 40, 30],
    p: 0.55, profRaiz: 0.6, alturaPlanta: 250,
    distPlantas: 0.3, distSurcos: 0.8, hileras: 1,
    caudalEmisor: 1.2, distEmisores: 0.3, distLaterales: 0.8, eficiencia: 0.9,
    eto: 6.84, areaLote: 12.43, horasLaborales: 11, frecuenciaDias: 1,
    suelo: [
      { nombre: 'Parte 1', area: 4.989, textura: 'Far', da: 1.35, cc: 27, pmp: 13, pedregosidad: 4, infiltracion: 7 },
      { nombre: 'Parte 2', area: 4.88, textura: 'F', da: 1.42, cc: 22, pmp: 10, pedregosidad: 30, infiltracion: 10 },
      { nombre: 'Parte 3', area: 2.566, textura: 'FA', da: 1.5, cc: 14, pmp: 6, pedregosidad: 25, infiltracion: 20 },
    ],
  };
}

// Lo que la hoja de ejemplo trae ya calculado, para que el validador lo compare (ver docs/catalogo-riego.md).
export function declaradosEjemplo() {
  return {
    laa: [99.792, 65.604, 49.5],
    numerosFijos: [
      { celda: 'Diseño Agronomico!E24', formula: '=12.43/E23', numero: '12.43', coincide: 'el área del lote' },
      { celda: 'Diseño Agronomico!E26', formula: '=4896.45136111111*12', numero: '4896.45136111111', coincide: 'un valor sin origen visible' },
    ],
  };
}

const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const pos = (x) => (num(x) !== null && x > 0 ? x : null);

// Completa los datos que faltan con valores de referencia y anota cuáles se completaron.
export function completar(d) {
  const ref = buscarCultivo(d.cultivo);
  const usados = [];
  const tomar = (campo, valor, refValor, etiqueta) => {
    if (num(valor) !== null) return valor;
    if (refValor !== undefined && refValor !== null) { usados.push(etiqueta); return refValor; }
    return null;
  };
  const r = { ...d };
  r.kcIni = tomar('kcIni', d.kcIni, ref?.kc.ini.valor, 'Kc inicial');
  r.kcMed = tomar('kcMed', d.kcMed, ref?.kc.med.valor, 'Kc medio');
  r.kcFin = tomar('kcFin', d.kcFin, ref?.kc.fin.valor, 'Kc final');
  r.p = tomar('p', d.p, ref?.p.valor, 'Fracción p');
  r.etapas = (d.etapas || []).map((x, i) => tomar('etapa', x, ref?.etapas.valor[i], `Etapa ${i + 1}`));
  r.distEmisores = num(d.distEmisores) ?? num(d.distPlantas);
  r.distLaterales = num(d.distLaterales) ?? num(d.distSurcos);
  r.hileras = pos(d.hileras) ?? 1;
  r.frecuenciaDias = pos(d.frecuenciaDias) ?? 1;
  r.suelo = (d.suelo || []).map((s) => {
    const t = buscarTextura(s.textura);
    const out = { ...s };
    for (const k of ['da', 'cc', 'pmp', 'infiltracion']) {
      if (num(s[k]) === null && t && t[k] !== null) { out[k] = t[k]; usados.push(`${k.toUpperCase()} de ${s.nombre || 'suelo'} (textura ${t.codigo})`); }
    }
    out.pedregosidad = num(s.pedregosidad) ?? 0;
    return out;
  });
  return { datos: r, referencia: ref, usados };
}

// Ajuste de p por ETc (FAO-56, Tabla 22): p = p_tabla + 0.04 (5 − ETc), entre 0.1 y 0.8.
export const pAjustada = (p, etc) => Math.min(0.8, Math.max(0.1, p + 0.04 * (5 - etc)));

export function calcular(entrada) {
  const { datos: d, referencia, usados } = completar(entrada);
  const r = { referencia, usados, datos: d };

  const kcMax = Math.max(...[d.kcIni, d.kcMed, d.kcFin].filter((x) => num(x) !== null));
  r.kcDesarrollo = num(d.kcIni) !== null && num(d.kcMed) !== null ? (d.kcIni + d.kcMed) / 2 : null;
  r.cicloDias = d.etapas.every((x) => num(x) !== null) ? d.etapas.reduce((a, b) => a + b, 0) : null;
  r.etc = num(d.eto) !== null && Number.isFinite(kcMax) ? d.eto * kcMax : null;

  if (pos(d.distPlantas) && pos(d.distSurcos)) r.densidadSiembra = (10000 / (d.distPlantas * d.distSurcos)) * d.hileras;

  // Marco por emisor: el área que moja cada gotero.
  if (pos(d.distLaterales) && pos(d.distEmisores)) {
    r.marco = (d.distLaterales * d.distEmisores) / d.hileras;
    r.densidadEmisores = 10000 / r.marco; // las hileras ya están dentro del marco
  }
  if (r.marco && pos(d.caudalEmisor)) {
    r.pp = d.caudalEmisor / r.marco; // mm/h
    r.caudalHa = (r.densidadEmisores * d.caudalEmisor) / 1000; // m³/h/ha
  }
  if (r.etc !== null && r.pp && pos(d.eficiencia)) r.tiempoRiego = r.etc / (r.pp * d.eficiencia);
  if (r.tiempoRiego && pos(d.horasLaborales)) {
    r.sectoresTeoricos = d.horasLaborales / r.tiempoRiego;
    r.sectores = Math.max(1, Math.floor(r.sectoresTeoricos));
    r.horasUsadas = r.sectores * r.tiempoRiego;
  }
  if (r.sectores && pos(d.areaLote)) {
    r.areaSector = d.areaLote / r.sectores;
    if (r.caudalHa) r.caudalSector = r.caudalHa * r.areaSector;
  }
  if (r.etc !== null && pos(d.areaLote)) {
    r.volumenPicoNeto = r.etc * 10 * d.areaLote; // m³/día
    if (pos(d.eficiencia)) r.volumenPicoBruto = r.volumenPicoNeto / d.eficiencia;
  }

  // Suelo, por sección. Todas las láminas en la zona radicular (× profundidad).
  r.pAjustada = r.etc !== null && num(d.p) !== null ? pAjustada(d.p, r.etc) : null;
  r.suelo = d.suelo.map((s) => {
    const o = { nombre: s.nombre, area: s.area, infiltracion: s.infiltracion };
    if (num(s.cc) !== null && num(s.pmp) !== null && pos(s.da)) {
      o.disponibleCmM = (s.cc - s.pmp) * s.da; // cm de agua por m de suelo
      const piedra = 1 - s.pedregosidad / 100;
      if (pos(d.profRaiz)) {
        o.lad = o.disponibleCmM * 10 * d.profRaiz; // mm en la zona radicular
        if (num(d.p) !== null) o.laaSinAjuste = o.disponibleCmM * d.p * piedra * 10 * d.profRaiz;
        if (r.pAjustada !== null) o.laa = o.disponibleCmM * r.pAjustada * piedra * 10 * d.profRaiz;
      }
      if (num(d.p) !== null) o.laaPorMetro = o.disponibleCmM * d.p * piedra * 10; // como lo calcula la hoja original
    }
    return o;
  });
  const laas = r.suelo.map((s) => s.laa).filter((x) => num(x) !== null);
  if (laas.length && r.etc) {
    r.laaLimitante = Math.min(...laas);
    r.seccionLimitante = r.suelo.find((s) => s.laa === r.laaLimitante)?.nombre;
    r.intervaloMax = Math.floor(r.laaLimitante / r.etc);
  }
  const infil = r.suelo.map((s) => s.infiltracion).filter((x) => pos(x));
  if (infil.length) r.infiltracionMin = Math.min(...infil);
  return r;
}
