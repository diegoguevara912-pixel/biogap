// Vista: Riego por goteo. Calculadora + validador sobre las mismas fórmulas.
// Flujo: cargar archivo (o escribir datos) → revisar datos detectados → leer alertas.
import { esc } from '../core/utils.js';
import { S } from '../core/state.js';
import { calcular } from '../riego/calculo.js';
import { validar } from '../riego/reglas.js';

const NIVEL = { error: 'Error', advertencia: 'Revisar', criterio: 'Criterio', ok: 'Bien' };
const fmt = (x, d = 1) => (typeof x === 'number' && Number.isFinite(x) ? x.toLocaleString('es-HN', { maximumFractionDigits: d }) : '—');

function campo(id, label, path, valor, unidad, origen, ref) {
  const hint = [unidad, origen ? `de ${origen.celda}` : '', valor === null && ref !== undefined && ref !== null ? `vacío: se usa ${ref}` : ''].filter(Boolean).join(' · ');
  return `<div class="f"><label for="${id}">${label}</label><input id="${id}" type="number" step="any" inputmode="decimal" data-bind="${path}" data-nullable data-rerender value="${valor ?? ''}" placeholder="${ref ?? ''}">${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</div>`;
}

export function viewRiego() {
  const R = S.riego;
  const d = R.datos;
  const r = calcular(d);
  const alertas = validar(r, R.declarados || {});
  const o = R.origen || {};
  const ref = r.referencia;
  const cuenta = (n) => alertas.filter((a) => a.nivel === n).length;

  const aviso = R.fuente === 'ejemplo'
    ? `<b>Caso real de ejemplo.</b> Diseño agronómico de maíz del Lab de Riego, Zamorano (Anner Almendárez, 2025), publicado con autorización del autor.`
    : R.fuente === 'archivo'
      ? `<b>Datos leídos de ${esc(R.archivo)}.</b> Revisa abajo qué se detectó y de qué celda salió; corrige lo que haga falta.`
      : `<b>Datos ingresados a mano.</b> Los campos vacíos usan valores de referencia cuando existen.`;

  return `
  ${S.msg ? `<div class="notice" role="status"><span>${esc(S.msg)}</span></div>` : ''}
  <section class="panel">
    <div class="row" style="justify-content:space-between">
      <div><p class="label">Riego por goteo</p><h1>${esc(d.cultivo || 'Diseño sin cultivo')}${d.areaLote ? ` · ${fmt(d.areaLote, 2)} ha` : ''}</h1>
      <p class="muted">Sube tu Excel o CSV, o escribe tus datos. La app recalcula el diseño y revisa cada valor contra referencias con fuente.</p></div>
      <div class="row">
        <button class="btn primary" data-act="riego-import">Cargar Excel o CSV</button>
        <button class="btn" data-act="riego-ejemplo">Caso de ejemplo</button>
        <button class="btn" data-act="riego-blanco">En blanco</button>
      </div>
    </div>
    <div class="notice"><span>${aviso}</span></div>
    <div class="summary">
      <div><div class="k">ETc pico</div><div class="v">${fmt(r.etc, 2)} mm/día</div></div>
      <div><div class="k">Riego por sector</div><div class="v">${fmt(r.tiempoRiego, 2)} h</div></div>
      <div><div class="k">Sectores</div><div class="v">${fmt(r.sectores, 0)}</div></div>
      <div><div class="k">Caudal por sector</div><div class="v">${fmt(r.caudalSector)} m³/h</div></div>
      <div><div class="k">Máximo sin regar</div><div class="v">${r.intervaloMax !== undefined ? `${r.intervaloMax} día(s)` : '—'}</div></div>
    </div>
  </section>

  <div class="grid2">
    <section class="panel">
      <div><h2>Alertas</h2><p class="muted">${cuenta('error')} errores · ${cuenta('advertencia')} por revisar · ${cuenta('criterio')} criterios · ${cuenta('ok')} bien</p></div>
      <ul class="alertas">${alertas.map((a) => `<li class="alerta ${a.nivel}">
        <div class="row" style="gap:8px"><span class="pill ${a.nivel}">${NIVEL[a.nivel]}</span><b>${esc(a.titulo)}</b></div>
        <p>${esc(a.detalle)}</p>
        ${a.fuente ? `<p class="muted" style="font-size:12.5px">Fuente: ${a.fuente.url ? `<a href="${esc(a.fuente.url)}" target="_blank" rel="noopener">${esc(a.fuente.cita)}</a>` : esc(a.fuente.cita)}</p>` : ''}
      </li>`).join('') || '<li class="muted">Ingresa datos para ver alertas.</li>'}</ul>
    </section>

    <section class="panel">
      <h2>Datos del diseño</h2>
      <h3>Cultivo</h3>
      <div class="fields">
        <div class="f"><label for="rg-cultivo">Cultivo</label><input id="rg-cultivo" data-bind="riego.datos.cultivo" data-rerender value="${esc(d.cultivo)}"><span class="hint">${ref ? `Referencia: ${esc(ref.nombre)}` : 'Sin referencia: no se comparan Kc ni etapas'}</span></div>
        ${campo('rg-kci', 'Kc inicial', 'riego.datos.kcIni', d.kcIni, '', o.kcIni, ref?.kc.ini.valor)}
        ${campo('rg-kcm', 'Kc medio', 'riego.datos.kcMed', d.kcMed, '', o.kcMed, ref?.kc.med.valor)}
        ${campo('rg-kcf', 'Kc final', 'riego.datos.kcFin', d.kcFin, '', o.kcFin, ref?.kc.fin.valor)}
        ${campo('rg-p', 'Fracción p', 'riego.datos.p', d.p, 'fracción', o.p, ref?.p.valor)}
        ${campo('rg-raiz', 'Profundidad radicular', 'riego.datos.profRaiz', d.profRaiz, 'm', o.profRaiz)}
        ${campo('rg-alt', 'Altura de la planta', 'riego.datos.alturaPlanta', d.alturaPlanta, 'm', o.alturaPlanta)}
        ${['Inicial', 'Desarrollo', 'Media', 'Final'].map((n, i) => campo(`rg-et${i}`, `Etapa ${n.toLowerCase()}`, `riego.datos.etapas.${i}`, d.etapas[i], 'días', o[`etapa${i}`], ref?.etapas.valor[i])).join('')}
      </div>
      <h3>Siembra y emisor</h3>
      <div class="fields">
        ${campo('rg-dp', 'Distancia entre plantas', 'riego.datos.distPlantas', d.distPlantas, 'm', o.distPlantas)}
        ${campo('rg-ds', 'Distancia entre surcos', 'riego.datos.distSurcos', d.distSurcos, 'm', o.distSurcos)}
        ${campo('rg-hil', 'Hileras por cama', 'riego.datos.hileras', d.hileras, '', o.hileras, 1)}
        ${campo('rg-q', 'Caudal del emisor', 'riego.datos.caudalEmisor', d.caudalEmisor, 'L/h', o.caudalEmisor)}
        ${campo('rg-de', 'Distancia entre emisores', 'riego.datos.distEmisores', d.distEmisores, 'm', o.distEmisores, d.distPlantas)}
        ${campo('rg-dl', 'Distancia entre laterales', 'riego.datos.distLaterales', d.distLaterales, 'm', o.distLaterales, d.distSurcos)}
      </div>
      <h3>Operación</h3>
      <div class="fields">
        ${campo('rg-eto', 'ETo de diseño', 'riego.datos.eto', d.eto, 'mm/día', o.eto)}
        ${campo('rg-ef', 'Eficiencia de riego', 'riego.datos.eficiencia', d.eficiencia, 'fracción', o.eficiencia)}
        ${campo('rg-area', 'Área del lote', 'riego.datos.areaLote', d.areaLote, 'ha', o.areaLote)}
        ${campo('rg-horas', 'Horas laborales', 'riego.datos.horasLaborales', d.horasLaborales, 'h/día', o.horasLaborales)}
        ${campo('rg-frec', 'Riego cada', 'riego.datos.frecuenciaDias', d.frecuenciaDias, 'días', null, 1)}
      </div>
    </section>
  </div>

  <section class="panel">
    <div><h2>Suelo por sección</h2><p class="muted">La lámina aprovechable se calcula en la zona radicular, con la fracción p ajustada por ETc${r.pAjustada !== null ? ` (p = ${fmt(r.pAjustada, 2)})` : ''}. Si dejas vacíos Da, CC, PMP o infiltración, se toman de la textura.</p></div>
    <div class="scroll"><table class="data"><thead><tr>
      <th>Sección</th><th class="num">Área (ha)</th><th>Textura</th><th class="num">Da (g/cm³)</th><th class="num">CC (%W)</th><th class="num">PMP (%W)</th><th class="num">Piedras (%)</th><th class="num">Infiltración (mm/h)</th><th class="num">Lámina aprovechable (mm)</th><th></th>
    </tr></thead><tbody>
      ${d.suelo.map((s, i) => {
        const c = r.suelo[i] || {};
        const inp = (k, w = 72) => `<input aria-label="${k} de ${esc(s.nombre)}" type="number" step="any" inputmode="decimal" style="width:${w}px;text-align:right" data-bind="riego.datos.suelo.${i}.${k}" data-nullable data-rerender value="${s[k] ?? ''}" placeholder="${r.datos.suelo[i]?.[k] ?? ''}">`;
        return `<tr><td><input aria-label="Nombre de la sección" style="width:110px" data-bind="riego.datos.suelo.${i}.nombre" data-rerender value="${esc(s.nombre)}"></td>
          <td class="num">${inp('area')}</td>
          <td><input aria-label="Textura de ${esc(s.nombre)}" style="width:64px" data-bind="riego.datos.suelo.${i}.textura" data-rerender value="${esc(s.textura)}" placeholder="F, FA…"></td>
          <td class="num">${inp('da')}</td><td class="num">${inp('cc')}</td><td class="num">${inp('pmp')}</td><td class="num">${inp('pedregosidad')}</td><td class="num">${inp('infiltracion')}</td>
          <td class="num"><b>${fmt(c.laa)}</b></td>
          <td><button class="btn small" data-act="riego-rm-suelo" data-i="${i}">Quitar</button></td></tr>`;
      }).join('') || '<tr><td colspan="10" class="muted">Sin secciones de suelo: no se puede revisar la frecuencia de riego.</td></tr>'}
    </tbody></table></div>
    <div><button class="btn small" data-act="riego-add-suelo">Agregar sección</button></div>
    <p class="muted" style="font-size:13px">Texturas: A arenoso · FA franco arenoso · F franco · Far franco arcilloso · ArA arcillo arenoso · Ar arcilloso (tabla CIMMYT 2012 del Lab de Riego).</p>
  </section>

  ${R.fuente === 'archivo' ? `<section class="panel">
    <div><h2>Qué se leyó del archivo</h2><p class="muted">Cada dato con la celda de donde salió. Si algo quedó mal, corrígelo arriba.</p></div>
    <div class="scroll"><table class="data"><thead><tr><th>Dato</th><th>Etiqueta en el archivo</th><th class="num">Valor</th><th>Celda</th></tr></thead><tbody>
      ${Object.values(o).map((x) => `<tr><td>${esc(x.nombre)}</td><td>${esc(x.etiqueta)}</td><td class="num">${esc(String(x.valor))}</td><td>${esc(x.celda)}</td></tr>`).join('')}
    </tbody></table></div>
    ${R.faltan?.length ? `<p><b>No se encontraron:</b> ${esc(R.faltan.join(', '))}. Complétalos arriba o se usará la referencia cuando exista.</p>` : '<p>Se encontraron todos los datos de entrada.</p>'}
    ${R.omitidas?.length ? `<p class="muted">Hojas no analizadas: ${R.omitidas.map((h) => `${esc(h.nombre.trim())} (${esc(h.motivo)})`).join('; ')}.</p>` : ''}
  </section>` : ''}`;
}
