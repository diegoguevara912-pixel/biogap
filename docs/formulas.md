# Fórmulas del motor de riesgo

**Riesgo del módulo = 100 × P × E × V.** P, E y V van de 0 a 1.

- **P (presión):** cuánto empuja la práctica hacia el daño.
- **E (exposición):** cuánto coincide esa presión, en tiempo o espacio, con lo vulnerable.
- **V (vulnerabilidad):** qué tan sensible es lo que se puede dañar.

Niveles: **Alto** ≥ 67 · **Medio** ≥ 34 · **Bajo** < 34. Se ajustan en `src/core/config.js`.

**Confianza de datos:** la proporción de entradas clave que el usuario llenó. No indica que la fórmula sea correcta. Solo indica que se calculó con datos completos.

> Todo lo de esta página es **ilustrativo**. Ningún peso está calibrado con mediciones. La columna "Estado" sirve para registrar el avance de la calibración.

| Módulo | P | E | V | Estado |
|---|---|---|---|---|
| Polinizadores | 0.5·[hay especie de riesgo] + 0.5·[hay aplicaciones no biológicas] | (meses floración–aplicación + 0.5·meses de floración de riesgo) / 6 | 1 si hay abejas nativas registradas; 0.7 si no | Por calibrar |
| Fertilización | (N aplicado / N objetivo) − 0.5 | pendiente × (0.5 + 0.5·meses fertilizados con lluvia / meses fertilizados) | distancia al agua: < 30 m → 1; < 100 m → 0.7; resto → 0.4 | Por calibrar |
| Agua | riego: gravedad 0.9; aspersión 0.6; goteo 0.3; ninguno 0.1 | área productiva / área total | distancia al agua (igual que arriba) | Por calibrar |
| Suelo | labranza: convencional 0.9; mínima 0.5; cero 0.2 | pendiente: plana 0.3; ondulada 0.6; fuerte 1 | 0.4 + 0.6·meses de suelo desnudo con lluvia / meses de lluvia | Por calibrar |
| Cadenas tróficas | aplicaciones de amplio espectro / total | meses de amplio espectro que coinciden con plagas / meses de amplio espectro | 1 − 0.6·proporción de especies nativas | Por calibrar |

## Limitaciones conocidas

- La forma multiplicativa hace que un solo factor en 0 anule el riesgo completo. Esto es intencional (sin exposición no hay riesgo), pero hay que revisarlo módulo por módulo.
- Polinizadores divide entre 6 meses. Es un tope arbitrario.
- Los factores binarios (sí/no) no distinguen intensidad. Por ejemplo, un árbol de riesgo cuenta igual que cien.

## Cómo calibrar (cuando haya datos)

1. Estandarizar los datos de las tesis en tablas con las mismas variables del cuestionario.
2. Comparar el puntaje de la app con el daño observado en cada caso.
3. Ajustar los valores en `config.js` y registrar aquí la fuente de cada cambio.
