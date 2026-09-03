import type { Dia } from "@/lib/generated/prisma/enums";
import { ZONA } from "@/lib/config";

/** Rango en minutos desde medianoche. Todo el calculo interno usa enteros:
 *  hacer aritmetica sobre strings "HH:MM" es de donde salen los off-by-one. */
export type Intervalo = { inicio: number; fin: number };

export function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function aHHMM(minutos: number): string {
  const acotado = Math.max(0, Math.min(24 * 60 - 1, minutos));
  const h = Math.floor(acotado / 60);
  const m = acotado % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function duracion(i: Intervalo): number {
  return Math.max(0, i.fin - i.inicio);
}

export function seSolapan(a: Intervalo, b: Intervalo): Intervalo | null {
  const inicio = Math.max(a.inicio, b.inicio);
  const fin = Math.min(a.fin, b.fin);
  return fin > inicio ? { inicio, fin } : null;
}

/** Le quita a `base` los tramos ocupados por `cortes`. Devuelve lo que queda
 *  libre, ordenado. Los cortes pueden venir desordenados y solaparse entre si. */
export function restarIntervalos(base: Intervalo, cortes: Intervalo[]): Intervalo[] {
  const relevantes = cortes
    .filter((c) => c.fin > base.inicio && c.inicio < base.fin)
    .sort((a, b) => a.inicio - b.inicio);

  const libres: Intervalo[] = [];
  let cursor = base.inicio;

  for (const c of relevantes) {
    if (c.inicio > cursor) libres.push({ inicio: cursor, fin: Math.min(c.inicio, base.fin) });
    cursor = Math.max(cursor, c.fin);
    if (cursor >= base.fin) break;
  }
  if (cursor < base.fin) libres.push({ inicio: cursor, fin: base.fin });

  return libres.filter((i) => i.fin > i.inicio);
}

const DIA_POR_ABREV: Record<string, Dia> = {
  Mon: "lun", Tue: "mar", Wed: "mie", Thu: "jue", Fri: "vie", Sat: "sab",
};

/** "Ahora" en Medellin. El server corre en UTC: si esto se calcula con
 *  `new Date().getDay()` el dashboard cambia de dia a las 7pm hora local. */
export function ahoraEnBogota(fecha: Date = new Date()): {
  dia: Dia | null; // null = domingo, la U esta cerrada
  minutos: number;
} {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha);

  const leer = (t: string) => partes.find((p) => p.type === t)?.value ?? "";

  return {
    dia: DIA_POR_ABREV[leer("weekday")] ?? null,
    minutos: Number(leer("hour")) * 60 + Number(leer("minute")),
  };
}

/** "45 minutos", "1 hora", "2 horas", "1h 30min" — lo que se dice en voz alta. */
export function duracionHumana(minutos: number): string {
  if (minutos < 60) return `${minutos} minutos`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return h === 1 ? "1 hora" : `${h} horas`;
  return `${h}h ${m}min`;
}
