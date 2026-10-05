// Módulo: Cadenas tróficas (plaguicidas de amplio espectro y enemigos naturales).
import { M, inter } from '../core/utils.js';
import { variable, porCortes } from '../core/rubrica.js';

export default {
  id: 'troficas',
  nombre: 'Cadenas tróficas',
  ifa: '22 Biodiversidad · 31 MIP',
  evaluar(f, ctx, { cfg }) {
    const R = cfg.rubrica.troficas;
    const { amplio, plagaM, aplic, cosechaM } = ctx;
    const tot = f.plaguicidas.length;
    const fracAmplio = tot ? f.plaguicidas.filter((p) => p.clase === 'amplio').length / tot : null;
    const fracPlaga = !tot ? null : amplio.length ? inter(amplio, plagaM).length / amplio.length : 0;
    const silv = f.especies.filter((e) => e.tipo !== 'Cultivo' && e.origen !== 'desconocido');
    const nat = silv.length ? silv.filter((e) => e.origen === 'nativa').length / silv.length : null;
    const pre = inter(aplic, cosechaM);
    const variables = [
      variable('amplioEspectro', 'Productos de amplio espectro', R.amplioEspectro.peso, porCortes(fracAmplio, R.amplioEspectro),
        fracAmplio == null ? 'Sin plaguicidas registrados' : `${Math.round(fracAmplio * 100)} % de los productos`),
      variable('amplioEnPlaga', 'Amplio espectro en meses de plaga', R.amplioEnPlaga.peso, porCortes(fracPlaga, R.amplioEnPlaga),
        fracPlaga == null ? 'Sin dato' : `${Math.round(fracPlaga * 100)} % de sus meses`),
      variable('nativas', 'Proporción de especies nativas', R.nativas.peso, porCortes(nat, R.nativas),
        nat == null ? 'Sin especies silvestres registradas' : `${Math.round(nat * 100)} %`),
      variable('aplicacionCosecha', 'Aplicaciones en meses de cosecha', R.aplicacionCosecha.peso,
        tot && f.cultivos.length ? porCortes(pre.length, R.aplicacionCosecha) : null,
        tot && f.cultivos.length ? (pre.length ? pre.map((m) => M[m]).join(', ') : 'Ninguna') : 'Sin dato'),
    ];
    const recs = [];
    if (fracAmplio > 0 && fracPlaga > 0) recs.push('Preferir productos selectivos o biológicos en los meses de plaga para proteger a los enemigos naturales.');
    if (nat != null && nat < 0.5) recs.push('Aumentar la proporción de especies nativas en cercas y bordes.');
    if (pre.length) recs.push(`Hay aplicaciones en meses de cosecha (${pre.map((m) => M[m]).join(', ')}). Verificar el intervalo de seguridad de cada producto.`);
    return { variables, recs };
  },
};
