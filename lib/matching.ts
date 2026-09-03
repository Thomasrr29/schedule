import type { Dia, TipoBloque } from "@/lib/generated/prisma/enums";
import {
  HUECO_MAXIMO,
  MARGEN_LLEGADA,
  MARGEN_SALIDA,
  MIN_ENCUENTRO_LARGO,
  MIN_SOLAPE,
} from "@/lib/config";
import {
  aHHMM,
  aMinutos,
  duracion,
  restarIntervalos,
  seSolapan,
  type Intervalo,
} from "@/lib/time";

/** Lo minimo que el calculo necesita de un TimeBlock. Se define aparte del
 *  modelo de Prisma para poder probar el matching sin tocar la base. */
export type BloqueBase = {
  titulo: string;
  dia: Dia;
  horaInicio: string; // "HH:MM"
  horaFin: string;
  sedeId: string;
  sedeNombre: string;
  tipo: TipoBloque;
};

export type Ventana = Intervalo & {
  dia: Dia;
  sedeId: string;
  sedeNombre: string;
  bloques: BloqueBase[];
};

export type Coincidencia = {
  dia: Dia;
  sede: { id: string; nombre: string };
  inicio: string; // "HH:MM"
  fin: string;
  tipo: "largo" | "corto";
  /** El tramo mas largo dentro del solape donde ninguno de los dos esta
   *  ocupado. null cuando el cruce es solo en la frontera de un bloque. */
  tramoLibre: { inicio: string; fin: string; minutos: number } | null;
  /** De cuando a cuando esta el otro en esa sede ese dia, con sus horas reales
   *  y sin los margenes de holgura. La tarjeta lo lee para poder decir "esta en
   *  Fraternidad de 08:00 a 10:00" en vez de anunciar cuantos minutos hay. */
  amigoEnSede: { inicio: string; fin: string };
};

/** Una tanda de bloques seguidos se vuelve una ventana, con la holgura de
 *  llegada y salida en los extremos. */
function armarVentana(tanda: BloqueBase[]): Ventana {
  return {
    dia: tanda[0].dia,
    sedeId: tanda[0].sedeId,
    sedeNombre: tanda[0].sedeNombre,
    inicio: Math.min(...tanda.map((b) => aMinutos(b.horaInicio))) - MARGEN_LLEGADA,
    fin: Math.max(...tanda.map((b) => aMinutos(b.horaFin))) + MARGEN_SALIDA,
    bloques: tanda,
  };
}

/**
 * Paso 1 — ventanas de presencia, agrupadas por (dia, sede) y NO solo por dia.
 * Clase en Robledo 8-10 y en Fraternidad 14-16 son dos ventanas separadas, no
 * una de 8 a 16: entre las dos la persona esta viajando, no en el campus.
 *
 * Dentro de una misma sede tampoco alcanza con tomar la primera hora y la
 * ultima: clase de 8 a 10 y otra de 16 a 18 no es estar en la U de 8 a 18, es
 * irse a la casa en el medio. Por eso la tanda se corta cuando el hueco pasa de
 * HUECO_MAXIMO, y un dia puede dar dos ventanas o mas.
 *
 * Un bloque DISPONIBLE ("me quedo estudiando de 12 a 4") cuenta como cualquier
 * otro para este calculo, asi que declararlo vuelve a unir lo que el hueco
 * habia partido — pero solo mientras lo cubra.
 */
export function ventanasDePresencia(bloques: BloqueBase[]): Ventana[] {
  const grupos = new Map<string, BloqueBase[]>();

  for (const b of bloques) {
    const clave = `${b.dia}|${b.sedeId}`;
    const actual = grupos.get(clave);
    if (actual) actual.push(b);
    else grupos.set(clave, [b]);
  }

  const ventanas: Ventana[] = [];

  for (const grupo of grupos.values()) {
    const orden = [...grupo].sort((a, b) => aMinutos(a.horaInicio) - aMinutos(b.horaInicio));
    let tanda: BloqueBase[] = [orden[0]];
    // El final de la tanda es el mayor de los fines, no el del ultimo bloque:
    // dos clases solapadas dejarian el corte en el lugar equivocado.
    let finTanda = aMinutos(orden[0].horaFin);

    for (const b of orden.slice(1)) {
      if (aMinutos(b.horaInicio) - finTanda > HUECO_MAXIMO) {
        ventanas.push(armarVentana(tanda));
        tanda = [b];
        finTanda = aMinutos(b.horaFin);
      } else {
        tanda.push(b);
        finTanda = Math.max(finTanda, aMinutos(b.horaFin));
      }
    }
    ventanas.push(armarVentana(tanda));
  }

  return ventanas;
}

/**
 * Cruza los bloques de dos personas y devuelve donde pueden encontrarse.
 * Sin estado y sin DB: se recalcula en cada request en vez de guardarse.
 */
export function calcularCoincidencias(
  mios: BloqueBase[],
  suyos: BloqueBase[],
): Coincidencia[] {
  const misVentanas = ventanasDePresencia(mios);
  const susVentanas = ventanasDePresencia(suyos);
  const resultado: Coincidencia[] = [];

  for (const va of misVentanas) {
    for (const vb of susVentanas) {
      // Cruzar sedes nunca genera encuentro, ni el mismo dia a la misma hora.
      if (va.dia !== vb.dia || va.sedeId !== vb.sedeId) continue;

      const solape = seSolapan(va, vb);
      if (!solape || duracion(solape) < MIN_SOLAPE) continue;

      // Un bloque DISPONIBLE ("voy a estudiar") no se resta: la persona esta
      // ahi y libre, que es justamente cuando si se pueden ver.
      const ocupados = [...va.bloques, ...vb.bloques]
        .filter((b) => b.tipo === "OCUPADO")
        .map((b) => ({ inicio: aMinutos(b.horaInicio), fin: aMinutos(b.horaFin) }));

      const tramos = restarIntervalos(solape, ocupados);
      const mejor = tramos.reduce<Intervalo | null>(
        (max, t) => (!max || duracion(t) > duracion(max) ? t : max),
        null,
      );

      const esLargo = !!mejor && duracion(mejor) >= MIN_ENCUENTRO_LARGO;

      resultado.push({
        dia: va.dia,
        sede: { id: va.sedeId, nombre: va.sedeNombre },
        inicio: aHHMM(solape.inicio),
        fin: aHHMM(solape.fin),
        tipo: esLargo ? "largo" : "corto",
        tramoLibre: mejor
          ? { inicio: aHHMM(mejor.inicio), fin: aHHMM(mejor.fin), minutos: duracion(mejor) }
          : null,
        amigoEnSede: {
          inicio: aHHMM(Math.min(...vb.bloques.map((b) => aMinutos(b.horaInicio)))),
          fin: aHHMM(Math.max(...vb.bloques.map((b) => aMinutos(b.horaFin)))),
        },
      });
    }
  }

  return resultado;
}

/** Filtra a lo que esta pasando ahora mismo — alimenta la tarjeta grande. */
export function coincidenciasEnCurso(
  coincidencias: Coincidencia[],
  dia: Dia | null,
  minutos: number,
): Coincidencia[] {
  if (!dia) return [];
  return coincidencias.filter(
    (c) =>
      c.dia === dia && aMinutos(c.inicio) <= minutos && minutos < aMinutos(c.fin),
  );
}
