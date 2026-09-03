import Anthropic from "@anthropic-ai/sdk";
import type { Dia } from "@/lib/generated/prisma/enums";
import { partirAula, reconocerSede, type SedeConAlias, type SedeRef } from "@/lib/aula";

// El ID va sin sufijo de fecha: "claude-haiku-4-5-20251001" da 400.
// Cambiar esta linea a "claude-opus-5" es todo lo que hace falta si las fotos
// salen mal leidas — a este volumen la diferencia de costo es de centavos.
const MODELO = "claude-haiku-4-5";

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab"] as const;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Lo que la IA propone. `sede` puede venir null: la pantalla de confirmacion
 *  la obliga antes de guardar, porque adivinarla es peor que preguntarla. */
export type BloqueExtraido = {
  titulo: string;
  dia: Dia;
  horaInicio: string;
  horaFin: string;
  aula: string | null;
  sede: SedeRef | null;
  celdaAula: string;
};

const anthropic = new Anthropic();

/**
 * La celda de "Aula" del ITM trae todo junto: "N-310 FRATERNIDAD MEDELLÍN
 * (MAÑANA)". Le pedimos al modelo que la copie tal cual en vez de clasificar
 * la sede: transcribir es lo que hace bien, y asi agregar una sede nueva es
 * insertar una fila y no reescribir el prompt.
 */
const tools: Anthropic.Tool[] = [
  {
    name: "guardar_bloques_horario",
    description: "Registra los bloques de clase detectados en la imagen",
    input_schema: {
      type: "object",
      properties: {
        bloques: {
          type: "array",
          items: {
            type: "object",
            properties: {
              titulo: { type: "string", description: "Nombre de la materia" },
              dia: { type: "string", enum: [...DIAS] },
              hora_inicio: { type: "string", description: "HH:MM en 24 horas" },
              hora_fin: { type: "string", description: "HH:MM en 24 horas" },
              aula: {
                type: "string",
                description: "La celda de Aula copiada literalmente, con el código, la sede y lo que venga entre paréntesis",
              },
            },
            required: ["titulo", "dia", "hora_inicio", "hora_fin"],
          },
        },
      },
      required: ["bloques"],
    },
  },
];

export async function extraerHorario(
  imagenBase64: string,
  mediaType: MediaType,
  sedes: SedeConAlias[],
): Promise<BloqueExtraido[]> {
  const response = await anthropic.messages.create({
    model: MODELO,
    // 1024 alcanzaba para ~12 bloques y truncaba el resto en silencio.
    max_tokens: 4096,
    tools,
    tool_choice: { type: "tool", name: "guardar_bloques_horario" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imagenBase64 } },
          {
            type: "text",
            text:
              "Extrae todos los bloques de clase de esta imagen de horario universitario del ITM. " +
              "Las horas vienen como rango (ej '8:0-9:59'): normalizalas a HH:MM de 24 horas. " +
              "El campo aula copialo literal de la celda, sin interpretarlo ni abreviarlo.",
          },
        ],
      },
    ],
  });

  const bloque = response.content.find((b) => b.type === "tool_use");
  if (!bloque) return [];

  const crudos = (bloque.input as { bloques?: unknown[] }).bloques ?? [];
  return crudos
    .map((c) => normalizar(c, sedes))
    .filter((b): b is BloqueExtraido => b !== null);
}

/** Capa 2 de validacion: el schema guia al modelo pero no lo obliga, asi que
 *  nada entra a la app sin pasar por aca. La capa 3 es el humano confirmando. */
function normalizar(crudo: unknown, sedes: SedeConAlias[]): BloqueExtraido | null {
  if (typeof crudo !== "object" || crudo === null) return null;
  const b = crudo as Record<string, unknown>;

  const titulo = typeof b.titulo === "string" ? b.titulo.trim() : "";
  const dia = b.dia as Dia;
  const horaInicio = String(b.hora_inicio ?? "");
  const horaFin = String(b.hora_fin ?? "");

  if (!titulo) return null;
  if (!DIAS.includes(dia)) return null;
  if (!HORA.test(horaInicio) || !HORA.test(horaFin)) return null;
  if (horaFin <= horaInicio) return null; // "HH:MM" con cero a la izquierda ordena bien como string

  const celdaAula = typeof b.aula === "string" ? b.aula.trim() : "";
  const { aula, resto } = partirAula(celdaAula);

  return { titulo, dia, horaInicio, horaFin, aula, sede: reconocerSede(resto, sedes), celdaAula };
}
