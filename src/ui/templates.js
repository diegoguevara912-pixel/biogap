// Vista: Plantillas de registro (fertilización, riego, mecanización, personalizada).
import { esc } from '../core/utils.js';
import { S, TPL } from '../core/state.js';
import { field, select } from './components.js';
import { tplChart } from './charts.js';

export function viewTemplates(){
  const t=S.tpl,def=TPL[t.tipo];let acc=0;const total=t.rows.reduce((s,r)=>s+(Number(r.valor)||0),0);
  const d=S.draftRow;
  return `<section class="panel"><div><h2>Plantillas</h2><p class="muted">Lleva tus registros como siempre, en Excel o aquí, y compáralos con el objetivo de tu finca. Puedes pegar filas copiadas de Excel.</p></div>
    <div class="fields">
      ${select('t-tipo','Tipo de plantilla','tpl.tipo',t.tipo,Object.entries(TPL).map(([k,v])=>[k,v.nombre]))}
      <div class="f"><label for="t-obj">${def.obj}</label><input id="t-obj" type="number" min="0" data-bind="tpl.objetivo" data-rerender value="${t.objetivo}"><span class="hint">${def.unidad}${def.acum?' · se compara el acumulado':''}</span></div>
    </div>
    <div class="scroll">${tplChart(t)}</div>
    <div class="scroll"><table class="data"><thead><tr><th>Fecha</th><th>Lote</th><th class="num">Valor (${def.unidad})</th>${def.acum?'<th class="num">Acumulado</th>':''}<th></th></tr></thead><tbody>
      ${t.rows.map((r,i)=>{acc+=Number(r.valor)||0;return`<tr><td>${esc(r.fecha)}</td><td>${esc(r.lote)}</td><td class="num">${r.valor}</td>${def.acum?`<td class="num">${acc}</td>`:''}<td><button class="btn sm" data-act="rm-row" data-i="${i}">Quitar</button></td></tr>`}).join('')||'<tr><td colspan="5" class="muted">Sin registros.</td></tr>'}
    </tbody></table></div>
    <p>${def.acum?`Acumulado: <b>${total} ${def.unidad}</b>${t.objetivo>0?` de un objetivo de ${t.objetivo} (${Math.round(total/t.objetivo*100)} %).`:'.'}`:`Registros sobre el objetivo: <b>${t.rows.filter(r=>Number(r.valor)>t.objetivo).length}</b> de ${t.rows.length}.`}</p>
    ${t.tipo==='fert'?`<div class="row"><button class="btn sm" data-act="tpl-to-farm">Usar este acumulado como nitrógeno aplicado de la finca</button><span class="muted small" id="paste-msg2">${esc(S.ioMsg)}</span></div>`:''}
    <div class="subform"><h3>Agregar un registro</h3>
      <div class="fields">
        ${field('r-fecha','Fecha','draftRow.fecha',d.fecha,'date')}
        ${field('r-lote','Lote','draftRow.lote',d.lote)}
        ${field('r-valor','Valor ('+def.unidad+')','draftRow.valor',d.valor,'number')}
      </div>
      <div><button class="btn" data-act="add-row">Agregar registro</button></div>
    </div>
    <div class="subform"><h3>Pegar desde Excel o CSV</h3>
      <div class="f"><label for="t-paste">Una fila por registro: fecha, lote, valor</label><textarea id="t-paste" data-bind="tpl.paste" placeholder="2026-08-01, Lote 3, 30">${esc(t.paste)}</textarea></div>
      <div class="row"><button class="btn" data-act="paste">Agregar filas</button><span class="muted small" id="paste-msg"></span></div>
    </div>
    <p class="muted small">En la app real, la exportación a Excel queda siempre disponible y los registros de fertilización alimentan el módulo de riesgo.</p>
  </section>`;
}
