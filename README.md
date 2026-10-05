# BioG.A.P. Biodiversity Manager

Prototipo de evaluación de riesgo ambiental de la finca, orientado a exportadores certificados en GLOBALG.A.P. IFA v6. Proyecto de innovación del curso CADS, Zamorano.

Nació del caso *Spathodea campanulata* y las abejas nativas sin aguijón. De ahí se amplió a cinco temas ambientales de la finca.

> **Estado:** prototipo. Las fórmulas y los pesos son ilustrativos y están **por calibrar**. Los datos de la finca demostrativa son ficticios.

## La idea central: cada finca es un caso

Cada finca evaluada y exportada queda como un **caso**: su situación, su riesgo y lo que se hizo para corregirlo. Mientras más casos reales se acumulan, más útil se vuelve la app:

> *"Tu finca se parece a estas 3. Esto es lo que les funcionó."*

Eso es la **memoria de casos**, y es el valor que crece con el uso. Desde la v0.6 funciona (Etapa 1): pestaña **Casos** y panel **Fincas parecidas** en el dashboard. Un competidor puede copiar las fórmulas, pero no los casos acumulados. Por eso el formato de exportación (`.json`) está pensado desde ya como la unidad de datos de ese aprendizaje.

## Qué hace

1. **Cuestionario** de la finca en seis pasos: finca, cultivos, especies, prácticas, calendarios y certificación.
2. **Dashboard** con el índice ambiental global, el riesgo (0-100) por módulo, la presión por mes, el cruce de calendarios, un **simulador** ("¿qué pasa si cambio esta práctica?") y un **plan de acción** con casillas.
3. **Plantillas** de registro (mecanización y personalizada; riego y fertilización tienen su pestaña) comparadas con el objetivo de la finca.
4. **Panel GLOBALG.A.P.** con el margen de Minor Musts y las no conformidades abiertas.
5. **Ajustes** para activar o desactivar módulos y mover los umbrales de riesgo. Tema claro, oscuro o del sistema.
6. **Guardar y cargar**: autoguardado en el navegador y exportar o importar la finca como archivo `.json`.
7. **Memoria de casos (k-NN)**: compara tu finca con los casos guardados por cultivo, riego, pendiente, distancia al agua, especies nativas, meses de coincidencia y riesgo por módulo. Muestra las 3 más parecidas, en qué se parecen, qué hicieron y cómo les fue (no conformidades GLOBALG.A.P. y lámina aplicada/requerida, antes y después). Trae 9 casos de **ejemplo** (ficticios, marcados así en pantalla) y permite guardar tu finca como caso.
8. **Plan de fertilización**: cada aplicación con producto (grado N-P₂O₅-K₂O), dosis en kg/ha o qq/mz, mes y método. Calcula N, P₂O₅ y K₂O frente al objetivo, N por mes frente a la lluvia, efectos en Suelo y Agua; se escribe a mano o se carga una plantilla Excel/CSV.
9. **Riego por goteo**: calculadora y validador. El productor sube su Excel o CSV (o escribe sus datos), la app lee los valores por sus etiquetas, recalcula el diseño y revisa cada dato contra FAO-56. Ver [docs/catalogo-riego.md](docs/catalogo-riego.md).

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
│  ├─ rubrica.js        puntaje 0/50/100 por cortes y promedio ponderado
│  ├─ engine.js         motor: rúbrica aditiva por módulo
│  ├─ state.js          finca de ejemplo, finca vacía y plantillas
│  ├─ storage.js        exportar/importar JSON con validación y autoguardado
│  └─ utils.js
├─ modules/             un archivo por módulo de riesgo
│  ├─ polinizadores.js  fertilizacion.js  agua.js  suelo.js  troficas.js
│  └─ index.js          registro de módulos
├─ casos/              memoria de casos (Etapa 1 del plan de ML)
│  ├─ perfil.js         rasgos comparables de una finca
│  ├─ memoria.js        similitud, k-NN y resumen del resultado
│  └─ ejemplos.js       9 casos de ejemplo (ficticios)
├─ fert/               plan de fertilización: catálogo, nutrientes, costos y hallazgos
├─ riego/              módulo de riego por goteo
│  ├─ referencias.js    valores con fuente (FAO-56, CIMMYT)
│  ├─ calculo.js        fórmulas del diseño agronómico
│  ├─ reglas.js         validación: cada alerta con su porqué y su fuente
│  ├─ xlsx.js, csv.js   lectura de archivos sin dependencias externas
│  └─ extraer.js        de las celdas a los datos, por etiquetas
└─ ui/                  vistas: dashboard, cuestionario, plantillas, riego, casos, ajustes y gráficos
docs/formulas.md        fórmula, supuestos y estado de calibración de cada módulo
docs/catalogo-riego.md  fórmulas, rangos y reglas del módulo de riego
docs/adr/               decisiones de diseño
tests/                  pruebas del motor
```

## Cómo trabajar con varios asistentes

Este repositorio es la **única versión oficial**. Cualquier asistente (Claude en el chat o Claude Code) trabaja sobre el repo, no sobre copias sueltas:

1. Pídele que clone `diegoguevara912-pixel/biogap` y trabaje en una rama nueva (por ejemplo, `mejoras-diseno`).
2. Que suba esa rama y deje las pruebas pasando (`npm test`).
3. Luego se revisa y se une a `main`. GitHub Pages publica `main` sola.

## Cómo agregar un módulo

1. Crea `src/modules/<nombre>.js` con `{ id, nombre, ifa, evaluar(f, ctx, helpers) }`. La función devuelve `{ P, E, V, req, recs, driver, formula }`, con P, E y V entre 0 y 1.
2. Regístralo en `src/modules/index.js`.
3. Agrega su `id` a `modulosActivos` en `src/core/config.js`.
4. Documenta la fórmula en `docs/formulas.md` y agrega una prueba.

## Hoja de ruta

- [x] v0.2: código dividido en módulos, configuración central y pruebas de regresión
- [x] v0.3: guardar y cargar fincas (JSON) y ajustes por finca (módulos activos y umbrales)
- [x] v0.4: módulo de riego (calculadora, validador e importador de Excel/CSV), validado con el diseño agronómico del Lab de Riego
- [x] v0.5: diseño mejorado (índice global, simulador, plan de acción, presión por mes, tema oscuro, edición en el cuestionario, respaldo en texto)
- [ ] Guardar los datos de riego con la finca (hoy se pierden al recargar la página)
- [ ] Diseño hidráulico y cubicación de reservorio
- [ ] Más cultivos en `src/riego/referencias.js` (hoy solo maíz)
- [ ] Perfiles de configuración por cultivo o exportador
- [ ] Calibrar pesos con los datos de las tesis de Zamorano, cuando estén disponibles
- [ ] **Memoria de casos (razonamiento basado en casos, k-NN):** sugerir acciones a partir de fincas parecidas ya evaluadas
- [ ] Modelo de aprendizaje automático entrenado, **solo** cuando haya decenas de fincas reales registradas

> Sobre el aprendizaje automático: con pocos casos, un modelo entrenado no es confiable. Primero va la memoria de casos, que funciona con pocos datos y es explicable.

## Fuentes

El caso de origen se apoya en Osorio (2025), Kuniyoshi (2025) y Tejeda et al. (2025), del proyecto CADS. La app no usa todavía datos de esas tesis. Las secciones de IFA v6 citadas en el panel deben verificarse con el checklist oficial.
