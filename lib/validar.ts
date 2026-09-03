import { Dia, TipoBloque } from "@/lib/generated/prisma/enums";

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const enOpciones = <T extends string>(obj: Record<string, T>, v: unknown): v is T =>
  typeof v === "string" && Object.hasOwn(obj, v);

export type BloqueValido = {
  titulo: string;
  dia: Dia;
  horaInicio: string;
  horaFin: string;
  sedeId: string;
  aula: string | null;
  tipo: TipoBloque;
};

/**
 * Capa 2 de validacion: nada llega a la DB sin pasar por aca, venga del
 * formulario manual o de lo que propuso la IA. Devuelve el bloque limpio o el
 * motivo, en el mismo lenguaje que ve el usuario.
 *
 * Las sedes se pasan por parametro en vez de consultarse aca para que esto
 * siga siendo sincrono y probable sin base de datos.
 */
export function validarBloque(
  crudo: unknown,
  sedesValidas: Set<string>,
): { ok: true; bloque: BloqueValido } | { ok: false; error: string } {
  if (typeof crudo !== "object" || crudo === null) return { ok: false, error: "Bloque vacío" };
  const b = crudo as Record<string, unknown>;

  const titulo = typeof b.titulo === "string" ? b.titulo.trim() : "";
  if (!titulo) return { ok: false, error: "Ponele nombre al bloque" };
  if (titulo.length > 60) return { ok: false, error: "Ese nombre está muy largo" };

  if (!enOpciones(Dia, b.dia)) return { ok: false, error: "Escogé un día" };
  if (!enOpciones(TipoBloque, b.tipo)) return { ok: false, error: "Decí si estás ocupado o libre" };

  // La sede es lo que mas caro sale equivocado: un bloque con la sede mal no
  // produce un encuentro falso, produce uno que falta, y eso no se nota.
  if (typeof b.sedeId !== "string" || !sedesValidas.has(b.sedeId)) {
    return { ok: false, error: "Escogé la sede" };
  }

  const horaInicio = String(b.horaInicio ?? "");
  const horaFin = String(b.horaFin ?? "");
  if (!HORA.test(horaInicio) || !HORA.test(horaFin)) return { ok: false, error: "Las horas van en formato HH:MM" };
  // "HH:MM" con cero a la izquierda se ordena bien como string.
  if (horaFin <= horaInicio) return { ok: false, error: "La hora de salida va después de la de entrada" };

  const aula = typeof b.aula === "string" && b.aula.trim() ? b.aula.trim().slice(0, 20) : null;

  return { ok: true, bloque: { titulo, dia: b.dia, horaInicio, horaFin, sedeId: b.sedeId, aula, tipo: b.tipo } };
}
