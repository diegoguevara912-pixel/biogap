// Lector mínimo de .xlsx sin dependencias. Un .xlsx es un zip de XML:
// se descomprime con DecompressionStream (nativo del navegador y de Node 18+)
// y se leen solo las hojas: valores, fórmulas y textos. Imágenes y gráficos se ignoran.

const LIMITE_ENTRADA = 60 * 1024 * 1024; // máximo descomprimido por archivo XML interno
const LIMITE_CELDAS = 300000; // por hoja

export class ErrorLectura extends Error {}

function leerZip(buf) {
  const dv = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new ErrorLectura('El archivo no es un Excel (.xlsx) válido.');
  const total = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  if (p === 0xffffffff || total === 0xffff) throw new ErrorLectura('El Excel es demasiado grande para leerlo aquí (formato zip64).');
  const dec = new TextDecoder();
  const entradas = new Map();
  for (let i = 0; i < total; i++) {
    if (p + 46 > buf.byteLength || dv.getUint32(p, true) !== 0x02014b50) throw new ErrorLectura('El Excel está dañado.');
    const metodo = dv.getUint16(p + 10, true);
    const comp = dv.getUint32(p + 20, true);
    const tam = dv.getUint32(p + 24, true);
    const nLen = dv.getUint16(p + 28, true), eLen = dv.getUint16(p + 30, true), cLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const nombre = dec.decode(new Uint8Array(buf, p + 46, nLen));
    entradas.set(nombre, { metodo, comp, tam, local });
    p += 46 + nLen + eLen + cLen;
  }
  return entradas;
}

async function extraer(buf, e) {
  if (e.tam > LIMITE_ENTRADA) throw new ErrorLectura('La hoja es demasiado grande para leerla aquí.');
  const dv = new DataView(buf);
  if (dv.getUint32(e.local, true) !== 0x04034b50) throw new ErrorLectura('El Excel está dañado.');
  const ini = e.local + 30 + dv.getUint16(e.local + 26, true) + dv.getUint16(e.local + 28, true);
  if (ini + e.comp > buf.byteLength) throw new ErrorLectura('El Excel está incompleto.');
  const datos = new Uint8Array(buf, ini, e.comp);
  if (e.metodo === 0) return new TextDecoder().decode(datos);
  if (e.metodo !== 8) throw new ErrorLectura('El Excel usa una compresión que no se puede leer.');
  // Se descomprime por partes, cortando si supera el límite (protege contra archivos que se inflan sin medida).
  const lector = new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const partes = []; let n = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    n += value.length;
    if (n > LIMITE_ENTRADA) { await lector.cancel(); throw new ErrorLectura('La hoja es demasiado grande para leerla aquí.'); }
    partes.push(value);
  }
  const todo = new Uint8Array(n); let o = 0;
  for (const p of partes) { todo.set(p, o); o += p.length; }
  return new TextDecoder().decode(todo);
}

const desescapar = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const atributo = (attrs, nombre) => { const m = attrs.match(new RegExp(`(?:^|\\s)${nombre}="([^"]*)"`)); return m ? desescapar(m[1]) : null; };
const textoDe = (xml) => desescapar([...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(''));

export function columnaANumero(letras) { let n = 0; for (const ch of letras) n = n * 26 + (ch.charCodeAt(0) - 64); return n; }

// Devuelve { hojas: [{ nombre, celdas: [{ ref, fila, col, v, f }] }], omitidas: [{ nombre, motivo }] }
// Una hoja demasiado grande se omite y se informa: nunca se trunca en silencio.
export async function leerXlsx(buf) {
  const zip = leerZip(buf);
  const leer = async (ruta) => (zip.has(ruta) ? extraer(buf, zip.get(ruta)) : null);
  const libro = await leer('xl/workbook.xml');
  if (!libro) throw new ErrorLectura('El archivo no tiene hojas de Excel.');
  const rels = (await leer('xl/_rels/workbook.xml.rels')) || '';
  const destino = new Map([...rels.matchAll(/<Relationship\b([^>]*)\/?>/g)].map((m) => [atributo(m[1], 'Id'), atributo(m[1], 'Target')]));
  const ssXml = await leer('xl/sharedStrings.xml');
  const compartidos = ssXml ? [...ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textoDe(m[1])) : [];

  const hojas = [];
  const omitidas = [];
  for (const m of libro.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const nombre = atributo(m[1], 'name');
    let t = destino.get(atributo(m[1], 'r:id'));
    if (!t) continue;
    t = t.startsWith('/') ? t.slice(1) : `xl/${t}`;
    let xml;
    try { xml = await leer(t); } catch (err) {
      if (err instanceof ErrorLectura) { omitidas.push({ nombre, motivo: err.message }); continue; }
      throw err;
    }
    if (!xml) continue;
    const celdas = [];
    let demasiadas = false;
    for (const c of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      if (celdas.length >= LIMITE_CELDAS) { demasiadas = true; break; }
      const ref = atributo(c[1], 'r');
      const tipo = atributo(c[1], 't');
      const dentro = c[2] || '';
      const mv = dentro.match(/<v>([\s\S]*?)<\/v>/);
      const mf = dentro.match(/<f(?:\s[^>]*)?>([\s\S]*?)<\/f>/);
      let v = null;
      if (tipo === 's' && mv) v = compartidos[Number(mv[1])] ?? null;
      else if (tipo === 'inlineStr') v = textoDe(dentro);
      else if (tipo === 'str' || tipo === 'e') v = mv ? desescapar(mv[1]) : null;
      else if (tipo === 'b') v = mv ? mv[1] === '1' : null;
      else if (mv) { const x = Number(mv[1]); v = Number.isFinite(x) ? Number(x.toPrecision(12)) : null; } // quita el ruido de coma flotante (6.8399999… → 6.84)
      if (!ref || (v === null && !mf)) continue;
      const pr = ref.match(/^([A-Z]+)(\d+)$/);
      if (!pr) continue;
      celdas.push({ ref, col: columnaANumero(pr[1]), fila: Number(pr[2]), v, f: mf ? '=' + desescapar(mf[1]) : null });
    }
    if (demasiadas) { omitidas.push({ nombre, motivo: `Tiene más de ${LIMITE_CELDAS.toLocaleString('es-HN')} celdas.` }); continue; }
    hojas.push({ nombre, celdas });
  }
  if (!hojas.length && omitidas.length) throw new ErrorLectura('Todas las hojas del Excel son demasiado grandes para analizarlas aquí.');
  return { hojas, omitidas };
}
