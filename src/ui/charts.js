// Gráficos SVG: radar de riesgo, filas de calendario y gráfico de plantillas.
import { M, esc } from '../core/utils.js';
import { TPL } from '../core/state.js';

export function radar(mods){
  const cx=170,cy=150,R=105,n=mods.length;
  const pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+r*Math.cos(a),cy+r*Math.sin(a)]};
  let g='';[25,50,75,100].forEach(v=>{g+=`<polygon points="${mods.map((_,i)=>pt(i,R*v/100).join(',')).join(' ')}" fill="none" stroke="var(--line)" stroke-width="1"/>`;});
  mods.forEach((m,i)=>{const[x,y]=pt(i,R);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`;
    const[lx,ly]=pt(i,R+22);const anchor=Math.abs(lx-cx)<8?'middle':lx>cx?'start':'end';
    g+=`<text x="${lx}" y="${ly+4}" text-anchor="${anchor}" font-size="12" fill="var(--muted)">${m.nombre} · ${m.score}</text>`;});
  g+=`<text x="${cx+4}" y="${cy-R*.5+4}" font-size="10" fill="var(--muted)">50</text><text x="${cx+4}" y="${cy-R+12}" font-size="10" fill="var(--muted)">100</text>`;
  const poly=mods.map((m,i)=>pt(i,R*m.score/100).join(',')).join(' ');
  g+=`<polygon points="${poly}" fill="var(--accent)" fill-opacity=".22" stroke="var(--accent)" stroke-width="2"/>`;
  mods.forEach((m,i)=>{const[x,y]=pt(i,R*m.score/100);const c=m.level==='Alto'?'var(--crit)':m.level==='Medio'?'var(--warn)':'var(--good)';
    g+=`<circle cx="${x}" cy="${y}" r="4.5" fill="${c}"><title>${m.nombre}: ${m.score} (${m.level})</title></circle>`;});
  return `<svg viewBox="0 0 340 300" role="img" aria-label="Perfil de riesgo ambiental por módulo" style="width:100%;max-width:420px;height:auto;display:block;margin:0 auto">${g}</svg>`;
}
export function calRow(name,months,cls,hits){
  return `<tr><th class="rowh" scope="row">${name}</th>${M.map((_,i)=>`<td class="${months.includes(i)?cls:''}${hits&&hits.includes(i)?' hit':''}">${hits&&hits.includes(i)?'!':''}</td>`).join('')}</tr>`;
}
export function tplChart(t){
  const def=TPL[t.tipo];const rows=t.rows;let acc=0;
  const vals=rows.map(r=>def.acum?(acc+=Number(r.valor)||0):(Number(r.valor)||0));
  const maxV=Math.max(t.objetivo||0,...vals,1)*1.15;
  const W=640,H=240,L=48,B=32,T=16,Rr=16,iw=W-L-Rr,ih=H-T-B,bw=rows.length?Math.min(48,iw/rows.length*0.6):0;
  const y=v=>T+ih-(v/maxV)*ih;
  let g='';[0,.25,.5,.75,1].forEach(k=>{const v=maxV*k;g+=`<line x1="${L}" x2="${W-Rr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${Math.round(v)}</text>`;});
  rows.forEach((r,i)=>{const cx=L+iw*(i+.5)/rows.length;const v=vals[i];const over=t.objetivo>0&&v>t.objetivo;
    g+=`<rect x="${cx-bw/2}" y="${y(v)}" width="${bw}" height="${T+ih-y(v)}" rx="3" fill="${over?'var(--crit)':'var(--accent)'}" fill-opacity="${over?.85:.75}"><title>${esc(r.fecha)} · ${esc(r.lote)}: ${v} ${def.unidad}</title></rect>
    <text x="${cx}" y="${H-12}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(String(r.fecha).slice(5))}</text>
    <text x="${cx}" y="${y(v)-6}" text-anchor="middle" font-size="11" fill="var(--ink)">${Math.round(v)}</text>`;});
  if(t.objetivo>0)g+=`<line x1="${L}" x2="${W-Rr}" y1="${y(t.objetivo)}" y2="${y(t.objetivo)}" stroke="var(--pollen)" stroke-width="2" stroke-dasharray="6 4"/><text x="${W-Rr}" y="${y(t.objetivo)-6}" text-anchor="end" font-size="11" fill="var(--pollen)">Objetivo ${t.objetivo}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Registros frente al objetivo" style="width:100%;min-width:480px;height:auto">${g}</svg>`;
}
