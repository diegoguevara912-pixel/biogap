// Módulo: Polinizadores. Origen del proyecto (caso Spathodea y abejas nativas).
import { M } from '../core/utils.js';
import { variable, porCortes } from '../core/rubrica.js';

export default {
  id: 'poli',
  nombre: 'Polinizadores',
  ifa: '22 Biodiversidad · 31 MIP · 32 Fitosanitarios',
  evaluar(f, ctx, { cfg }) {
    const R = cfg.rubrica.poli, C = cfg.categorias.clasePlaguicida;
    const { atraeFlor, riesgoFlor, ov1 } = ctx;
    const hayEspecies = f.especies.length > 0;
    const hayPlag = f.plaguicidas.length > 0;
    // Producto más agresivo aplicado en meses de floración visitada.
    const enFlor = f.plaguicidas.filter((p) => p.meses.some((m) => atraeFlor.includes(m)));
    const peor = enFlor.reduce((a, p) => (C[p.clase] > C[a] ? p.clase : a), 'ninguno');
    const fauna = f.especies.filter((e) => e.tipo === 'Fauna');
    const nativas = fauna.some((e) => e.origen === 'nativa');
    const variables = [
      variable('coincidencia', 'Aplicaciones en floración visitada', R.coincidencia.peso,
        hayEspecies && hayPlag ? porCortes(ov1.length, R.coincidencia) : null,
        hayEspecies && hayPlag ? `${ov1.length} mes(es)${ov1.length ? `: ${ov1.map((m) => M[m]).join(', ')}` : ''}` : 'Sin dato'),
      variable('claseEnFloracion', 'Tipo de producto aplicado en floración', R.claseEnFloracion.peso,
        hayEspecies && hayPlag ? C[peor] : null,
        hayEspecies && hayPlag ? { ninguno: 'Ninguno', biologico: 'Biológico', selectivo: 'Selectivo', amplio: 'Amplio espectro' }[peor] : 'Sin dato'),
      variable('especiesRiesgo', 'Floración de especies de riesgo', R.especiesRiesgo.peso,
        hayEspecies ? porCortes(riesgoFlor.length, R.especiesRiesgo) : null,
        hayEspecies ? `${riesgoFlor.length} mes(es)` : 'Sin dato'),
      variable('abejasNativas', 'Abejas nativas presentes (receptor)', R.abejasNativas.peso,
        fauna.length ? (nativas ? 100 : 50) : null,
        fauna.length ? (nativas ? 'Sí: hay más en juego' : 'No registradas') : 'Sin fauna registrada'),
    ];
    const recs = [];
    if (ov1.length) recs.push(`Mover las aplicaciones fuera de ${ov1.map((m) => M[m]).join(', ')}: coinciden con floración visitada por polinizadores.`);
    if (riesgoFlor.length) recs.push('Hay especies de riesgo para polinizadores en floración. Evaluar refugio o radio de exclusión alrededor de los árboles (método ApiRadar).');
    if (!fauna.length) recs.push('Registrar las abejas nativas que observas en la finca para afinar el cálculo.');
    return { variables, recs };
  },
};
