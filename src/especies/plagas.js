// Plagas y enfermedades comunes por cultivo, para sugerirlas en el cuestionario.
// ESTADO: lista sugerida, NO VERIFICADA contra una fuente. Por validar con un entomólogo o
// fitopatólogo de Zamorano antes de usarla para puntuar. Hoy solo ayuda a recordar; el usuario
// puede agregar cualquier otra plaga a mano.
import { normalizar } from '../riego/referencias.js';

export const ESTADO_TABLA_PLAGAS = 'no verificado';

const TABLA = {
  maiz: ['Gusano cogollero (Spodoptera frugiperda)', 'Gallina ciega (Phyllophaga spp.)', 'Chicharrita (Dalbulus maidis)', 'Gusano elotero (Helicoverpa zea)'],
  frijol: ['Mosca blanca (Bemisia tabaci)', 'Picudo de la vaina (Apion godmani)', 'Babosa (Sarasinula plebeia)', 'Crisomélidos (Diabrotica spp.)'],
  arroz: ['Sogata (Tagosodes orizicolus)', 'Chinche de la espiga (Oebalus spp.)', 'Barrenador del tallo (Diatraea spp.)'],
  banano: ['Picudo negro (Cosmopolites sordidus)', 'Nematodo barrenador (Radopholus similis)', 'Sigatoka negra (Pseudocercospora fijiensis)'],
  platano: ['Picudo negro (Cosmopolites sordidus)', 'Nematodo barrenador (Radopholus similis)', 'Sigatoka negra (Pseudocercospora fijiensis)'],
  sorgo: ['Gusano cogollero (Spodoptera frugiperda)', 'Pulgón amarillo (Melanaphis sacchari)', 'Mosquita del sorgo (Stenodiplosis sorghicola)'],
  cafe: ['Broca del café (Hypothenemus hampei)', 'Roya del café (Hemileia vastatrix)', 'Minador de la hoja (Leucoptera coffeella)'],
  'cana de azucar': ['Barrenador (Diatraea spp.)', 'Salivazo (Aeneolamia spp.)'],
  melon: ['Mosca blanca (Bemisia tabaci)', 'Pulgón (Aphis gossypii)', 'Minador (Liriomyza spp.)'],
};

// Plagas sugeridas para un cultivo escrito por el usuario ("Maíz", "maiz amarillo", "Caña"...).
export function plagasDe(cultivo) {
  const c = normalizar(String(cultivo ?? ''));
  const clave = Object.keys(TABLA).find((k) => c === k || c.startsWith(k + ' ') || (k === 'cana de azucar' && c.startsWith('cana')));
  return clave ? TABLA[clave] : [];
}
