/**
 * La app le habla a un parcero, no a un usuario. Voseo, sentence case.
 *
 * Regla anti-desgaste: lo que tiene vocal alargada se lee chistoso la primera
 * vez y como ruido a la decima. Esas cadenas van en arreglo y `variante()`
 * escoge una al azar en cada render.
 */
export const variante = (opciones: readonly string[]) =>
  opciones[Math.floor(Math.random() * opciones.length)];

export const copy = {
  entrar: {
    titulo: "Entrá pues",
    carnet: "Tu carnet",
    pin: "Tu PIN de 4 números",
    nuevo: (carnet: string) => `Nadie ha usado el carnet ${carnet}. ¿Es tuyo?`,
    nombre: "¿Cómo te llamás?",
    // Los errores de PIN se mantienen casuales pero claros: si el bloqueo
    // suena a chiste, la gente no entiende que quedó bloqueada.
    pinMalo: (n: number) => `PIN malo. Te ${n === 1 ? "queda 1 intento" : `quedan ${n} intentos`}`,
    bloqueado: "Muchos intentos. Esperá 15 minutos",
    pinCorto: "El PIN son 4 números",
    carnetMalo: "Ese carnet no parece un carnet",
    nombreVacio: "Escribí tu nombre",
  },
  errores: {
    red: "Se cayó el internet. Intentá otra vez",
    servidor: "Algo se rompió. Intentá en un ratico",
  },
} as const;
