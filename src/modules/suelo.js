// Módulo: Suelo (labranza, pendiente y suelo desnudo en lluvias).
import { inter } from '../core/utils.js';
import { variable, porCortes } from '../core/rubrica.js';

export default {
  id: 'suelo',
  nombre: 'Suelo',
  ifa: '28 Suelo',
  evaluar(f, ctx, { cfg }) {
    const R = cfg.rubrica.suelo, K = cfg.categorias;
    const ovs = inter(f.sueloDesnudoMeses, f.lluviaMeses).length;
    const variables = [
      variable('sueloDesnudoLluvia', 'Suelo desnudo en meses de lluvia', R.sueloDesnudoLluvia.peso,
        f.lluviaMeses.length ? porCortes(ovs, R.sueloDesnudoLluvia) : null, f.lluviaMeses.length ? `${ovs} mes(es)` : 'Sin meses de lluvia'),
      variable('labranza', 'Tipo de labranza', R.labranza.peso, K.labranza[f.labranza], f.labranza),
      variable('pendiente', 'Pendiente', R.pendiente.peso, K.pendiente[f.pendiente], f.pendiente),
    ];
    const recs = [];
    if (ovs) recs.push('Cubrir el suelo en los meses de lluvia en que queda desnudo.');
    if (f.labranza === 'convencional') recs.push('Evaluar labranza mínima en lotes con pendiente.');
    return { variables, recs };
  },
};
