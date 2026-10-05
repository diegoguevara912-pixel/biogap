// Registro de módulos. Para agregar uno nuevo: crea el archivo con
// { id, nombre, ifa, evaluar(f, ctx, helpers) } que devuelva
// { variables, recs } (ver src/core/rubrica.js; pesos y cortes en CONFIG.rubrica), impórtalo aquí y agrega su id
// a CONFIG.modulosActivos.
import polinizadores from './polinizadores.js';
import fertilizacion from './fertilizacion.js';
import agua from './agua.js';
import suelo from './suelo.js';
import troficas from './troficas.js';

export const MODULOS = [polinizadores, fertilizacion, agua, suelo, troficas];
