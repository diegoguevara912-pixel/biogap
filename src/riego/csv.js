// Lector de CSV a la misma cuadrícula de celdas que el lector de Excel.
// Detecta el separador (coma, punto y coma o tabulación) y acepta coma decimal.

const LETRAS = (n) => { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };

export function leerCsv(texto, nombre = 'CSV') {
  const lineas = texto.replace(/^﻿/, '').split(/\r?\n/);
  const primera = lineas.find((l) => l.trim()) || '';
  const sep = [';', '\t', ','].map((s) => [s, primera.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const celdas = [];
  lineas.slice(0, 20000).forEach((linea, i) => {
    partir(linea, sep).forEach((crudo, j) => {
      const t = crudo.trim();
      if (!t) return;
      // Con separador ; o tabulación, una coma indica decimal (y entonces el punto es de miles).
      const comoNumero = sep !== ',' && t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
      const x = Number(comoNumero);
      celdas.push({ ref: `${LETRAS(j + 1)}${i + 1}`, fila: i + 1, col: j + 1, v: comoNumero !== '' && Number.isFinite(x) ? x : t, f: null });
    });
  });
  return { hojas: [{ nombre, celdas }] };
}

function partir(linea, sep) {
  const out = []; let actual = ''; let comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i];
    if (ch === '"') { if (comillas && linea[i + 1] === '"') { actual += '"'; i++; } else comillas = !comillas; }
    else if (ch === sep && !comillas) { out.push(actual); actual = ''; }
    else actual += ch;
  }
  out.push(actual);
  return out;
}
