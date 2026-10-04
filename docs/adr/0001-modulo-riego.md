# ADR-0001: Módulo de riego (calculadora, validador e importador)

**Estado:** Aceptado · **Fecha:** 2026-10-03 · **Decide:** Diego Guevara

## Contexto

BioG.A.P. debe recibir datos de riego en el formato que ya usa el productor (por ejemplo, un Excel como la hoja de diseño agronómico del Lab de Riego), resolver los cálculos y detectar datos dudosos, sin IA de pago y sin servidor.

El problema tiene una contradicción de fondo: **aceptar cualquier formato** (flexibilidad) choca con **dar resultados confiables** (rigor). Un importador que acepta todo sin control propaga errores; uno estricto obliga al usuario a reformatear sus archivos y lo pierde.

**Resolución (principio de separación):** dividir el trabajo en dos etapas con reglas opuestas y una confirmación humana en medio.

1. **Extraer** con tolerancia: buscar los datos por sus etiquetas, en cualquier hoja y posición.
2. **Confirmar:** el usuario ve qué se detectó, de qué celda salió y qué se completó con valores de referencia.
3. **Validar** con rigor: recalcular todo con fórmulas propias y comparar con reglas con fuente.

## Flujo del usuario

| | Antes (revisión manual) | Después (con el módulo) |
| --- | --- | --- |
| Pasos | Abrir el Excel, rastrear fórmulas celda por celda, recalcular, buscar rangos en FAO-56, redactar hallazgos | Subir el archivo → revisar los datos detectados → leer las alertas |
| Tiempo | Del orden de una hora por archivo, con experiencia técnica | Minutos, sin experiencia en fórmulas |
| Error típico | Pasar por alto un error (el de la lámina aprovechable lo encontró la revisión, no la primera lectura) | Las mismas reglas corren siempre, en todos los archivos |

## Opciones consideradas para leer Excel

| Opción | Complejidad | Riesgo | Decisión |
| --- | --- | --- | --- |
| A. SheetJS 0.18.5 (npm) | Baja | Vulnerabilidades conocidas al leer archivos manipulados (contaminación de prototipo y ReDoS, corregidas en versiones que no están en npm) | Descartada |
| B. Pedir CSV al usuario | Baja | Pierde las fórmulas (no se detectan números escritos a mano) y agrega un paso | Solo como alternativa |
| C. Lector propio de .xlsx (zip + XML) con APIs nativas del navegador | Media | Código propio que mantener; limitado a valores, fórmulas y textos | **Elegida** |

Un `.xlsx` es un zip de archivos XML. El navegador ya trae `DecompressionStream` para descomprimirlo, así que el lector no necesita dependencias. Lee solo las hojas (ignora imágenes), con límites de tamaño para evitar archivos que se expanden de forma desmedida.

## Decisión

- `src/riego/referencias.js`: valores de referencia con fuente (FAO-56 para maíz; tabla de texturas de CIMMYT citada en la hoja del Lab de Riego).
- `src/riego/calculo.js`: funciones puras, del dato al resultado.
- `src/riego/reglas.js`: reglas de validación; cada alerta dice qué pasó, por qué importa y su fuente.
- `src/riego/xlsx.js` y `src/riego/csv.js`: lectura de archivos a una cuadrícula de celdas.
- `src/riego/extraer.js`: de la cuadrícula a los datos, por etiquetas y sinónimos, guardando la celda de origen.
- `src/ui/riego.js`: vista con datos editables, resultados y alertas.

## Consecuencias

- **Más fácil:** sumar cultivos (una entrada en `referencias.js`) y reglas (una función en `reglas.js`). Cada archivo validado alimenta la memoria de casos.
- **Más difícil:** los archivos con etiquetas muy distintas no se reconocen solos; el usuario completa los datos a mano. La lista de sinónimos crece con cada formato nuevo.
- **A revisar:** la fórmula de densidad de emisores de la hoja original multiplica dos veces por las hileras por cama; con una hilera no se nota, con dos duplica el resultado. El módulo usa la forma correcta y lo reporta.
