// Vista: Dashboard de riesgo.
import { M, esc, uniq, inter } from '../core/utils.js';
import { S } from '../core/state.js';
import { CONFIG } from '../core/config.js';
import { evaluar } from '../core/engine.js';
import { radar, calRow } from './charts.js';

export function viewDashboard(){
  const f=S.farm,R=evaluar(f),mods=R.mods;
  if(!mods.length)return `<section class="panel"><h2>No hay módulos activos</h2><p class="muted">Activa al menos uno en src/core/config.js.</p></section>`;
  const top=[...mods].sort((a,b)=>b.score-a.score)[0];
  const hits=uniq([...R.ov1,...inter(f.fertMeses,f.lluviaMeses),...inter(f.sueloDesnudoMeses,f.lluviaMeses),...inter(R.amplio,R.plagaM)]);
  const recs=mods.filter(m=>m.level!=='Bajo'||m.recs.length).flatMap(m=>m.recs.map(r=>({m:m.nombre,lv:m.level,r}))).sort((a,b)=>({Alto:0,Medio:1,Bajo:2}[a.lv]-{Alto:0,Medio:1,Bajo:2}[b.lv]));
  const gg=f.gg!=='no';
  const allowed=Math.floor(Math.max(0,f.minorAplicables)*CONFIG.globalgap.margenMinorMusts);const remaining=allowed-f.minorFallas;
  return `
  ${S.demo?`<div class="notice"><span><b>Datos de ejemplo.</b> Esta finca es ficticia: los meses, dosis y especies sirven para mostrar cómo funciona la app, no son mediciones.</span><button class="btn small" data-act="start-empty">Empezar con mi finca</button></div>`:''}
  <section class="panel">
    <div class="row" style="justify-content:space-between">
      <div><p class="label">Finca</p><h1>${esc(f.nombre||'Finca sin nombre')}</h1><p class="muted">${esc(f.depto||'Sin departamento')} · ${f.area||0} ha · ${f.altitud||0} msnm · pendiente ${f.pendiente}</p></div>
      <button class="btn" data-view="wizard">Editar respuestas</button>
    </div>
    <div class="summary">
      <div><div class="k">Mayor riesgo</div><div class="v">${top.nombre} · ${top.score}</div></div>
      <div><div class="k">Módulos en alto</div><div class="v">${mods.filter(m=>m.level==='Alto').length} de ${mods.length}</div></div>
      <div><div class="k">Meses con coincidencias</div><div class="v">${hits.length ? hits.map(m=>M[m]).join(', ') : 'Ninguno'}</div></div>
      <div><div class="k">GLOBALG.A.P.</div><div class="v">${f.gg==='si'?'Certificado':f.gg==='quiero'?'Quiere certificarse':'No aplica'}</div></div>
    </div>
  </section>
  <div class="grid2">
    <section class="panel"><div><h2>Perfil de riesgo ambiental</h2><p class="muted">Índice de 0 a 100 por módulo. Más lejos del centro, más riesgo.</p></div>${radar(mods)}</section>
    <section class="panel"><h2>Riesgo por módulo</h2><div class="cards">
      ${mods.map(m=>`<article class="card lvl-${m.level}">
        <div class="row" style="justify-content:space-between"><h3>${m.nombre}</h3><span class="pill ${m.level}">${m.level}</span></div>
        <div class="score">${m.score}</div>
        <p class="muted" style="font-size:13px">Principal causa: ${m.driver}</p>
        <div><div class="row" style="justify-content:space-between;font-size:12px" ><span class="muted">Confianza de datos</span><span class="muted">${Math.round(m.conf*100)} %</span></div><div class="conf"><span style="width:${m.conf*100}%"></span></div></div>
        <details><summary>Ver fórmula</summary><div class="formula">Riesgo = 100 × P × E × V\n${m.formula}\nFórmula ilustrativa: pesos por calibrar.</div></details>
      </article>`).join('')}
    </div></section>
  </div>
  <section class="panel">
    <div><h2>Cruce de calendarios</h2><p class="muted">Los meses marcados con ! son coincidencias de riesgo.</p></div>
    <div class="scroll"><table class="cal"><thead><tr><th></th>${M.map(m=>`<th scope="col">${m}</th>`).join('')}</tr></thead><tbody>
      ${calRow('Floración visitada por polinizadores',R.atraeFlor,'on-flor')}
      ${calRow('Floración de especies de riesgo',R.riesgoFlor,'on-riesgo')}
      ${calRow('Aplicación de plaguicidas',R.aplic,'on-apl',R.ov1)}
      ${calRow('Fertilización',f.fertMeses,'on-gen',inter(f.fertMeses,f.lluviaMeses))}
      ${calRow('Lluvia fuerte',f.lluviaMeses,'on-gen')}
      ${calRow('Suelo desnudo',f.sueloDesnudoMeses,'on-gen',inter(f.sueloDesnudoMeses,f.lluviaMeses))}
      ${calRow('Plagas',R.plagaM,'on-gen',inter(R.amplio,R.plagaM))}
    </tbody></table></div>
  </section>
  <section class="panel"><h2>Qué hacer</h2>
    ${recs.length?`<ul class="recs">${recs.map(x=>`<li><span class="tag">${x.m}</span><span>${esc(x.r)}</span></li>`).join('')}</ul>`:'<p class="muted">No hay recomendaciones con los datos actuales.</p>'}
  </section>
  ${gg?`<section class="panel">
    <div><h2>Panel GLOBALG.A.P. IFA v6</h2><p class="muted">Guía de referencia. No reemplaza la auditoría ni garantiza el resultado.</p></div>
    <div class="grid2">
      <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
        <h3>Margen de Minor Musts</h3>
        <div class="row">
          <div class="f" style="width:150px"><label for="mm-apl">Aplicables</label><input id="mm-apl" type="number" min="0" data-bind="farm.minorAplicables" data-rerender value="${f.minorAplicables}"></div>
          <div class="f" style="width:150px"><label for="mm-fal">Incumplidos</label><input id="mm-fal" type="number" min="0" data-bind="farm.minorFallas" data-rerender value="${f.minorFallas}"></div>
        </div>
        <p>Se permiten <b>${allowed}</b> incumplimientos (${Math.round(CONFIG.globalgap.margenMinorMusts*100)} % redondeado hacia abajo). ${remaining>=0?`Quedan <b>${remaining}</b>.`:`<b style="color:var(--crit)">Se superó el margen por ${-remaining}: no se cumple la regla del 95 %.</b>`}</p>
        <div class="meter" aria-label="Margen de Minor Musts">${Array.from({length:Math.max(allowed,f.minorFallas)},(_,i)=>`<i class="${i<f.minorFallas?'used':'free'}" title="${i<f.minorFallas?'Usado':'Disponible'}"></i>`).join('')||'<span class="muted">Sin margen con este número de criterios.</span>'}</div>
        <p class="muted" style="font-size:13px">Los Major Musts deben cumplirse al 100 %; uno solo incumplido impide la certificación.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
        <h3>No conformidades abiertas</h3>
        <div class="scroll"><table class="data"><thead><tr><th>Criterio</th><th class="num">Días abiertos</th><th class="num">Quedan</th><th></th></tr></thead><tbody>
          ${f.nc.map((n,i)=>{const q=CONFIG.globalgap.diasCierreNC-n.dias;return`<tr><td>${esc(n.criterio)}</td><td class="num">${n.dias}</td><td class="num" style="color:${q<=7?'var(--crit)':'var(--ink)'}">${q>0?q+' días':'Vencida'}</td><td><button class="btn small" data-act="rm-nc" data-i="${i}">Cerrar</button></td></tr>`}).join('')||'<tr><td colspan="4" class="muted">Ninguna.</td></tr>'}
        </tbody></table></div>
        <div class="row">
          <input id="nc-crit" placeholder="Criterio o hallazgo" data-bind="draftNC.criterio" value="${esc(S.draftNC.criterio)}" style="flex:2;min-width:160px">
          <input id="nc-dias" type="number" min="0" placeholder="Días" data-bind="draftNC.dias" value="${S.draftNC.dias||''}" style="flex:1;min-width:80px">
          <button class="btn small" data-act="add-nc">Agregar</button>
        </div>
        <p class="muted" style="font-size:13px">Plazo máximo de ${CONFIG.globalgap.diasCierreNC} días para cerrar una no conformidad antes de la suspensión.</p>
      </div>
    </div>
    <div class="scroll"><table class="data"><thead><tr><th>Módulo</th><th>Secciones de IFA v6 frutas y verduras (Smart)</th><th class="num">Riesgo</th></tr></thead><tbody>
      ${mods.map(m=>`<tr><td>${m.nombre}</td><td>${m.ifa}</td><td class="num"><span class="pill ${m.level}">${m.score}</span></td></tr>`).join('')}
    </tbody></table></div>
    <p class="muted" style="font-size:13px">Secciones por verificar con el checklist oficial de IFA v6.</p>
  </section>`:''}`;
}
