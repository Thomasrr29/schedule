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
  semana: {
    ahora: "Ahora mismo",
    titulo: "Tu semana",
    sinHorario: "Cargá tu horario",
    sinHorarioSub: "Sin él no hay con quién cruzarte",
    sinAmigos: "Todavía no tenés parceros acá. Invitá a alguien",
    sinNada: "Esta semana no se cruzan con nadie. Parche muerto",
    sinNadaDia: "Nadie cae este día",
    // La app responde "quién está en la U y a quién le escribo", no "cuánto
    // tiempo libre te queda". Por eso la tarjeta abre diciendo dónde está el
    // otro y a qué horas, y cierra invitando. Nada de anunciar una duración:
    // "tenés 30 minutos" suena a agenda y nadie sabe qué hacer con el dato.
    // Una tarjeta por persona y por día: el nombre arriba, debajo cada franja
    // en que cae, y el cierre invitando una sola vez. Agrupado se lee como
    // "hoy Juanchito cae dos veces"; suelto parecen dos personas distintas.
    franja: (desde: string, hasta: string, sede: string) =>
      `${desde} a ${hasta} · ${sede}`,
    coinciden: (desde: string, hasta: string) => `coinciden ${desde}–${hasta}`,
    cierreLargo: "Podrían parchar un rato",
    cierreCorto: "Podrías escribirle",
  },
  parceros: {
    titulo: "Tus parceros",
    vacio: "No tenés parceros todavía. Mandales el link",
    tuLink: "Tu link",
    explica: "Mandáselo a tus parceros. El que lo abra queda conectado con vos",
    copiar: "Copiar",
    copiado: "Copiado",
    regenerar: "Cambiar el link",
    regenerarAviso: "¿Seguro? El link viejo deja de servir y toca mandar el nuevo",
    quitar: "Quitar",
    // Quitar no cierra la puerta: el link sigue sirviendo. Decirlo acá evita
    // que alguien crea que quitó a un parcero y quedó fuera.
    quitarAviso: "¿Seguro? Si todavía tiene tu link puede volver a entrar",
    mejorNo: "Mejor no",
  },
  invitacion: {
    invita: (nombre: string) => `${nombre} te quiere agregar`,
    explica: "Van a poder ver a qué horas coinciden en la U",
    aceptar: "De una",
    listo: (nombre: string) => `Listo, ya estás con ${nombre}`,
    yaEran: (nombre: string) => `Ya estabas con ${nombre}`,
    vosMismo: "Ese es tu propio link. Mandáselo a un parcero",
    noExiste: "Ese link ya no sirve. Pedile uno nuevo",
  },
  horario: {
    titulo: "Tu horario",
    vacio: "Tirale una foto a tu horario",
    vacioManual: "Todavía no tenés bloques. Añadí el primero",
    añadir: "Añadir parche fijo",
    guardado: "Listo pues, horario guardado",
    ocupado: "Estoy en algo",
    disponible: "Estoy por allá, libre",
    sede: "¿En qué sede?",
    elegirFoto: "Tomar o elegir la foto",
    descifrando: "Descifrando ese horario…",
    confirmar: "¿Quedó bien? Arreglá lo que esté raro",
    ilegible: "No se entiende la foto. Tomala otra vez con más luz",
    faltanSedes: (n: number) =>
      n === 1 ? "Falta la sede de un bloque" : `Faltan las sedes de ${n} bloques`,
    guardarHorario: "Guardar horario",
    conservaManuales: "Los bloques que agregaste a mano no se borran",
    borrar: "Borrar",
    cancelar: "Cancelar",
  },
  dias: {
    lun: "Lunes", mar: "Martes", mie: "Miércoles",
    jue: "Jueves", vie: "Viernes", sab: "Sábado",
  },
  // Para las pestañas: seis nombres completos no caben en el ancho de un teléfono.
  diasCorto: {
    lun: "Lun", mar: "Mar", mie: "Mié",
    jue: "Jue", vie: "Vie", sab: "Sáb",
  },
  errores: {
    red: "Se cayó el internet. Intentá otra vez",
    servidor: "Algo se rompió. Intentá en un ratico",
  },
} as const;
