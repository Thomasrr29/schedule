// Semestre activo. Solo se cruzan horarios con el mismo termLabel: comparar
// contra el horario del semestre pasado de un amigo daria encuentros falsos.
export const TERM_ACTUAL = process.env.NEXT_PUBLIC_TERM_ACTUAL ?? "2026-2";

// La U esta en Medellin. El server (Railway) corre en UTC, asi que "hoy" y
// "ahora" tienen que calcularse explicitamente en esta zona o el dashboard
// muestra el dia equivocado despues de las 7pm.
export const ZONA = "America/Bogota";

// Margenes de holgura en los extremos de la ventana de presencia.
export const MARGEN_LLEGADA = 15; // min antes del primer bloque
export const MARGEN_SALIDA = 30; // min despues del ultimo bloque
export const MIN_SOLAPE = 15; // por debajo de esto no se reporta
export const MIN_ENCUENTRO_LARGO = 30; // min de tramo libre compartido

// Hueco entre dos clases a partir del cual se asume que la persona se fue.
// Por debajo de esto irse y volver no paga con el trafico de Medellin, asi que
// la gente se queda; por encima ya es plausible que se haya ido a la casa.
// Ante la duda se parte: decir "esta en la U" cuando no esta cuesta un viaje
// perdido y la confianza en la app, y no decirlo solo cuesta un parche.
export const HUECO_MAXIMO = 90;
