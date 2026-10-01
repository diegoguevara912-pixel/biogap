# BioG.A.P. Biodiversity Manager

Prototipo de evaluación de riesgo ambiental de la finca, orientado a exportadores certificados en GLOBALG.A.P. IFA v6. Proyecto de innovación del curso CADS, Zamorano.

Nació del caso *Spathodea campanulata* y las abejas nativas sin aguijón. De ahí se amplió a cinco temas ambientales de la finca.

> **Estado:** prototipo. Las fórmulas y los pesos son ilustrativos y están **por calibrar**. Los datos de la finca demostrativa son ficticios.

## Qué hace

1. **Cuestionario** de la finca en seis pasos: finca, cultivos, especies, prácticas, calendarios y certificación.
2. **Dashboard** con el índice de riesgo (0-100) por módulo, el cruce de calendarios y las recomendaciones.
3. **Plantillas** de registro (fertilización, riego, mecanización y personalizada) comparadas con el objetivo de la finca.
4. **Panel GLOBALG.A.P.** con el margen de Minor Musts y las no conformidades abiertas.
5. **Ajustes** para activar o desactivar módulos y mover los umbrales de riesgo.
6. **Guardar y cargar**: autoguardado en el navegador y exportar o importar la finca como archivo `.json`.

Los datos de la finca se guardan solo en el navegador del usuario. No se envían a ningún servidor.

## Cómo verla

- **En línea:** se publica con GitHub Pages desde la rama `main`.
- **En local:** se necesita un servidor, porque los módulos de JavaScript no cargan con `file://`.
  ```bash
  python3 -m http.server 8000   # luego abrir http://localhost:8000
  ```
- **Pruebas** (Node 20 o superior): `npm test`

## Estructura

```
index.html              estructura de la página
src/
├─ app.js               punto de entrada: renderizado y eventos
├─ styles.css           tema claro/oscuro y componentes
├─ core/
│  ├─ config.js         ← PERSONALIZACIÓN: módulos activos, umbrales y factores
│  ├─ engine.js         motor: Riesgo = 100 × P × E × V
│  ├─ state.js          finca de ejemplo, finca vacía y plantillas
│  ├─ storage.js        exportar/importar JSON con validación y autoguardado
│  └─ utils.js
├─ modules/             un archivo por módulo de riesgo
│  ├─ polinizadores.js  fertilizacion.js  agua.js  suelo.js  troficas.js
│  └─ index.js          registro de módulos
└─ ui/                  vistas: dashboard, cuestionario, plantillas, ajustes y gráficos
docs/formulas.md        fórmula, supuestos y estado de calibración de cada módulo
tests/                  pruebas del motor
```

## Cómo agregar un módulo

1. Crea `src/modules/<nombre>.js` con `{ id, nombre, ifa, evaluar(f, ctx, helpers) }`. La función devuelve `{ P, E, V, req, recs, driver, formula }`, con P, E y V entre 0 y 1.
2. Regístralo en `src/modules/index.js`.
3. Agrega su `id` a `modulosActivos` en `src/core/config.js`.
4. Documenta la fórmula en `docs/formulas.md` y agrega una prueba.

## Hoja de ruta

- [x] v0.2: código dividido en módulos, configuración central y pruebas de regresión
- [x] v0.3: guardar y cargar fincas (JSON) y ajustes por finca (módulos activos y umbrales)
- [ ] Perfiles de configuración por cultivo o exportador
- [ ] Calibrar pesos con los datos de las tesis de Zamorano, cuando estén disponibles
- [ ] **Memoria de casos (razonamiento basado en casos, k-NN):** sugerir acciones a partir de fincas parecidas ya evaluadas
- [ ] Modelo de aprendizaje automático entrenado, **solo** cuando haya decenas de fincas reales registradas

> Sobre el aprendizaje automático: con pocos casos, un modelo entrenado no es confiable. Primero va la memoria de casos, que funciona con pocos datos y es explicable.

## Fuentes

El caso de origen se apoya en Osorio (2025), Kuniyoshi (2025) y Tejeda et al. (2025), del proyecto CADS. La app no usa todavía datos de esas tesis. Las secciones de IFA v6 citadas en el panel deben verificarse con el checklist oficial.
