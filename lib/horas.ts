/**
 * Parseo de la celda "Hora" del horario del ITM. Sin dependencias, igual que
 * lib/aula.ts: acá está el riesgo real y hay que poder probarlo sin base ni API.
 */

/** "8:0" -> "08:00". El ITM no rellena con cero, y la app sí lo exige. */
export function normalizarHora(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function sumarUnMinuto(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + 1;
  if (total >= 24 * 60) return hhmm; // nadie sale de clase a medianoche
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * "8:0-9:59" -> { inicio: "08:00", fin: "10:00" }
 *
 * El ITM escribe el fin como el último minuto ocupado, no como la hora de
 * salida: 9:59 quiere decir "hasta las 10". Sumamos ese minuto para que la app
 * diga la hora que la gente dice en voz alta. Para el cruce da igual —un minuto
 * contra márgenes de 15 y 30— pero "08:00–09:59" en pantalla se lee raro.
 */
export function parsearRango(texto: string): { inicio: string; fin: string } | null {
  const partes = texto.split(/[-–—]/);
  if (partes.length !== 2) return null;

  const inicio = normalizarHora(partes[0]);
  const finCrudo = normalizarHora(partes[1]);
  if (!inicio || !finCrudo) return null;

  const fin = finCrudo.endsWith(":59") ? sumarUnMinuto(finCrudo) : finCrudo;
  return fin > inicio ? { inicio, fin } : null;
}
