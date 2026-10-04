// Punto de entrada: renderizado y eventos.
import { uniq } from './core/utils.js';
import { S, demoFarm, emptyFarm, blankDrafts } from './core/state.js';
import { exportarTexto, importarTexto, guardarLocal, cargarLocal, configBase } from './core/storage.js';
import { viewDashboard } from './ui/dashboard.js';
import { viewWizard, STEPS } from './ui/wizard.js';
import { viewTemplates } from './ui/templates.js';
import { viewSettings } from './ui/settings.js';
import { viewRiego } from './ui/riego.js';
import { casoEjemplo, riegoVacio, declaradosEjemplo } from './riego/calculo.js';
import { leerXlsx, ErrorLectura } from './riego/xlsx.js';
import { leerCsv } from './riego/csv.js';
import { extraerRiego } from './riego/extraer.js';

// Recupera la última finca guardada en este navegador.
const previo = cargarLocal();
if (previo) Object.assign(S, previo);

function getRef(path){const p=path.split('.');let o=S;for(let i=0;i<p.length-1;i++)o=o[p[i]];return[o,p[p.length-1]];}
function render(){
  const app=document.getElementById('app');
  const views={dashboard:viewDashboard,wizard:viewWizard,plantillas:viewTemplates,riego:viewRiego,ajustes:viewSettings};
  app.innerHTML=(views[S.view]||viewDashboard)();
  S.msg='';
  guardarLocal(S);
  document.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.view===S.view?'page':'false'));
}
document.addEventListener('click',e=>{
  const v=e.target.closest('[data-view]');if(v){S.view=v.dataset.view;render();window.scrollTo(0,0);return;}
  const mb=e.target.closest('[data-month]');if(mb){const[o,k]=getRef(mb.dataset.path);const i=+mb.dataset.month;o[k]=o[k].includes(i)?o[k].filter(x=>x!==i):uniq([...o[k],i]);render();return;}
  const a=e.target.closest('[data-act]');if(!a)return;const act=a.dataset.act,f=S.farm;
  if(act==='next'){S.step=Math.min(STEPS.length-1,S.step+1);}
  else if(act==='prev'){S.step=Math.max(0,S.step-1);}
  else if(act==='finish'){S.view='dashboard';}
  else if(act==='start-empty'){S.farm=emptyFarm();S.demo=false;S.view='wizard';S.step=0;}
  else if(act==='cult-yes'){f.tieneCultivos=true;}
  else if(act==='cult-no'){f.tieneCultivos=false;}
  else if(act==='gg'){f.gg=a.dataset.v;}
  else if(act==='rm'){f[a.dataset.list].splice(+a.dataset.i,1);}
  else if(act==='add-esp'){if(!S.draftEsp.nombre.trim())return;f.especies.push({...S.draftEsp,floracion:[...S.draftEsp.floracion]});S.draftEsp=blankDrafts().draftEsp;}
  else if(act==='add-plag'){if(!S.draftPlag.producto.trim())return;f.plaguicidas.push({...S.draftPlag,meses:[...S.draftPlag.meses]});S.draftPlag=blankDrafts().draftPlag;}
  else if(act==='add-plaga'){if(!S.draftPlaga.nombre.trim())return;f.plagas.push({...S.draftPlaga,meses:[...S.draftPlaga.meses]});S.draftPlaga=blankDrafts().draftPlaga;}
  else if(act==='add-cult'){if(!S.draftCult.nombre.trim())return;f.cultivos.push({...S.draftCult,ha:Number(S.draftCult.ha)||0,siembra:[...S.draftCult.siembra],cosecha:[...S.draftCult.cosecha]});S.draftCult=blankDrafts().draftCult;}
  else if(act==='add-nc'){if(!S.draftNC.criterio.trim())return;f.nc.push({criterio:S.draftNC.criterio,dias:Number(S.draftNC.dias)||0});S.draftNC=blankDrafts().draftNC;}
  else if(act==='export'){descargar();return;}
  else if(act==='import'){abrirArchivo();return;}
  else if(act==='toggle-mod'){const id=a.dataset.id,on=S.ajustes.modulosActivos;S.ajustes.modulosActivos=on.includes(id)?on.filter(x=>x!==id):[...on,id];}
  else if(act==='reset-ajustes'){S.ajustes=configBase();}
  else if(act==='load-demo'){S.farm=demoFarm();S.demo=true;S.view='dashboard';S.msg='Se cargó la finca de ejemplo.';}
  else if(act==='riego-import'){importarRiego();return;}
  else if(act==='riego-ejemplo'){S.riego={datos:casoEjemplo(),fuente:'ejemplo',archivo:'',origen:{},declarados:declaradosEjemplo(),faltan:[],omitidas:[]};}
  else if(act==='riego-blanco'){S.riego={datos:riegoVacio(),fuente:'manual',archivo:'',origen:{},declarados:{},faltan:[],omitidas:[]};}
  else if(act==='riego-add-suelo'){S.riego.datos.suelo.push({nombre:`Parte ${S.riego.datos.suelo.length+1}`,area:null,textura:'',da:null,cc:null,pmp:null,pedregosidad:null,infiltracion:null});}
  else if(act==='riego-rm-suelo'){S.riego.datos.suelo.splice(+a.dataset.i,1);}
  else if(act==='rm-nc'){f.nc.splice(+a.dataset.i,1);}
  else if(act==='rm-row'){S.tpl.rows.splice(+a.dataset.i,1);}
  else if(act==='paste'){
    const lines=S.tpl.paste.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);let ok=0,bad=0;
    lines.forEach(l=>{const c=l.split(/\t|;|,/).map(x=>x.trim());const val=Number((c[2]||'').replace(',','.'));if(c.length>=3&&!isNaN(val)){S.tpl.rows.push({fecha:c[0],lote:c[1],valor:val});ok++;}else bad++;});
    S.tpl.paste='';render();const m=document.getElementById('paste-msg');if(m)m.textContent=`Se agregaron ${ok} filas${bad?`; ${bad} no tenían el formato fecha, lote, valor`:''}.`;return;
  }
  render();if(['next','prev','finish','start-empty'].includes(act))window.scrollTo(0,0);
});
function bindValue(el){const[o,k]=getRef(el.dataset.bind);
  if(el.type==='checkbox')o[k]=el.checked;else if(el.type==='number')o[k]=el.value===''?('nullable' in el.dataset?null:0):Number(el.value);else o[k]=el.value;}
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.bind)bindValue(e.target);});
document.addEventListener('change',e=>{const el=e.target;if(!el.dataset||!el.dataset.bind)return;bindValue(el);
  if(el.tagName==='SELECT'||el.type==='checkbox'||'rerender' in el.dataset){if(el.dataset.bind!=='draftEsp.atrae'&&el.dataset.bind!=='draftEsp.riesgo')queueMicrotask(render);}}); // diferido: el cambio puede llegar durante un blur
render();

// Exportar e importar la finca como archivo JSON.
function nombreArchivo(){const base=(S.farm.nombre||'finca').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'finca';return `biogap-${base}.json`;}
function descargar(){
  const blob=new Blob([exportarTexto(S.farm,S.ajustes)],{type:'application/json'});
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
      const {farm,ajustes}=importarTexto(await file.text());
      S.farm=farm;S.ajustes=ajustes;S.demo=false;S.view='dashboard';
      S.msg=`Se importó la finca "${farm.nombre||'sin nombre'}".`;
    }catch(err){S.msg=`No se pudo importar: ${err.message}`;}
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
