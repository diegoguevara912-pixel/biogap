# Fórmulas del motor de riesgo

**Rúbrica aditiva.** Cada módulo es una lista de variables. Cada variable recibe un puntaje de **0, 50 o 100** y tiene un **peso** (suman 100 por módulo).

**Riesgo del módulo = Σ peso × puntaje ÷ Σ peso**, solo con las variables que tienen dato.

**Confianza de datos = peso con dato ÷ peso total.** Un dato faltante baja la confianza; no cuenta como riesgo cero.

Niveles: **Alto** ≥ 67 · **Medio** ≥ 34 · **Bajo** < 34. Pesos, cortes y niveles se ajustan en `src/core/config.js`.

Cortes [a, b]: valor ≤ a → 0; ≤ b → 50; mayor → 100. Inverso: valor ≥ a → 0; ≥ b → 50; menor → 100.

> Pesos y cortes son **criterio propio** salvo que se indique fuente. Están por validar con especialistas y por calibrar con casos reales (Etapa 3).

## Polinizadores

| Variable | Peso | Puntaje |
|---|---|---|
| Meses con aplicación no biológica en floración visitada | 35 | ≤ 0 → 0 · ≤ 1 → 50 · mayor → 100 |
| Producto más agresivo aplicado en floración | 25 | ninguno/biológico 0 · selectivo 50 · amplio 100 |
| Meses de floración de especies de riesgo | 25 | ≤ 0 → 0 · ≤ 2 → 50 · mayor → 100 |
| Abejas nativas registradas (receptor) | 15 | nativas 100 · solo no nativas 50 · sin fauna: sin dato |

## Fertilización

| Variable | Peso | Puntaje |
|---|---|---|
| N aplicado / N objetivo | 35 | ≤ 1 → 0 · ≤ 1.2 → 50 · mayor → 100 |
| Fracción de fertilizaciones en meses de lluvia fuerte | 25 | ≤ 0 → 0 · ≤ 0.5 → 50 · mayor → 100 |
| Pendiente | 20 | plana 0 · ondulada 50 · fuerte 100 |
| Distancia al cuerpo de agua (m) | 20 | ≥ 100 → 0 · ≥ 30 → 50 · menor → 100 |

## Agua

| Variable | Peso | Puntaje |
|---|---|---|
| Sistema de riego (eficiencia FAO 90/75/60 %) | 25 | goteo 0 · aspersión 50 · gravedad 100 · sin riego 0 |
| Distancia al cuerpo de agua (m) | 25 | ≥ 100 → 0 · ≥ 30 → 50 · menor → 100 |
| Área productiva / área total | 15 | ≤ 0.5 → 0 · ≤ 0.8 → 50 · mayor → 100 |
| Hallazgos del módulo Riego (FAO-56) | 35 | sin hallazgos 0 · advertencias 50 · error 100 · sin cargar: sin dato |

## Suelo

| Variable | Peso | Puntaje |
|---|---|---|
| Meses de suelo desnudo con lluvia | 40 | ≤ 0 → 0 · ≤ 1 → 50 · mayor → 100 |
| Labranza | 30 | cero 0 · mínima 50 · convencional 100 |
| Pendiente | 30 | plana 0 · ondulada 50 · fuerte 100 |

## Cadenas tróficas

| Variable | Peso | Puntaje |
|---|---|---|
| Fracción de productos de amplio espectro | 35 | ≤ 0 → 0 · ≤ 0.5 → 50 · mayor → 100 |
| Fracción de meses de amplio espectro con plaga | 25 | ≤ 0 → 0 · ≤ 0.5 → 50 · mayor → 100 |
| Fracción de especies silvestres nativas | 25 | ≥ 0.6 → 0 · ≥ 0.3 → 50 · menor → 100 |
| Meses con aplicación en cosecha | 15 | ≤ 0 → 0 · ≤ 0 → 50 · mayor → 100 |

