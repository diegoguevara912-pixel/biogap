// Módulo: Fertilización (nitrógeno y escorrentía).
import { inter } from '../core/utils.js';
import { variable, porCortes } from '../core/rubrica.js';

export default {
  id: 'fert',
  nombre: 'Fertilización',
  ifa: '29 Fertilizantes',
  evaluar(f, ctx, { cfg }) {
    const R = cfg.rubrica.fert;
    const ratio = f.nObjetivo > 0 ? f.nAplicado / f.nObjetivo : null;
    const ovr = inter(f.fertMeses, f.lluviaMeses).length;
    const fracLluvia = f.fertMeses.length && f.lluviaMeses.length ? ovr / f.fertMeses.length : null;
    const variables = [
      variable('dosis', 'Dosis de N frente al objetivo', R.dosis.peso, porCortes(ratio, R.dosis),
        ratio == null ? (f.nAplicado > 0 ? 'Sin objetivo definido' : 'Sin dato') : `${f.nAplicado} de ${f.nObjetivo} kg N/ha (${Math.round(ratio * 100)} %)`),
      variable('lluvia', 'Fertilización en meses de lluvia fuerte', R.lluvia.peso, porCortes(fracLluvia, R.lluvia),
        fracLluvia == null ? 'Sin dato' : `${ovr} de ${f.fertMeses.length} mes(es)`),
      variable('pendiente', 'Pendiente (arrastre por escorrentía)', R.pendiente.peso, cfg.categorias.pendiente[f.pendiente], f.pendiente),
      variable('distancia', 'Distancia al cuerpo de agua', R.distancia.peso, porCortes(f.distAgua, R.distancia), `${f.distAgua} m`),
    ];
    const recs = [];
    if (ratio > 1) recs.push(`La dosis supera el objetivo de la finca en ${Math.round((ratio - 1) * 100)} %. Ajustar hacia ${f.nObjetivo} kg N/ha.`);
    if (ovr) recs.push('Evitar fertilizar en meses de lluvia fuerte para reducir la escorrentía.');
    if (f.nAplicado > 0 && !f.nObjetivo) recs.push('Definir un objetivo de nitrógeno con tu agrónomo para poder comparar la dosis.');
    return { variables, recs };
  },
};
