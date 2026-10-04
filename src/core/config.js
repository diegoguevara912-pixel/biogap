// Configuración del motor de riesgo.
// Este archivo es el punto de personalización: activar o desactivar módulos,
// mover umbrales de nivel y ajustar factores, sin tocar las fórmulas.
// TODOS los valores son ilustrativos y están por calibrar con datos reales.

export const CONFIG = {
  // Módulos activos, en el orden en que aparecen en el dashboard.
  modulosActivos: ['poli', 'fert', 'agua', 'suelo', 'troficas'],

  // Peso de cada módulo en el índice ambiental global (ilustrativos, por calibrar).
  // Si se desactivan módulos, el índice se recalcula con los pesos de los activos.
  pesos: { poli: 0.25, fert: 0.2, agua: 0.2, suelo: 0.15, troficas: 0.2 },

  // Umbrales del índice 0-100.
  niveles: { alto: 67, medio: 34 },

  // Factor de pendiente (exposición a escorrentía y erosión).
  pendiente: { plana: 0.3, ondulada: 0.6, fuerte: 1 },

  // Factor de distancia al cuerpo de agua, en metros.
  distanciaAgua: [
    { menorQue: 30, factor: 1 },
    { menorQue: 100, factor: 0.7 },
    { menorQue: Infinity, factor: 0.4 },
  ],

  // Presión por sistema de riego y por labranza.
  riego: { gravedad: 0.9, aspersion: 0.6, goteo: 0.3, ninguno: 0.1 },
  labranza: { convencional: 0.9, minima: 0.5, cero: 0.2 },

  // Reglas GLOBALG.A.P. IFA v6 usadas por el panel de certificación.
  globalgap: { margenMinorMusts: 0.05, diasCierreNC: 28 },
};
