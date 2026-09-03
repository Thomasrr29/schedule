import { Dia, Sede, TipoBloque } from "@/lib/generated/prisma/enums";

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const enOpciones = <T extends string>(obj: Record<string, T>, v: unknown): v is T =>
  typeof v === "string" && Object.hasOwn(obj, v);

export type BloqueValido = {
  titulo: string;
  dia: Dia;
  horaInicio: string;
  horaFin: string;
  sede: Sede;
  tipo: TipoBloque;
};

/**
 * Capa 2 de validacion: nada llega a la DB sin pasar por aca, venga del
 * formulario manual o de lo que propuso la IA. Devuelve el bloque limpio o el
 * motivo, en el mismo lenguaje que ve el usuario.
 */
export function validarBloque(crudo: unknown): { ok: true; bloque: BloqueValido } | { ok: false; error: string } {
  if (typeof crudo !== "object" || crudo === null) return { ok: false, error: "Bloque vacío" };
  const b = crudo as Record<string, unknown>;

  const titulo = typeof b.titulo === "string" ? b.titulo.trim() : "";
  if (!titulo) return { ok: false, error: "Ponele nombre al bloque" };
  if (titulo.length > 60) return { ok: false, error: "Ese nombre está muy largo" };

  if (!enOpciones(Dia, b.dia)) return { ok: false, error: "Escogé un día" };
  if (!enOpciones(Sede, b.sede)) return { ok: false, error: "¿Robledo o Fraternidad?" };
  if (!enOpciones(TipoBloque, b.tipo)) return { ok: false, error: "Decí si estás ocupado o libre" };

  const horaInicio = String(b.horaInicio ?? "");
  const horaFin = String(b.horaFin ?? "");
  if (!HORA.test(horaInicio) || !HORA.test(horaFin)) return { ok: false, error: "Las horas van en formato HH:MM" };
  // "HH:MM" con cero a la izquierda se ordena bien como string.
  if (horaFin <= horaInicio) return { ok: false, error: "La hora de salida va después de la de entrada" };

  return { ok: true, bloque: { titulo, dia: b.dia, horaInicio, horaFin, sede: b.sede, tipo: b.tipo } };
}
