// Reglas de validación del diseño de riego. Cada alerta explica qué pasó, por qué importa y su fuente.
// nivel: 'error' (dato imposible o fórmula mal), 'advertencia' (revisar), 'criterio' (decisión a justificar), 'ok'.

import { EFICIENCIA_GOTEO, FUENTES } from './referencias.js';

const f1 = (x) => (Math.round(x * 10) / 10).toLocaleString('es-HN');
const f2 = (x) => (Math.round(x * 100) / 100).toLocaleString('es-HN');
const cerca = (a, b, tol = 0.02) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-9);

function alerta(id, nivel, titulo, detalle, fuente = null) {
  return { id, nivel, titulo, detalle, fuente: fuente ? FUENTES[fuente] : null };
}

// r = resultado de calcular(); declarados = valores que el archivo trae calculados (opcional).
export function validar(r, declarados = {}) {
  const d = r.datos;
  const out = [];
  const ref = r.referencia;

  // 1. Escorrentía
  if (r.pp && r.infiltracionMin) {
    out.push(r.pp <= r.infiltracionMin
      ? alerta('escorrentia', 'ok', 'Sin riesgo de escorrentía', `El goteo aplica ${f1(r.pp)} mm/h y el suelo más lento absorbe ${f1(r.infiltracionMin)} mm/h.`)
      : alerta('escorrentia', 'error', 'El goteo aplica más agua de la que el suelo absorbe',
        `Se aplican ${f1(r.pp)} mm/h, pero el suelo más lento solo infiltra ${f1(r.infiltracionMin)} mm/h. El exceso escurre y se pierde, con arrastre de suelo y fertilizante. Reduce el caudal del emisor o aumenta su espaciamiento.`, 'cimmyt2012'));
  }

  // 2. Horas disponibles
  if (r.horasUsadas && d.horasLaborales) {
    const margen = 1 - r.horasUsadas / d.horasLaborales;
    out.push(margen < 0
      ? alerta('horas', 'error', 'No alcanzan las horas para regar ni un sector completo',
        `Un sector necesita ${f2(r.tiempoRiego)} h y solo hay ${d.horasLaborales} h disponibles. Aumenta el caudal por sector o las horas de operación.`)
      : margen < 0.05
      ? alerta('horas', 'advertencia', 'Las horas de riego están al límite',
        `${r.sectores} sectores × ${f2(r.tiempoRiego)} h = ${f2(r.horasUsadas)} h de ${d.horasLaborales} h disponibles (margen de ${Math.round(margen * 100)} %). Cualquier retraso o corte de energía deja un sector sin regar en el día pico.`)
      : alerta('horas', 'ok', 'Alcanzan las horas para regar todos los sectores', `${f2(r.horasUsadas)} h de ${d.horasLaborales} h disponibles.`));
  }

  // 3. Frecuencia segura (lámina aprovechable en la zona radicular, con p ajustada)
  if (r.laaLimitante && r.etc) {
    const necesita = r.etc * d.frecuenciaDias;
    out.push(necesita <= r.laaLimitante
      ? alerta('frecuencia', 'ok', 'La frecuencia de riego no causa estrés',
        `Con riego cada ${d.frecuenciaDias} día(s) se gastan ${f1(necesita)} mm; la ${r.seccionLimitante} guarda ${f1(r.laaLimitante)} mm aprovechables. Intervalo máximo: ${r.intervaloMax} día(s).`, 'fao56_t22')
      : alerta('frecuencia', 'error', 'Con esta frecuencia el cultivo entra en estrés',
        r.intervaloMax >= 1
          ? `Entre riegos se gastan ${f1(necesita)} mm, pero la ${r.seccionLimitante} solo guarda ${f1(r.laaLimitante)} mm aprovechables. Riega al menos cada ${r.intervaloMax} día(s).`
          : `El cultivo gasta ${f1(r.etc)} mm al día y la ${r.seccionLimitante} solo guarda ${f1(r.laaLimitante)} mm aprovechables: ni con riego diario alcanza. Divide el riego en varios pulsos al día o revisa los datos de suelo.`, 'fao56_t22'));
  }

  // 4. Fracción p ajustada por ETc
  if (r.pAjustada !== null && d.p !== null && Math.abs(d.p - r.pAjustada) > 0.05) {
    out.push(alerta('p', 'advertencia', 'La fracción p no está ajustada a la demanda del cultivo',
      `Se usa p = ${f2(d.p)}, pero con ETc de ${f2(r.etc)} mm/día corresponde ${f2(r.pAjustada)}. Sin el ajuste, la lámina aprovechable se sobreestima en ${Math.round((d.p / r.pAjustada - 1) * 100)} %.`, 'fao56_t22'));
  }

  // 5. Kc dentro de la tolerancia
  if (ref) {
    for (const [k, campo, nombre] of [['ini', 'kcIni', 'inicial'], ['med', 'kcMed', 'medio'], ['fin', 'kcFin', 'final']]) {
      const v = d[campo], R = ref.kc[k];
      if (v !== null && (v < R.min || v > R.max)) {
        out.push(alerta(`kc-${k}`, 'advertencia', `Kc ${nombre} fuera del rango esperado`,
          `Se usa ${f2(v)}; para ${ref.nombre} la referencia es ${f2(R.valor)} (tolerancia ${f2(R.min)}–${f2(R.max)}).${R.nota ? ' ' + R.nota + '.' : ''}`, R.fuente));
      }
    }
    // 6. Duración del ciclo
    if (r.cicloDias && (r.cicloDias < ref.etapas.totalMin || r.cicloDias > ref.etapas.totalMax)) {
      out.push(alerta('ciclo', 'advertencia', 'Ciclo atípico para el cultivo',
        `El ciclo suma ${r.cicloDias} días; FAO-56 reporta entre ${ref.etapas.totalMin} y ${ref.etapas.totalMax} para ${ref.nombre}.`, ref.etapas.fuente));
    }
    // 7. Profundidad radicular: criterio, no error
    if (d.profRaiz && d.profRaiz < ref.raiz.min) {
      out.push(alerta('raiz', 'criterio', 'Profundidad radicular menor que la de referencia',
        `Se usan ${f2(d.profRaiz)} m; FAO-56 da ${ref.raiz.min}–${ref.raiz.max} m como máximo para ${ref.nombre}. En goteo se suele usar una profundidad efectiva menor: es válido si se justifica.`, ref.raiz.fuente));
    }
  } else if (d.cultivo) {
    out.push(alerta('cultivo', 'criterio', 'Cultivo sin referencia en la app todavía', `No hay valores de referencia para "${d.cultivo}". Se calcula con los datos dados, sin comparar Kc ni etapas.`));
  }

  // 8. Eficiencia de goteo
  if (d.eficiencia && (d.eficiencia < EFICIENCIA_GOTEO.min || d.eficiencia > EFICIENCIA_GOTEO.max)) {
    out.push(alerta('eficiencia', 'advertencia', 'Eficiencia poco común para goteo',
      `Se usa ${f2(d.eficiencia)}; lo habitual en goteo es ${EFICIENCIA_GOTEO.min}–${EFICIENCIA_GOTEO.max}.`, EFICIENCIA_GOTEO.fuente));
  }

  // 9. Escala física (errores de unidad)
  if (d.alturaPlanta && d.alturaPlanta > 10) {
    out.push(alerta('altura', 'error', '¿Altura de la planta en cm o en m?',
      `Dice ${d.alturaPlanta} m. Ningún cultivo mide eso: probablemente son ${f2(d.alturaPlanta / 100)} m (el dato estaba en cm).`, ref ? 'fao56_t12' : null));
  }
  if (d.profRaiz && d.profRaiz > 5) {
    out.push(alerta('raiz-escala', 'error', '¿Profundidad radicular en cm o en m?', `Dice ${d.profRaiz} m; probablemente son ${f2(d.profRaiz / 100)} m.`));
  }
  if (d.eficiencia && d.eficiencia > 1) {
    out.push(alerta('eficiencia-escala', 'error', 'La eficiencia debe ir como fracción', `Dice ${d.eficiencia}; si es un porcentaje, son ${f2(d.eficiencia / 100)}.`));
  }

  // 10. Valores que el archivo trae calculados y no cuadran con el recálculo
  const comparar = (clave, nombre, calc, unidad, decimales = 2) => {
    const dec = declarados[clave];
    if (typeof dec !== 'number' || typeof calc !== 'number') return;
    if (!cerca(dec, calc)) {
      out.push(alerta(`dif-${clave}`, 'error', `${nombre} no cuadra con sus datos`,
        `El archivo dice ${dec.toFixed(decimales)} ${unidad}; con sus propios datos da ${calc.toFixed(decimales)} ${unidad}.`));
    }
  };
  comparar('etc', 'La ETc', r.etc, 'mm/día');
  comparar('pp', 'La precipitación horaria', r.pp, 'mm/h');
  comparar('tiempoRiego', 'El tiempo de riego', r.tiempoRiego, 'h');
  comparar('caudalHa', 'El caudal por hectárea', r.caudalHa, 'm³/h/ha');
  comparar('caudalSector', 'El caudal por sector', declarados.sectores ? r.caudalHa * (d.areaLote / declarados.sectores) : r.caudalSector, 'm³/h', 1);

  // 11. Lámina "en la zona radicular" que en realidad está por metro de suelo
  if (Array.isArray(declarados.laa) && d.profRaiz && d.profRaiz !== 1) {
    const malas = r.suelo.filter((s, i) => typeof declarados.laa[i] === 'number' && s.laaPorMetro && cerca(declarados.laa[i], s.laaPorMetro) && !cerca(declarados.laa[i], s.laaSinAjuste));
    if (malas.length) {
      out.push(alerta('laa-metro', 'error', 'La lámina aprovechable no considera la profundidad de raíces',
        `El archivo la calcula por metro de suelo, no en los ${f2(d.profRaiz)} m de raíces. Por ejemplo, en la ${malas.at(-1).nombre} dice ${f1(malas.at(-1).laaPorMetro)} mm, pero en la zona radicular son ${f1(malas.at(-1).laaSinAjuste)} mm. Esto hace creer que el cultivo aguanta más días sin riego.`, 'fao56_t22'));
    }
  }

  // 12. Números escritos a mano dentro de fórmulas
  for (const h of declarados.numerosFijos || []) {
    out.push(alerta(`fijo-${h.celda}`, 'advertencia', `Número escrito a mano en ${h.celda}`,
      `La fórmula ${h.formula} usa ${h.numero} directamente${h.coincide ? `, que es ${h.coincide}` : ''}. Si ese dato cambia, este resultado queda mal sin aviso: conviene referenciar la celda del dato.`));
  }

  // 13. Datos completados con referencia
  if (r.usados.length) {
    out.push(alerta('referencias', 'criterio', 'Datos completados con valores de referencia',
      `No venían en los datos y se usó la referencia: ${r.usados.join(', ')}. Si tienes el valor medido, ingrésalo.`));
  }

  const orden = { error: 0, advertencia: 1, criterio: 2, ok: 3 };
  return out.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
}
