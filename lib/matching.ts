import type { Dia, TipoBloque } from "@/lib/generated/prisma/enums";
import {
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
};

/**
 * Paso 1 — ventanas de presencia, agrupadas por (dia, sede) y NO solo por dia.
 * Clase en Robledo 8-10 y en Fraternidad 14-16 son dos ventanas separadas, no
 * una de 8 a 16: entre las dos la persona esta viajando, no en el campus.
 */
export function ventanasDePresencia(bloques: BloqueBase[]): Ventana[] {
  const grupos = new Map<string, BloqueBase[]>();

  for (const b of bloques) {
    const clave = `${b.dia}|${b.sedeId}`;
    const actual = grupos.get(clave);
    if (actual) actual.push(b);
    else grupos.set(clave, [b]);
  }

  return [...grupos.values()].map((grupo) => {
    const inicios = grupo.map((b) => aMinutos(b.horaInicio));
    const fines = grupo.map((b) => aMinutos(b.horaFin));
    return {
      dia: grupo[0].dia,
      sedeId: grupo[0].sedeId,
      sedeNombre: grupo[0].sedeNombre,
      inicio: Math.min(...inicios) - MARGEN_LLEGADA,
      fin: Math.max(...fines) + MARGEN_SALIDA,
      bloques: grupo,
    };
  });
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
