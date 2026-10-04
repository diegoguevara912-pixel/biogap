# Catálogo de referencia: diseño agronómico de riego por goteo

Este catálogo es el **criterio propio** del módulo de riego (`src/riego/`): las fórmulas que la app recalcula y los rangos con fuente contra los que revisa los datos del usuario. No usa IA.

**Caso de origen:** hoja *Emisores – Diseño Agronómico 2025*, de Anner Almendárez (Lab de Riego, Zamorano), publicada con autorización del autor. Maíz Dicta Guayape, 12.43 ha, goteo con emisor de 1.2 L/h.

## 1. Fórmulas del diseño

Todo parte de la demanda pico del cultivo: con 8.21 mm/día de ETc, cada sector se riega 1.82 h y caben 6 sectores en la jornada.

| Variable | Fórmula | Unidad | Caso |
| --- | --- | --- | --- |
| Densidad de siembra | 10 000 / (dist. plantas × dist. surcos) × hileras | plantas/ha | 41 667 |
| ETc máxima | ETo × Kc máximo | mm/día | 8.21 |
| Marco del emisor | dist. laterales × dist. emisores / hileras | m² | 0.24 |
| Densidad de emisores | 10 000 / marco | emisores/ha | 41 667 |
| Precipitación horaria (Pp) | caudal del emisor / marco | mm/h | 5.0 |
| Caudal por hectárea | densidad de emisores × caudal / 1000 | m³/h/ha | 50 |
| Tiempo de riego por sector | ETc / (Pp × eficiencia) | h | 1.82 |
| Sectores | piso(horas laborales / tiempo de riego) | — | 6 (6.03) |
| Caudal por sector | caudal por ha × área del lote / sectores | m³/h | 103.6 |
| Volumen neto del día pico | ETc × 10 × área del lote | m³/día | 1 020 (bruto ÷ eficiencia: 1 134) |

> La hoja original calcula la densidad de emisores como `10 000 / marco × hileras`, con las hileras ya dentro del marco. Con una hilera por cama no se nota; con dos, duplica el resultado. La app usa `10 000 / marco`.

## 2. Suelo (por sección, en la zona radicular)

| Variable | Fórmula | Unidad |
| --- | --- | --- |
| Agua disponible | (CC − PMP) en %W × densidad aparente | cm/m |
| Lámina disponible (LADzr) | agua disponible × 10 × profundidad radicular | mm |
| Fracción p ajustada | p + 0.04 (5 − ETc), entre 0.1 y 0.8 (FAO-56, Tabla 22) | — |
| Lámina aprovechable (LAAzr) | agua disponible × p ajustada × (1 − pedregosidad) × 10 × profundidad radicular | mm |
| Intervalo máximo entre riegos | piso(LAAzr de la sección más limitante / ETc) | días |

| Sección | Textura | LAA en la hoja (por metro, p = 0.55) | LAA en 0.6 m de raíces | LAA con p ajustada (0.42) |
| --- | --- | --- | --- | --- |
| Parte 1 | Franco arcilloso | 99.8 mm | 59.9 mm | 45.9 mm |
| Parte 2 | Franco | 65.6 mm | 39.4 mm | 30.2 mm |
| Parte 3 | Franco arenoso | 49.5 mm | 29.7 mm | 22.8 mm |

Con la sección más limitante, el intervalo máximo entre riegos es de **2 días**, no de los 6 que sugiere la hoja.

## 3. Rangos de referencia (FAO-56, maíz de grano)

| Parámetro | Hoja | FAO-56 | Veredicto |
| --- | --- | --- | --- |
| Kc inicial | 0.35 | 0.3 (cereales) | Cercano; FAO-56 lo ajusta según la frecuencia de riego |
| Kc medio | 1.20 | 1.20 | Coincide |
| Kc final | 0.35 | 0.60 a 0.35 | Coincide (0.35 = grano secado en campo) |
| Etapas | 20 / 35 / 40 / 30 días | 20 / 35 / 40 / 30 (Nigeria húmedo; India seco) | Coincide |
| Altura máxima | "250 m" | 2 m | Error de unidad |
| Profundidad radicular | 0.6 m | 1.0 a 1.7 m (máxima) | Criterio: justificar |
| Fracción p | 0.55 | 0.55 a ETc ≈ 5 mm/día | Falta el ajuste por ETc |

En la app, `min` y `max` de cada Kc son una **tolerancia propia** alrededor del valor de FAO-56, por calibrar con casos reales. El rango de eficiencia de goteo (0.85–0.95) es un valor común en diseño de riego; falta citarle una fuente.

## 4. Reglas que aplica la app

| Regla | Qué revisa | Nivel si falla |
| --- | --- | --- |
| Escorrentía | Pp ≤ infiltración básica del suelo más lento | Error |
| Horas disponibles | sectores × tiempo ≤ horas laborales (margen < 5 % = revisar) | Error / Revisar |
| Frecuencia segura | ETc × días entre riegos ≤ LAA más limitante | Error |
| Fracción p | p dentro de ±0.05 de la p ajustada por ETc | Revisar |
| Kc y ciclo | dentro de la tolerancia y de los rangos de FAO-56 | Revisar |
| Profundidad radicular | menor que la mínima de FAO-56 | Criterio |
| Eficiencia | goteo entre 0.85 y 0.95 | Revisar |
| Escala física | alturas, profundidades o eficiencias imposibles para su unidad | Error |
| Valores declarados | lo que el archivo trae calculado coincide con el recálculo (±2 %) | Error |
| Lámina por metro | la LAA declarada coincide con el cálculo por metro y no con la zona radicular | Error |
| Números a mano | una fórmula usa un número fijo igual a un dato, o un decimal largo sin origen | Revisar |
| Datos completados | se usó un valor de referencia porque faltaba el dato | Criterio |

## 5. Hallazgos en la hoja original

| # | Celda | Hallazgo | Tipo |
| --- | --- | --- | --- |
| 1 | Cultivo F20 | Altura de la planta = 250, rotulada en metros | Error de unidad |
| 2 | Diseño E24 | Área por sector escrita a mano (`=12.43/E23`) | Valor fijo |
| 3 | Diseño E26 | Volumen por ciclo sin origen (`=4896.45…×12`) | Valor sin fuente |
| 4 | Lote I6 | Pendiente rotulada en %, calculada como fracción | Error de unidad |
| 5 | Cultivo F15 | p = 0.55 sin ajustar por ETc | Ajuste omitido |
| 6 | Diseño E5 | ETo de diseño = máximo diario del año | Criterio (conservador, válido) |
| 7 | Cultivo F21 | Profundidad radicular de 0.6 m | Criterio (válido en goteo si se justifica) |
| 8 | Referencia | Bibliografía vacía | Fuente faltante |
| 9 | Lote C24:F24 | LAA "zona radicular" sin multiplicar por la profundidad | Error de fórmula |

La app detecta sola los hallazgos 1, 2, 3, 5, 7 y 9 al cargar el Excel.

## Fuentes

- [FAO-56, cap. 6, Tablas 11 y 12](https://www.fao.org/4/x0490e/x0490e0b.htm)
- [FAO-56, cap. 8, Tabla 22](https://www.fao.org/4/x0490e/x0490e0e.htm)
- CIMMYT (2012), tabla de propiedades por textura usada en el Lab de Riego, Zamorano.
