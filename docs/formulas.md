# Fórmulas del motor de riesgo

**Rúbrica aditiva.** Cada módulo es una lista de variables. Cada variable recibe un puntaje de **0, 50 o 100** y tiene un **peso** (suman 100 por módulo).

**Riesgo del módulo = Σ peso × puntaje ÷ Σ peso**, solo con las variables que tienen dato.

**Confianza de datos = peso con dato ÷ peso total.** Un dato faltante baja la confianza; no cuenta como riesgo cero. Una variable que **no aplica** a la finca (p. ej. fertirriego si no se usa) no cuenta para nada.

Niveles: **Alto** ≥ 67 · **Medio** ≥ 34 · **Bajo** < 34. Pesos, cortes y niveles se ajustan en `src/core/config.js`.

Cortes [a, b]: valor ≤ a → 0; ≤ b → 50; mayor → 100. Inverso: valor ≥ a → 0; ≥ b → 50; menor → 100.

> Pesos y cortes son **criterio propio** salvo que se indique fuente. Están por validar con especialistas y por calibrar con casos reales (Etapa 3).

## Polinizadores

Basado en Kuniyoshi (2026) y Osorio (2025), PEG de Zamorano. Kuniyoshi encontró una relación positiva pero débil entre la abundancia floral de *Spathodea campanulata* y las abejas muertas (R² = 0.21, no significativa), y señaló como factores **no medidos** la exposición a agroquímicos, la disponibilidad de otras especies en floración, la disponibilidad de agua, el clima y la condición de las flores. Las variables basadas en esos factores son **hipótesis** y se marcan "No verificado".

| Variable | Peso | Puntaje | Estado |
|---|---|---|---|
| Meses con aplicación no biológica en floración visitada | 25 | ≤ 0 → 0 · ≤ 1 → 50 · mayor → 100 | Criterio propio |
| Producto más agresivo aplicado en floración | 15 | ninguno/biológico 0 · selectivo 50 · amplio 100 | Criterio propio |
| Meses de floración de especies de riesgo | 10 | ≤ 0 → 0 · ≤ 2 → 50 · mayor → 100 | Criterio propio |
| Abundancia de la especie de riesgo: volumen de copa V = 4/3·π·(D/2)²·(H/2) (Osorio, Ec. 3); sin medidas, n.º de árboles | 15 | m³: ≤ 0 → 0 · ≤ 1 000 → 50 · mayor → 100 (árboles: 0 / 1 / más) | Verificado (relación débil); corte criterio propio |
| Meses de floración de riesgo sin otra floración segura (fracción) | 15 | ≤ 0 → 0 · ≤ 0.5 → 50 · mayor → 100 | No verificado (hipótesis) |
| Meses de floración de riesgo sin lluvia (fracción) | 10 | ≤ 0 → 0 · ≤ 0.5 → 50 · mayor → 100 | No verificado (hipótesis) |
| **Vínculo con Fertilización:** aplicación foliar en floración visitada (solo con plan) | 5 | ninguna 0 · alguna 100 | No verificado (hipótesis) |
| Abejas nativas registradas (receptor) | 5 | nativas 100 · solo no nativas 50 · sin fauna: sin dato | Criterio propio |

## Fertilización

| Variable | Peso | Puntaje |
|---|---|---|
| N aplicado / N objetivo | 30 | ≤ 1 → 0 · ≤ 1.2 → 50 · mayor → 100 |
| Fracción del N (con plan) o de las fertilizaciones en meses de lluvia fuerte | 20 | ≤ 0 → 0 · ≤ 0.5 → 50 · mayor → 100 |
| Mayor fracción del N aplicada en un solo mes (requiere plan) | 10 | ≤ 0.5 → 0 · ≤ 0.75 → 50 · mayor → 100 |
| Fracción del N como urea al voleo sin incorporar (requiere plan) | 10 | ≤ 0 → 0 · ≤ 0.5 → 50 · mayor → 100 |
| P₂O₅ aplicado / P₂O₅ objetivo (requiere plan) | 10 | ≤ 1 → 0 · ≤ 1.2 → 50 · mayor → 100 |
| Pendiente | 10 | plana 0 · ondulada 50 · fuerte 100 |
| Distancia al cuerpo de agua (m) | 10 | ≥ 100 → 0 · ≥ 30 → 50 · menor → 100 |

## Agua

| Variable | Peso | Puntaje |
|---|---|---|
| Sistema de riego (eficiencia FAO 90/75/60 %) | 25 | goteo 0 · aspersión 50 · gravedad 100 · sin riego 0 |
| Distancia al cuerpo de agua (m) | 20 | ≥ 100 → 0 · ≥ 30 → 50 · menor → 100 |
| Área productiva / área total | 15 | ≤ 0.5 → 0 · ≤ 0.8 → 50 · mayor → 100 |
| Hallazgos del módulo Riego (FAO-56) | 30 | sin hallazgos 0 · advertencias 50 · error 100 · sin cargar: sin dato |
| **Vínculo con Fertilización:** fertirriego con un diseño de riego que escurre (solo si hay fertirriego) | 10 | no escurre 0 · escurre 100 |

## Suelo

| Variable | Peso | Puntaje |
|---|---|---|
| Meses de suelo desnudo con lluvia | 35 | ≤ 0 → 0 · ≤ 1 → 50 · mayor → 100 |
| Labranza | 25 | cero 0 · mínima 50 · convencional 100 |
| Pendiente | 25 | plana 0 · ondulada 50 · fuerte 100 |
| **Vínculo con Fertilización:** fracción de N + P₂O₅ aplicada sobre suelo desnudo en meses de lluvia (solo con plan) | 15 | ≤ 0 → 0 · ≤ 0.25 → 50 · mayor → 100 |

## Cadenas tróficas

| Variable | Peso | Puntaje |
|---|---|---|
| Fracción de productos de amplio espectro | 35 | ≤ 0 → 0 · ≤ 0.5 → 50 · mayor → 100 |
| Fracción de meses de amplio espectro con plaga | 25 | ≤ 0 → 0 · ≤ 0.5 → 50 · mayor → 100 |
| Fracción de especies silvestres nativas | 25 | ≥ 0.6 → 0 · ≥ 0.3 → 50 · menor → 100 |
| Meses con aplicación en cosecha | 15 | ≤ 0 → 0 · ≤ 0 → 50 · mayor → 100 |

## Plan de fertilización (pestaña Fertilización)

- Se escribe a mano o se carga una plantilla Excel/CSV (columnas Mes, Producto, Dosis, Unidad, Método).
- Nutriente aplicado (kg/ha) = dosis de producto (kg/ha) × grado (%) ÷ 100. El grado N-P₂O₅-K₂O viene en la etiqueta. Conversión de grado a producto verificada contra UT Extension, Fertilizer Cost Calculator v1.0 (University of Tennessee).
- Unidades: 1 quintal = 100 lb = 45.359237 kg; 1 manzana = 10 000 varas² = 0.69873 ha; 1 qq/mz ≈ 64.9 kg/ha; 1 lb/acre ≈ 1.121 kg/ha.
- Los objetivos por nutriente los pone el usuario (análisis de suelo o agrónomo); la app no recomienda dosis.
- Objetivo de sostenibilidad: el plan alimenta Fertilización y, por sus efectos en el ecosistema, Suelo y Agua. Con Polinizadores se vincula por las aplicaciones foliares en floración visitada.

## Fuentes de los vínculos ecológicos

- Kuniyoshi Aguilar, A. S. (2026). *Fenología de Spathodea campanulata en el campus de la Universidad Zamorano y presencia de abejas muertas asociadas a sus flores.* PEG, Zamorano.
- Osorio Banegas, N. E. (2025). *Evaluación de la distribución de Spathodea campanulata en el campus de la Universidad Zamorano.* PEG, Zamorano.
