// Vista: Cuestionario inicial de la finca (asistente por pasos).
import { M, esc } from '../core/utils.js';
import { S } from '../core/state.js';
import { months, field, select } from './components.js';

export const STEPS=['Finca','Cultivos','Especies','Prácticas','Calendarios','Certificación'];
export function viewWizard(){
  const f=S.farm,s=S.step;let body='';
  if(s===0)body=`<h2>Cuéntanos de tu finca</h2><div class="fields">
    ${field('w-nombre','Nombre de la finca','farm.nombre',f.nombre)}
    ${field('w-depto','Departamento','farm.depto',f.depto)}
    ${field('w-area','Área total','farm.area',f.area,'number','Hectáreas')}
    ${field('w-areap','Área productiva','farm.areaProd',f.areaProd,'number','Hectáreas')}
    ${field('w-alt','Altitud','farm.altitud',f.altitud,'number','Metros sobre el nivel del mar')}
    ${select('w-pend','Pendiente predominante','farm.pendiente',f.pendiente,[['plana','Plana'],['ondulada','Ondulada'],['fuerte','Fuerte']])}
    ${field('w-fuente','Fuente de agua principal','farm.fuenteAgua',f.fuenteAgua,'text','Pozo, quebrada, río, reservorio')}
    ${field('w-dist','Distancia al cuerpo de agua más cercano','farm.distAgua',f.distAgua,'number','Metros')}
  </div>`;
  if(s===1)body=`<h2>¿Tienes cultivos?</h2>
    <div class="choice"><button data-act="cult-yes" aria-pressed="${f.tieneCultivos}">Sí, tengo cultivos</button><button data-act="cult-no" aria-pressed="${!f.tieneCultivos}">No, es con fines académicos</button></div>
    ${f.tieneCultivos?`<div class="list">${f.cultivos.map((c,i)=>`<div class="item"><span class="grow"><b>${esc(c.nombre)}</b> · ${c.ha} ha · siembra ${c.siembra.map(m=>M[m]).join(', ')||'—'} · cosecha ${c.cosecha.map(m=>M[m]).join(', ')||'—'}</span><button class="btn small" data-act="rm" data-list="cultivos" data-i="${i}">Quitar</button></div>`).join('')||'<p class="muted">Aún no hay cultivos.</p>'}</div>
    <div class="subform"><h3>Agregar cultivo</h3><div class="fields">${field('c-nom','Cultivo','draftCult.nombre',S.draftCult.nombre)}${field('c-ha','Área','draftCult.ha',S.draftCult.ha||'','number','Hectáreas')}</div>
    <div class="f"><span class="label">Meses de siembra</span>${months('draftCult.siembra',S.draftCult.siembra)}</div>
    <div class="f"><span class="label">Meses de cosecha</span>${months('draftCult.cosecha',S.draftCult.cosecha)}</div>
    <div><button class="btn" data-act="add-cult">Agregar cultivo</button></div></div>`:''}`;
  if(s===2)body=`<h2>¿Qué especies hay en tu finca?</h2><p class="muted">Incluye árboles, malezas, especies nativas y fauna que observes, como abejas nativas.</p>
    <div class="list">${f.especies.map((e,i)=>`<div class="item"><span class="grow"><b><i>${esc(e.nombre)}</i></b> · ${e.tipo} · ${e.origen}${e.floracion.length?` · florece ${e.floracion.map(m=>M[m]).join(', ')}`:''}</span>${e.atrae?'<span class="chip">Atrae polinizadores</span>':''}${e.riesgo?'<span class="chip r">Riesgo para polinizadores</span>':''}<button class="btn small" data-act="rm" data-list="especies" data-i="${i}">Quitar</button></div>`).join('')||'<p class="muted">Aún no hay especies.</p>'}</div>
    <div class="subform"><h3>Agregar especie</h3><div class="fields">
      ${field('e-nom','Nombre científico o común','draftEsp.nombre',S.draftEsp.nombre)}
      ${select('e-tipo','Tipo','draftEsp.tipo',S.draftEsp.tipo,[['Árbol','Árbol'],['Arbusto','Arbusto'],['Maleza','Maleza'],['Cultivo','Cultivo'],['Fauna','Fauna']])}
      ${select('e-orig','Origen','draftEsp.origen',S.draftEsp.origen,[['nativa','Nativa'],['exótica','Exótica'],['desconocido','No sé']])}
    </div>
    <div class="f"><span class="label">Calendario de floración</span>${months('draftEsp.floracion',S.draftEsp.floracion)}</div>
    <div class="row"><label class="row" style="gap:6px"><input id="e-atrae" type="checkbox" style="width:auto" data-bind="draftEsp.atrae" ${S.draftEsp.atrae?'checked':''}> Atrae polinizadores</label>
    <label class="row" style="gap:6px"><input id="e-riesgo" type="checkbox" style="width:auto" data-bind="draftEsp.riesgo" ${S.draftEsp.riesgo?'checked':''}> Es un riesgo para polinizadores</label></div>
    <div><button class="btn" data-act="add-esp">Agregar especie</button></div></div>`;
  if(s===3)body=`<h2>¿Qué prácticas agrícolas usas?</h2><div class="fields">
    ${select('p-riego','Sistema de riego','farm.riego',f.riego,[['gravedad','Gravedad'],['aspersion','Aspersión'],['goteo','Goteo'],['ninguno','Sin riego']])}
    ${select('p-lab','Labranza','farm.labranza',f.labranza,[['convencional','Convencional'],['minima','Mínima'],['cero','Cero labranza']])}
    ${field('p-n','Nitrógeno aplicado por año','farm.nAplicado',f.nAplicado,'number','kg N/ha')}
    ${field('p-nobj','Objetivo de nitrógeno de la finca','farm.nObjetivo',f.nObjetivo,'number','kg N/ha, según tu plan o tu agrónomo')}
  </div>
  <div class="f"><span class="label">Meses de fertilización</span>${months('farm.fertMeses',f.fertMeses)}</div>
  <h3>Plaguicidas</h3>
  <div class="list">${f.plaguicidas.map((p,i)=>`<div class="item"><span class="grow"><b>${esc(p.producto)}</b> · ${{amplio:'Amplio espectro',selectivo:'Selectivo',biologico:'Biológico'}[p.clase]} · ${p.meses.map(m=>M[m]).join(', ')||'sin meses'}</span><button class="btn small" data-act="rm" data-list="plaguicidas" data-i="${i}">Quitar</button></div>`).join('')||'<p class="muted">Sin plaguicidas registrados.</p>'}</div>
  <div class="subform"><div class="fields">${field('q-prod','Producto','draftPlag.producto',S.draftPlag.producto)}${select('q-clase','Clase','draftPlag.clase',S.draftPlag.clase,[['amplio','Amplio espectro'],['selectivo','Selectivo'],['biologico','Biológico']])}</div>
  <div class="f"><span class="label">Meses de aplicación</span>${months('draftPlag.meses',S.draftPlag.meses)}</div><div><button class="btn" data-act="add-plag">Agregar plaguicida</button></div></div>`;
  if(s===4)body=`<h2>Calendarios e historial</h2>
    <div class="f"><span class="label">Meses de lluvia fuerte</span>${months('farm.lluviaMeses',f.lluviaMeses)}</div>
    <div class="f"><span class="label">Meses con suelo desnudo</span>${months('farm.sueloDesnudoMeses',f.sueloDesnudoMeses)}</div>
    <h3>Historial de plagas</h3>
    <div class="list">${f.plagas.map((p,i)=>`<div class="item"><span class="grow"><b>${esc(p.nombre)}</b> · severidad ${p.severidad} · ${p.meses.map(m=>M[m]).join(', ')}</span><button class="btn small" data-act="rm" data-list="plagas" data-i="${i}">Quitar</button></div>`).join('')||'<p class="muted">Sin plagas registradas.</p>'}</div>
    <div class="subform"><div class="fields">${field('g-nom','Plaga','draftPlaga.nombre',S.draftPlaga.nombre)}${select('g-sev','Severidad','draftPlaga.severidad',S.draftPlaga.severidad,[['baja','Baja'],['media','Media'],['alta','Alta']])}</div>
    <div class="f"><span class="label">Meses en que aparece</span>${months('draftPlaga.meses',S.draftPlaga.meses)}</div><div><button class="btn" data-act="add-plaga">Agregar plaga</button></div></div>`;
  if(s===5)body=`<h2>¿Eres o quieres ser certificado por GLOBALG.A.P.?</h2>
    <p class="muted">Tu respuesta no cambia el cálculo de riesgo. Solo agrega la guía de requisitos de IFA v6 en el dashboard.</p>
    <div class="choice">
      <button data-act="gg" data-v="si" aria-pressed="${f.gg==='si'}">Sí, ya estoy certificado</button>
      <button data-act="gg" data-v="quiero" aria-pressed="${f.gg==='quiero'}">Quiero certificarme</button>
      <button data-act="gg" data-v="no" aria-pressed="${f.gg==='no'}">No por ahora</button>
    </div>`;
  return `<section class="panel">
    <div class="steps">${STEPS.map((t,i)=>`<span class="${i===s?'now':i<s?'done':''}">${i+1}. ${t}</span>`).join('')}</div>
    ${body}
    <div class="wnav"><button class="btn" data-act="prev" ${s===0?'disabled':''}>Anterior</button>
    ${s<STEPS.length-1?`<button class="btn primary" data-act="next">Siguiente</button>`:`<button class="btn primary" data-act="finish">Ver mi dashboard</button>`}</div>
  </section>`;
}
