// Configuración del motor de riesgo.
// Este archivo es el punto de personalización: activar o desactivar módulos,
// mover umbrales de nivel y ajustar factores, sin tocar las fórmulas.
// Los pesos y cortes son criterio propio salvo que se indique la fuente; están por calibrar con datos reales.

export const CONFIG = {
  // Módulos activos, en el orden en que aparecen en el dashboard.
  modulosActivos: ['poli', 'fert', 'agua', 'suelo', 'troficas'],

  // Peso de cada módulo en el índice ambiental global (ilustrativos, por calibrar).
  // Si se desactivan módulos, el índice se recalcula con los pesos de los activos.
  pesos: { poli: 0.25, fert: 0.2, agua: 0.2, suelo: 0.15, troficas: 0.2 },

  // Umbrales del índice 0-100.
  niveles: { alto: 67, medio: 34 },

  // RÚBRICA ADITIVA por módulo. Cada variable tiene un peso (suman 100 por módulo) y un
  // puntaje de 0, 50 o 100 según sus cortes. Riesgo del módulo = Σ peso·puntaje / Σ peso,
  // solo con las variables que tienen dato. Confianza = peso con dato / peso total
  // (un dato faltante baja la confianza, no cuenta como riesgo cero).
  // Cortes [a, b]: valor ≤ a → 0; ≤ b → 50; mayor → 100. Con "inverso": valor ≥ a → 0; ≥ b → 50; menor → 100.
  // Salvo que diga otra cosa, pesos y cortes son CRITERIO PROPIO, por validar con especialistas.
  rubrica: {
    poli: {
      coincidencia: { peso: 25, cortes: [0, 1] }, // meses con aplicación no biológica en floración visitada
      claseEnFloracion: { peso: 15 }, // producto más agresivo aplicado en floración
      especiesRiesgo: { peso: 10, cortes: [0, 2] }, // meses de floración de especies de riesgo
      abundanciaRiesgo: { peso: 15, cortes: [0, 1000] }, // m³ de copa de especies de riesgo (Osorio 2025: la mayoría ≤ 1 000 m³)
      abundanciaConteo: { cortes: [0, 1] }, // sin medidas de copa: n.º de árboles de riesgo
      alternativas: { peso: 15, cortes: [0, 0.5] }, // fracción de meses de floración de riesgo sin otra floración segura
      aguaSeca: { peso: 10, cortes: [0, 0.5] }, // fracción de meses de floración de riesgo sin lluvia
      foliarEnFloracion: { peso: 5 }, // aplicaciones foliares (fertilizantes) en floración visitada
      abejasNativas: { peso: 5 }, // receptor: abejas nativas registradas
    },
    fert: {
      dosis: { peso: 30, cortes: [1, 1.2] }, // N aplicado / N objetivo
      lluvia: { peso: 20, cortes: [0, 0.5] }, // fracción del N (o de las fertilizaciones) en meses de lluvia fuerte
      fraccionamiento: { peso: 10, cortes: [0.5, 0.75] }, // mayor fracción del N aplicada en un solo mes (plan)
      metodo: { peso: 10, cortes: [0, 0.5] }, // fracción del N como urea al voleo sin incorporar (plan)
      fosforo: { peso: 10, cortes: [1, 1.2] }, // P2O5 aplicado / P2O5 objetivo (plan)
      pendiente: { peso: 10 },
      distancia: { peso: 10, cortes: [100, 30], inverso: true }, // m al cuerpo de agua
    },
    agua: {
      sistema: { peso: 25 }, // sistema de riego según su eficiencia de aplicación (FAO)
      distancia: { peso: 20, cortes: [100, 30], inverso: true }, // m al cuerpo de agua
      proporcionProductiva: { peso: 15, cortes: [0.5, 0.8] }, // área productiva / área total
      disenoRiego: { peso: 30 }, // validación del módulo Riego contra FAO-56
      fertirriegoEscorrentia: { peso: 10 }, // fertirriego con un diseño que escurre (solo si hay fertirriego)
    },
    suelo: {
      sueloDesnudoLluvia: { peso: 35, cortes: [0, 1] }, // meses de suelo desnudo con lluvia fuerte
      labranza: { peso: 25 },
      pendiente: { peso: 25 },
      fertSueloDesnudo: { peso: 15, cortes: [0, 0.25] }, // fracción de N+P2O5 aplicada sobre suelo desnudo en lluvias (plan)
    },
    troficas: {
      amplioEspectro: { peso: 35, cortes: [0, 0.5] }, // fracción de productos de amplio espectro
      amplioEnPlaga: { peso: 25, cortes: [0, 0.5] }, // fracción de meses de amplio espectro con plaga presente
      nativas: { peso: 25, cortes: [0.6, 0.3], inverso: true }, // fracción de especies silvestres nativas
      aplicacionCosecha: { peso: 15, cortes: [0, 0] }, // meses con aplicación en cosecha
    },
  },
  // Puntajes por categoría (0 = menor riesgo, 100 = mayor).
  categorias: {
    pendiente: { plana: 0, ondulada: 50, fuerte: 100 },
    labranza: { cero: 0, minima: 50, convencional: 100 },
    // Eficiencia de aplicación FAO (TM4, Tabla 8): goteo 90 %, aspersión 75 %, superficie 60 %.
    sistemaRiego: { goteo: 0, aspersion: 50, gravedad: 100, ninguno: 0 },
    clasePlaguicida: { ninguno: 0, biologico: 0, selectivo: 50, amplio: 100 },
  },

  // Reglas GLOBALG.A.P. IFA v6 usadas por el panel de certificación.
  globalgap: { margenMinorMusts: 0.05, diasCierreNC: 28 },

  // Memoria de casos (k-NN). Criterio propio, por calibrar con casos reales (Etapa 3).
  casos: {
    k: 3, // fincas parecidas que se muestran
    // Peso de cada rasgo del perfil (suman 1). "scores" se reparte entre los módulos activos.
    pesos: { cultivo: 0.2, riego: 0.1, pendiente: 0.1, distAgua: 0.1, propNativas: 0.1, mesesCoincidencia: 0.1, scores: 0.3 },
    topeDistAgua: 500, // m; más allá, la distancia ya no distingue fincas
    umbralParecido: 0.1, // distancia de un rasgo hasta la que se considera "parecido"
    coberturaMinima: 0.5, // fracción del peso que debe poder compararse
  },

  // Nube (Etapa 2 de la memoria de casos): proyecto Supabase "biogap".
  // La clave publicable es pública por diseño; el acceso lo limita la seguridad por filas (RLS) de la base.
  // NUNCA pongas aquí la clave service_role. Con url o clave vacías, la app funciona solo en local.
  nube: {
    url: 'https://kfybqlknlkxrqphwopfx.supabase.co',
    clavePublicable: 'sb_publishable_GZY64ytTNLaL9898VrIGKA_P0ZdFOXb',
    maxCasos: 500, // casos de la comunidad que se descargan
  },
};
