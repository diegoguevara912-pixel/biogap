// Punto de entrada: renderizado y eventos.
import { uniq } from './core/utils.js';
import { S, demoFarm, emptyFarm, blankDrafts } from './core/state.js';
import { exportarTexto, importarTexto, guardarLocal, cargarLocal, configBase, cargarCasos, guardarCasos, normalizarFinca } from './core/storage.js';
import { viewDashboard } from './ui/dashboard.js';
import { viewWizard, STEPS } from './ui/wizard.js';
import { viewTemplates } from './ui/templates.js';
import { viewSettings } from './ui/settings.js';
import { viewRiego } from './ui/riego.js';
import { viewCasos } from './ui/casos.js';
import { viewFertilizacion } from './ui/fertilizacion.js';
import { montarMapa, reiniciarMapa } from './ui/mapa.js';
import { producto, UNIDADES } from './fert/catalogo.js';
import { extraerFert, PLANTILLA_CSV } from './fert/extraer.js';
import { nombreCultivoPrincipal } from './casos/perfil.js';
import { casoEjemplo, riegoVacio, declaradosEjemplo } from './riego/calculo.js';
import { leerXlsx, ErrorLectura } from './riego/xlsx.js';
import { leerCsv } from './riego/csv.js';
import { extraerRiego } from './riego/extraer.js';

// Recupera lo último guardado en este navegador (finca, ajustes, plantillas, plan y tema).
const previo = cargarLocal(S.tpl);
if (previo) Object.assign(S, previo);
S.casos = cargarCasos();

function applyTheme(){const r=document.documentElement;if(S.theme==='system')r.removeAttribute('data-theme');else r.setAttribute('data-theme',S.theme);
  const b=document.getElementById('theme-btn');if(b)b.textContent='Tema: '+({system:'sistema',light:'claro',dark:'oscuro'}[S.theme]);}
function getRef(path){const p=path.split('.');let o=S;for(let i=0;i<p.length-1;i++)o=o[p[i]];return[o,p[p.length-1]];}
function render(){
  // Conserva el foco y el cursor del campo que se estaba editando.
  const ae=document.activeElement;const id=ae&&ae.id;let ss=null;try{ss=ae&&ae.selectionStart;}catch(e){}
  const app=document.getElementById('app');
  const views={dashboard:viewDashboard,wizard:viewWizard,plantillas:viewTemplates,riego:viewRiego,fertilizacion:viewFertilizacion,casos:viewCasos,ajustes:viewSettings};
  app.innerHTML=(views[S.view]||viewDashboard)();
  S.msg='';
  document.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.view===S.view?'page':'false'));
  montarMapa();applyTheme();guardarLocal(S);
  if(id){const el=document.getElementById(id);if(el&&el.tagName!=='BUTTON'){el.focus({preventScroll:true});try{if(ss!=null)el.setSelectionRange(ss,ss);}catch(e){}}}
}
const DRAFTS={cultivos:'draftCult',especies:'draftEsp',plaguicidas:'draftPlag',plagas:'draftPlaga'};
document.addEventListener('click',e=>{
  const v=e.target.closest('[data-view]');if(v){S.view=v.dataset.view;render();window.scrollTo(0,0);return;}
  const st=e.target.closest('[data-step]');if(st){S.step=+st.dataset.step;render();return;}
  const sm=e.target.closest('[data-sim]');if(sm&&!sm.disabled){S.sim[sm.dataset.sim]=!S.sim[sm.dataset.sim];render();return;}
  const mb=e.target.closest('[data-month]');if(mb){const[o,k]=getRef(mb.dataset.path);const i=+mb.dataset.month;o[k]=o[k].includes(i)?o[k].filter(x=>x!==i):uniq([...o[k],i]);render();return;}
  const a=e.target.closest('[data-act]');if(!a)return;const act=a.dataset.act,f=S.farm;
  S.ioMsg='';
  if(act==='theme'){S.theme={system:'light',light:'dark',dark:'system'}[S.theme];}
  else if(act==='next'){S.step=Math.min(STEPS.length-1,S.step+1);}
  else if(act==='prev'){S.step=Math.max(0,S.step-1);}
  else if(act==='finish'){S.view='dashboard';}
  else if(act==='start-empty'){reiniciarMapa();S.farm=emptyFarm();S.demo=false;S.done={};S.view='wizard';S.step=0;}
  else if(act==='load-demo'){reiniciarMapa();S.farm=demoFarm();S.demo=true;S.done={};S.view='dashboard';S.msg='Se cargó la finca de ejemplo.';}
  else if(act==='cult-yes'){f.tieneCultivos=true;}
  else if(act==='cult-no'){f.tieneCultivos=false;}
  else if(act==='gg'){f.gg=a.dataset.v;}
  else if(act==='rm'){f[a.dataset.list].splice(+a.dataset.i,1);}
  else if(act==='edit'){const l=a.dataset.list,i=+a.dataset.i;S[DRAFTS[l]]=structuredClone(f[l][i]);f[l].splice(i,1);}
  else if(act==='add-esp'){if(!S.draftEsp.nombre.trim())return;f.especies.push({...S.draftEsp,floracion:[...S.draftEsp.floracion]});S.draftEsp=blankDrafts().draftEsp;}
  else if(act==='add-plag'){if(!S.draftPlag.producto.trim())return;f.plaguicidas.push({...S.draftPlag,meses:[...S.draftPlag.meses]});S.draftPlag=blankDrafts().draftPlag;}
  else if(act==='add-plaga'){if(!S.draftPlaga.nombre.trim())return;f.plagas.push({...S.draftPlaga,meses:[...S.draftPlaga.meses]});S.draftPlaga=blankDrafts().draftPlaga;}
  else if(act==='add-cult'){if(!S.draftCult.nombre.trim())return;f.cultivos.push({...S.draftCult,ha:Number(S.draftCult.ha)||0,siembra:[...S.draftCult.siembra],cosecha:[...S.draftCult.cosecha]});S.draftCult=blankDrafts().draftCult;}
  else if(act==='add-nc'){if(!S.draftNC.criterio.trim())return;f.nc.push({criterio:S.draftNC.criterio,dias:Number(S.draftNC.dias)||0});S.draftNC=blankDrafts().draftNC;}
  else if(act==='rm-nc'){f.nc.splice(+a.dataset.i,1);}
  else if(act==='rm-row'){S.tpl.rows.splice(+a.dataset.i,1);}
  else if(act==='add-row'){const d=S.draftRow;if(!d.fecha||d.valor===''||isNaN(Number(d.valor)))return;S.tpl.rows.push({fecha:d.fecha,lote:d.lote||'Sin lote',valor:Number(d.valor)});S.draftRow={fecha:'',lote:d.lote,valor:''};}
  else if(act==='sim-reset'){Object.keys(S.sim).forEach(k=>S.sim[k]=false);}
  else if(act==='reset'){S.confirmReset=true;}
  else if(act==='reset-no'){S.confirmReset=false;}
  else if(act==='reset-yes'){reiniciarMapa();S.farm=emptyFarm();S.demo=false;S.done={};S.tpl.rows=[];S.confirmReset=false;S.view='wizard';S.step=0;S.ioMsg='Datos borrados.';}
  else if(act==='io-copy'){
    const txt=exportarTexto(S.farm,S.ajustes,S.tpl);S.io=txt;render();
    const box=document.getElementById('io-box');const m=document.getElementById('io-msg');
    const sel=()=>{if(box){box.focus();box.select();}if(m)m.textContent='Respaldo seleccionado: cópialo con Ctrl+C.';};
    try{navigator.clipboard.writeText(txt).then(()=>{if(m)m.textContent='Respaldo copiado.';},sel);}catch(err){sel();}
    return;}
  else if(act==='io-load'){
    try{const r=importarTexto(S.io);S.farm=r.farm;S.ajustes=r.ajustes;if(r.tpl)S.tpl=r.tpl;S.demo=false;S.done={};S.io='';S.ioMsg='Respaldo cargado.';}
    catch(err){S.ioMsg=`No se pudo cargar: ${err.message} Copia uno con "Copiar respaldo".`;}}
  else if(act==='export'){descargar();return;}
  else if(act==='import'){abrirArchivo();return;}
  else if(act==='toggle-mod'){const id=a.dataset.id,on=S.ajustes.modulosActivos;S.ajustes.modulosActivos=on.includes(id)?on.filter(x=>x!==id):[...on,id];}
  else if(act==='reset-ajustes'){S.ajustes=configBase();}
  else if(act==='fert-import'){importarFert();return;}
  else if(act==='fert-plantilla'){bajar(PLANTILLA_CSV,'plantilla-fertilizacion.csv','text/csv;charset=utf-8');return;}
  else if(act==='fert-unidad'){S.fertUnidad=UNIDADES[a.dataset.u]?a.dataset.u:'kgha';}
  else if(act==='add-fert'){const d=S.draftFert,dos=Number(d.dosis);if(!(dos>0)){S.msg='Escribe una dosis mayor que cero.';render();return;}
    const g=producto(d.producto),otro=g.id==='otro',pct=x=>Math.min(100,Math.max(0,Number(x)||0));
    f.fertPlan.push({mes:Number(d.mes)||0,producto:g.id,n:otro?pct(d.n):g.n,p:otro?pct(d.p):g.p,k:otro?pct(d.k):g.k,
      dosis:dos*UNIDADES[S.fertUnidad].aKgHa,metodo:d.metodo});
    f.fertPlan.sort((x,y)=>x.mes-y.mes);S.draftFert={...d,dosis:''};S.demo=false;}
  else if(act==='rm-fert'){f.fertPlan.splice(+a.dataset.i,1);S.demo=false;}
  else if(act==='edit-fert'){const x=f.fertPlan.splice(+a.dataset.i,1)[0];
    S.draftFert={mes:x.mes,producto:x.producto,n:x.n,p:x.p,k:x.k,dosis:+(x.dosis/UNIDADES[S.fertUnidad].aKgHa).toFixed(2),metodo:x.metodo};}
  else if(act==='caso-guardar'){
    const finca=normalizarFinca(structuredClone(f));const cult=nombreCultivoPrincipal(finca);
    S.casos.push({id:'propio-'+Date.now().toString(36),origen:S.demo?'ejemplo':'propio',etiqueta:`${finca.nombre||'Finca sin nombre'}${cult?' · '+cult:''}`,guardado:new Date().toISOString(),finca});
    S.msg=guardarCasos(S.casos)?`Caso guardado. La memoria tiene ${S.casos.length} caso(s) tuyos.`:'El caso quedó en esta sesión, pero el navegador no permitió guardarlo.';}
  else if(act==='caso-rm'){S.casos=S.casos.filter(c=>c.id!==a.dataset.id);guardarCasos(S.casos);S.msg='Caso quitado de la memoria.';}
  else if(act==='riego-import'){importarRiego();return;}
  else if(act==='riego-ejemplo'){S.riego={datos:casoEjemplo(),fuente:'ejemplo',archivo:'',origen:{},declarados:declaradosEjemplo(),faltan:[],omitidas:[]};}
  else if(act==='riego-blanco'){S.riego={datos:riegoVacio(),fuente:'manual',archivo:'',origen:{},declarados:{},faltan:[],omitidas:[]};}
  else if(act==='riego-add-suelo'){S.riego.datos.suelo.push({nombre:`Parte ${S.riego.datos.suelo.length+1}`,area:null,textura:'',da:null,cc:null,pmp:null,pedregosidad:null,infiltracion:null});}
  else if(act==='riego-rm-suelo'){S.riego.datos.suelo.splice(+a.dataset.i,1);}
  else if(act==='paste'){
    const lines=S.tpl.paste.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);let ok=0,bad=0;
    lines.forEach(l=>{const c=l.split(/\t|;|,/).map(x=>x.trim());const val=Number((c[2]||'').replace(',','.'));if(c.length>=3&&!isNaN(val)){S.tpl.rows.push({fecha:c[0],lote:c[1],valor:val});ok++;}else bad++;});
    S.tpl.paste='';render();const m=document.getElementById('paste-msg');if(m)m.textContent=`Se agregaron ${ok} filas${bad?`; ${bad} no tenían el formato fecha, lote, valor`:''}.`;return;
  }
  render();if(['next','prev','finish','start-empty','load-demo','reset-yes'].includes(act))window.scrollTo(0,0);
});
function bindValue(el){const[o,k]=getRef(el.dataset.bind);
  if('lines' in el.dataset)o[k]=el.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,30);
  else if(el.type==='checkbox')o[k]=el.checked;else if(el.type==='number')o[k]=el.value===''?('nullable' in el.dataset?null:0):Number(el.value);else o[k]=el.value;
  if(el.dataset.bind.startsWith('farm.'))S.demo=false;}
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.bind){bindValue(e.target);guardarLocal(S);}});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset&&el.dataset.done!==undefined){S.done[el.dataset.done]=el.checked;render();return;}
  if(!el.dataset||!el.dataset.bind)return;bindValue(el);
  const vuelve=el.tagName==='SELECT'||'rerender' in el.dataset||['farm.area','farm.areaProd','farm.nAplicado','farm.nObjetivo'].includes(el.dataset.bind);
  if(vuelve)queueMicrotask(render);}); // diferido: el cambio puede llegar durante un blur
applyTheme();render();

// Exportar e importar la finca como archivo JSON.
function nombreArchivo(){const base=(S.farm.nombre||'finca').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'finca';return `biogap-${base}.json`;}
function descargar(){
  const blob=new Blob([exportarTexto(S.farm,S.ajustes,S.tpl)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');
  link.href=url;link.download=nombreArchivo();document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  S.msg=`Se descargó ${nombreArchivo()}.`;render();
}
function abrirArchivo(){
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
  input.addEventListener('change',async()=>{
    const file=input.files&&input.files[0];if(!file)return;
    try{
      if(file.size>2_000_000)throw new Error('El archivo es demasiado grande.');
      const {farm,ajustes,tpl}=importarTexto(await file.text());
      S.farm=farm;S.ajustes=ajustes;if(tpl)S.tpl=tpl;S.demo=false;S.done={};S.view='dashboard';
      S.msg=`Se importó la finca "${farm.nombre||'sin nombre'}".`;
    }catch(err){S.msg=`No se pudo importar: ${err.message}`;}
    render();
  });
  input.click();
}

// Descarga un texto como archivo.
function bajar(texto,nombre,tipo){const url=URL.createObjectURL(new Blob(['\ufeff'+texto],{type:tipo}));const l=document.createElement('a');l.href=url;l.download=nombre;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

// Importar el plan de fertilización desde Excel (.xlsx) o CSV. Nada sale del navegador.
function importarFert(){
  const input=document.createElement('input');input.type='file';input.accept='.xlsx,.csv,.txt';
  input.addEventListener('change',async()=>{
    const file=input.files&&input.files[0];if(!file)return;const nombre=file.name.toLowerCase();
    try{
      if(file.size>LIMITE_ARCHIVO)throw new ErrorLectura('El archivo pesa más de 100 MB.');
      let libro;
      if(nombre.endsWith('.xlsx'))libro=await leerXlsx(await file.arrayBuffer());
      else if(nombre.endsWith('.csv')||nombre.endsWith('.txt'))libro=leerCsv(await file.text(),file.name);
      else if(nombre.endsWith('.xls'))throw new ErrorLectura('Es un Excel antiguo (.xls): guárdalo como .xlsx o CSV y vuelve a cargarlo.');
      else throw new ErrorLectura('Formato no reconocido: usa .xlsx o .csv.');
      const x=extraerFert(libro);
      if(!x.hoja)throw new ErrorLectura('No encontré una fila de encabezados con "Producto" y "Dosis". Usa la plantilla como guía.');
      if(!x.plan.length)throw new ErrorLectura(`Encontré los encabezados en "${x.hoja}", pero ninguna fila se pudo leer.${x.omitidas[0]?' Fila '+x.omitidas[0].fila+': '+x.omitidas[0].motivo:''}`);
      S.farm.fertPlan=x.plan;S.demo=false;S.fertImport={archivo:file.name,hoja:x.hoja,omitidas:x.omitidas,avisos:x.avisos};S.view='fertilizacion';
      S.msg=`Se leyeron ${x.plan.length} aplicaciones de ${file.name}${x.omitidas.length?`; ${x.omitidas.length} fila(s) no se pudieron leer`:''}.`;
    }catch(err){S.msg=`No se pudo leer ${file.name}: ${err instanceof ErrorLectura?err.message:'el archivo está dañado o no es compatible.'}`;}
    render();
  });
  input.click();
}

// Importar datos de riego desde Excel (.xlsx) o CSV. Nada sale del navegador.
const LIMITE_ARCHIVO=100*1024*1024;
function importarRiego(){
  const input=document.createElement('input');input.type='file';input.accept='.xlsx,.csv,.txt';
  input.addEventListener('change',async()=>{
    const file=input.files&&input.files[0];if(!file)return;
    const nombre=file.name.toLowerCase();
    try{
      if(file.size>LIMITE_ARCHIVO)throw new ErrorLectura('El archivo pesa más de 100 MB.');
      let libro;
      if(nombre.endsWith('.xlsx'))libro=await leerXlsx(await file.arrayBuffer());
      else if(nombre.endsWith('.csv')||nombre.endsWith('.txt'))libro=leerCsv(await file.text(),file.name);
      else if(nombre.endsWith('.xls'))throw new ErrorLectura('Es un Excel antiguo (.xls): guárdalo como .xlsx o CSV y vuelve a cargarlo.');
      else throw new ErrorLectura('Formato no reconocido: usa .xlsx o .csv.');
      const x=extraerRiego(libro);
      const encontrados=Object.keys(x.origen).length;
      if(!encontrados)throw new ErrorLectura('No se reconoció ningún dato de riego. Revisa que las etiquetas estén junto a sus valores, o escríbelos a mano.');
      S.riego={datos:x.datos,fuente:'archivo',archivo:file.name,origen:x.origen,declarados:x.declarados,faltan:x.faltan,omitidas:libro.omitidas||[]};
      S.view='riego';
      S.msg=`Se leyeron ${encontrados} datos de ${file.name}.`;
    }catch(err){S.msg=`No se pudo leer ${file.name}: ${err instanceof ErrorLectura?err.message:'el archivo está dañado o no es compatible.'}`;}
    render();
  });
  input.click();
}
