// Catálogo de fertilizantes y conversiones de unidades.
// El grado N-P2O5-K2O de un fertilizante es su porcentaje en peso de cada nutriente y viene
// en la etiqueta (es la definición del producto). Urea 46-0-0, nitrato de amonio 34-0-0,
// DAP 18-46-0 y cloruro de potasio 0-0-60 coinciden con la calculadora de UT Extension.

export const FUENTE_UT = {
  cita: 'UT Extension, Fertilizer Cost Calculator v1.0 (Ferguson y McKinley, University of Tennessee)',
  regla: 'Cantidad de producto = nutriente requerido ÷ (grado del producto ÷ 100).',
};

export const PRODUCTOS = [
  { id: 'urea', nombre: 'Urea', n: 46, p: 0, k: 0, ut: true },
  { id: 'nitrato-amonio', nombre: 'Nitrato de amonio', n: 34, p: 0, k: 0, ut: true },
  { id: 'sulfato-amonio', nombre: 'Sulfato de amonio', n: 21, p: 0, k: 0 },
  { id: 'dap', nombre: 'Fosfato diamónico (DAP)', n: 18, p: 46, k: 0, ut: true },
  { id: 'map', nombre: 'Fosfato monoamónico (MAP)', n: 11, p: 52, k: 0 },
  { id: 'kcl', nombre: 'Cloruro de potasio (muriato)', n: 0, p: 0, k: 60, ut: true },
  { id: 'sulfato-potasio', nombre: 'Sulfato de potasio', n: 0, p: 0, k: 50 },
  { id: 'nitrato-potasio', nombre: 'Nitrato de potasio', n: 13, p: 0, k: 44 },
  { id: '15-15-15', nombre: 'Fórmula 15-15-15', n: 15, p: 15, k: 15 },
  { id: '12-24-12', nombre: 'Fórmula 12-24-12', n: 12, p: 24, k: 12 },
  { id: '20-20-0', nombre: 'Fórmula 20-20-0', n: 20, p: 20, k: 0 },
  { id: 'otro', nombre: 'Otra fórmula (escribe su grado)', n: 0, p: 0, k: 0 },
];
export const producto = (id) => PRODUCTOS.find((p) => p.id === id) ?? PRODUCTOS.at(-1);

export const METODOS = {
  incorporado: 'Incorporado o enterrado',
  voleo: 'Al voleo, en superficie',
  fertirriego: 'Fertirriego',
  foliar: 'Foliar',
};

// Unidades. Quintal = 100 lb = 45.359237 kg (exacto). Manzana = 10 000 varas² con la vara
// castellana de 0.8359 m = 6 987.3 m² = 0.69873 ha.
export const QQ_KG = 45.359237;
export const MZ_HA = 0.69873;
// 1 lb/acre = 0.45359237 kg / 0.40468564 ha = 1.12085 kg/ha.
export const UNIDADES = {
  kgha: { nombre: 'kg/ha', aKgHa: 1 },
  qqmz: { nombre: 'qq/mz', aKgHa: QQ_KG / MZ_HA }, // 1 qq/mz ≈ 64.9 kg/ha
  qqha: { nombre: 'qq/ha', aKgHa: QQ_KG },
  kgmz: { nombre: 'kg/mz', aKgHa: 1 / MZ_HA },
  lbacre: { nombre: 'lb/acre', aKgHa: 0.45359237 / 0.40468564 },
};
// Unidades que se ofrecen como botones en la pestaña (las demás se aceptan al importar).
export const UNIDADES_UI = ['kgha', 'qqmz'];
