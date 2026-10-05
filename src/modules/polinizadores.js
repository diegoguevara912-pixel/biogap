// Módulo: Polinizadores. Origen del proyecto: abejas muertas en flores de Spathodea campanulata.
// Las variables siguen los factores que señalan Kuniyoshi (2025) y Osorio (2025):
// abundancia floral de la especie de riesgo, exposición a agroquímicos, otras especies en floración
// y disponibilidad de agua. Kuniyoshi no midió estos tres últimos: son hipótesis, y así se marcan.
import { M } from '../core/utils.js';
import { variable, porCortes } from '../core/rubrica.js';
import { FUENTES } from '../core/fuentes.js';

const K = FUENTES.kuniyoshi.corta, O = FUENTES.osorio.corta;
// Volumen de copa (Osorio 2025, Ec. 3): V = 4/3 · π · (D/2)² · (H/2), con D = diámetro de copa y H = altura de copa.
export const volumenCopa = (d, h) => (4 / 3) * Math.PI * (d / 2) ** 2 * (h / 2);

export default {
  id: 'poli',
  nombre: 'Polinizadores',
  ifa: '22 Biodiversidad · 31 MIP · 32 Fitosanitarios',
  evaluar(f, ctx, { cfg }) {
    const R = cfg.rubrica.poli, C = cfg.categorias.clasePlaguicida;
    const { atraeFlor, riesgoFlor, ov1 } = ctx;
    const hayEspecies = f.especies.length > 0;
    const hayPlag = f.plaguicidas.length > 0;
    const enFlor = f.plaguicidas.filter((p) => p.meses.some((m) => atraeFlor.includes(m)));
    const peor = enFlor.reduce((a, p) => (C[p.clase] > C[a] ? p.clase : a), 'ninguno');
    const fauna = f.especies.filter((e) => e.tipo === 'Fauna');
    const nativas = fauna.some((e) => e.origen === 'nativa');

    // Abundancia de la especie de riesgo: volumen de copa si hay medidas; si no, número de árboles.
    const riesgo = f.especies.filter((e) => e.riesgo);
    const conMedidas = riesgo.filter((e) => e.copaD > 0 && e.copaH > 0);
    const vol = conMedidas.reduce((s, e) => s + (e.cantidad || 1) * volumenCopa(e.copaD, e.copaH), 0);
    const arboles = riesgo.reduce((s, e) => s + (e.cantidad || 0), 0);
    const abund = !hayEspecies ? null : !riesgo.length ? 0 : conMedidas.length ? porCortes(vol, R.abundanciaRiesgo) : arboles ? porCortes(arboles, R.abundanciaConteo) : null;

    // Meses de floración de riesgo sin otra floración que no sea de riesgo (recurso alternativo).
    const seguras = new Set(f.especies.filter((e) => e.atrae && !e.riesgo).flatMap((e) => e.floracion));
    const sinAlt = riesgoFlor.filter((m) => !seguras.has(m));
    // Meses de floración de riesgo sin lluvia (época seca).
    const secos = f.lluviaMeses.length ? riesgoFlor.filter((m) => !f.lluviaMeses.includes(m)) : null;
    // Aplicaciones foliares (p. ej. fertilizantes) en meses de floración visitada.
    const foliar = (f.fertPlan ?? []).filter((a) => a.metodo === 'foliar' && atraeFlor.includes(a.mes));

    const variables = [
      variable('coincidencia', 'Aplicaciones en floración visitada', R.coincidencia.peso,
        hayEspecies && hayPlag ? porCortes(ov1.length, R.coincidencia) : null,
        hayEspecies && hayPlag ? `${ov1.length} mes(es)${ov1.length ? `: ${ov1.map((m) => M[m]).join(', ')}` : ''}` : 'Sin dato',
        'criterio propio', `${K} cita la exposición a agroquímicos como factor no medido en la muerte de abejas.`),
      variable('claseEnFloracion', 'Tipo de producto aplicado en floración', R.claseEnFloracion.peso,
        hayEspecies && hayPlag ? C[peor] : null,
        hayEspecies && hayPlag ? { ninguno: 'Ninguno', biologico: 'Biológico', selectivo: 'Selectivo', amplio: 'Amplio espectro' }[peor] : 'Sin dato'),
      variable('especiesRiesgo', 'Meses de floración de especies de riesgo', R.especiesRiesgo.peso,
        hayEspecies ? porCortes(riesgoFlor.length, R.especiesRiesgo) : null, hayEspecies ? `${riesgoFlor.length} mes(es)` : 'Sin dato',
        'criterio propio', `${K}: en Zamorano la floración de Spathodea se concentró de septiembre a enero, con asincronía entre árboles.`),
      variable('abundanciaRiesgo', 'Abundancia de la especie de riesgo', R.abundanciaRiesgo.peso, abund,
        !hayEspecies ? 'Sin dato' : !riesgo.length ? 'Sin especies de riesgo' : conMedidas.length ? `${Math.round(vol).toLocaleString('es-HN')} m³ de copa` : arboles ? `${arboles} árbol(es), sin medidas de copa` : 'Falta el número de árboles',
        'verificado', `${K}: relación positiva pero débil entre flores y abejas muertas (R² = 0.21, no significativa). Volumen de copa: ${O}, Ec. 3; la mayoría de copas ≤ 1 000 m³. El corte es criterio propio.`),
      { ...variable('alternativas', 'Floración de riesgo sin otras flores disponibles', R.alternativas.peso,
        porCortes(riesgoFlor.length ? sinAlt.length / riesgoFlor.length : null, R.alternativas),
        `${sinAlt.length} de ${riesgoFlor.length} mes(es)${sinAlt.length ? `: ${sinAlt.map((m) => M[m]).join(', ')}` : ''}`,
        'no verificado', `Hipótesis: ${K} señala la disponibilidad de otras especies en floración como factor no medido.`), aplica: riesgoFlor.length > 0 },
      { ...variable('aguaSeca', 'Floración de riesgo en meses secos', R.aguaSeca.peso,
        secos ? porCortes(secos.length / riesgoFlor.length, R.aguaSeca) : null,
        secos ? `${secos.length} de ${riesgoFlor.length} mes(es) sin lluvia` : 'Faltan los meses de lluvia',
        'no verificado', `Hipótesis: ${K} menciona la disponibilidad de agua y la acumulación de líquidos en la corola como posibles factores.`), aplica: riesgoFlor.length > 0 },
      { ...variable('foliarEnFloracion', 'Aplicaciones foliares en floración visitada', R.foliarEnFloracion.peso,
        foliar.length ? 100 : 0, foliar.length ? foliar.map((a) => M[a.mes]).join(', ') : 'Ninguna',
        'no verificado', `Vínculo Fertilización → Polinizadores. Hipótesis: ${K} cita la exposición a agroquímicos sin medirla.`), aplica: (f.fertPlan ?? []).length > 0 },
      variable('abejasNativas', 'Abejas nativas presentes (receptor)', R.abejasNativas.peso,
        fauna.length ? (nativas ? 100 : 50) : null,
        fauna.length ? (nativas ? 'Sí: hay más en juego' : 'No registradas') : 'Sin fauna registrada'),
    ];
    const recs = [];
    if (ov1.length) recs.push(`Mover las aplicaciones fuera de ${ov1.map((m) => M[m]).join(', ')}: coinciden con floración visitada por polinizadores.`);
    if (riesgoFlor.length) recs.push('Hay especies de riesgo para polinizadores en floración. Evaluar refugio o radio de exclusión alrededor de los árboles (método ApiRadar).');
    if (riesgo.length) recs.push(`No sembrar más individuos de la especie de riesgo; podar o controlar rebrotes reduce las flores en floración, y se puede sustituir por nativas como Tabebuia rosea o Swietenia macrophylla (${O}).`);
    if (sinAlt.length) recs.push(`Sembrar especies nativas que florezcan en ${sinAlt.map((m) => M[m]).join(', ')}, para que las abejas tengan otras flores cuando florece la especie de riesgo.`);
    if (secos?.length) recs.push('En los meses secos de floración de riesgo, ofrecer agua limpia a las abejas lejos de esos árboles (hipótesis por validar).');
    if (foliar.length) recs.push('Evitar aplicaciones foliares en meses de floración visitada.');
    if (riesgo.length && !conMedidas.length) recs.push('Medir el diámetro y la altura de copa de los árboles de riesgo para estimar su volumen de copa.');
    if (!fauna.length) recs.push('Registrar las abejas nativas que observas en la finca para afinar el cálculo.');
    return { variables, recs };
  },
};
