// Rúbrica aditiva: cada módulo describe sus variables y aquí se puntúan.
// Riesgo = Σ peso·puntaje / Σ peso (solo variables con dato). Confianza = peso con dato / peso total.

// Estado de la evidencia de cada variable (se muestra en pantalla).
export const ESTADOS = {
  verificado: 'Verificado',
  secundario: 'Fuente secundaria',
  'no verificado': 'No verificado',
  'criterio propio': 'Criterio propio',
};

// Puntaje 0/50/100 a partir de cortes. Valor nulo → null (sin dato).
export function porCortes(x, { cortes, inverso = false }) {
  if (x == null || !Number.isFinite(x)) return null;
  const [a, b] = cortes;
  if (inverso) return x >= a ? 0 : x >= b ? 50 : 100;
  return x <= a ? 0 : x <= b ? 50 : 100;
}

// Describe una variable. valor = texto que ve el usuario; puntaje = 0, 50, 100 o null.
export const variable = (id, nombre, peso, puntaje, valor, estado = 'criterio propio', fuente = '') =>
  ({ id, nombre, peso, puntaje, valor, estado, fuente });

export function puntuar(vars) {
  const total = vars.reduce((s, v) => s + v.peso, 0);
  const con = vars.filter((v) => v.puntaje != null);
  const peso = con.reduce((s, v) => s + v.peso, 0);
  const score = peso ? Math.round(con.reduce((s, v) => s + v.peso * v.puntaje, 0) / peso) : 0;
  // Causa principal: la variable que más aporta al riesgo.
  const top = [...con].sort((a, b) => b.peso * b.puntaje - a.peso * a.puntaje)[0];
  return {
    score,
    conf: total ? peso / total : 0,
    driver: top && top.puntaje > 0 ? top.nombre : 'Sin causa dominante',
  };
}
