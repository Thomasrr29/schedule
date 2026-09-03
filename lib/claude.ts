import Anthropic from "@anthropic-ai/sdk";
import type { Dia, Sede } from "@/lib/generated/prisma/enums";

// El ID va sin sufijo de fecha: "claude-haiku-4-5-20251001" da 400.
// Cambiar esta linea a "claude-opus-5" es todo lo que hace falta si las fotos
// salen mal leidas — a este volumen la diferencia de costo es de centavos.
const MODELO = "claude-haiku-4-5";

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab"] as const;
const SEDES = ["ROBLEDO", "FRATERNIDAD"] as const;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Lo que la IA propone. `sede` puede faltar a proposito: muchos horarios no la
 *  muestran y es mejor que quede vacia a que se la invente. */
export type BloqueExtraido = {
  titulo: string;
  dia: Dia;
  horaInicio: string;
  horaFin: string;
  sede: Sede | null;
};

const anthropic = new Anthropic();

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
              // Fuera de `required`: omitirla es como se dice "no se ve".
              sede: { type: "string", enum: [...SEDES] },
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
              "Extrae todos los bloques de clase visibles en esta imagen de horario " +
              "universitario del ITM. Las sedes posibles son Robledo y Fraternidad; " +
              "si no aparece con claridad, omite el campo sede en vez de adivinarla.",
          },
        ],
      },
    ],
  });

  const bloque = response.content.find((b) => b.type === "tool_use");
  if (!bloque) return [];

  const crudos = (bloque.input as { bloques?: unknown[] }).bloques ?? [];
  return crudos.map(normalizar).filter((b): b is BloqueExtraido => b !== null);
}

/** Capa 2 de validacion: el schema guia al modelo pero no lo obliga, asi que
 *  nada entra a la app sin pasar por aca. La capa 3 es el humano confirmando. */
function normalizar(crudo: unknown): BloqueExtraido | null {
  if (typeof crudo !== "object" || crudo === null) return null;
  const b = crudo as Record<string, unknown>;

  const titulo = typeof b.titulo === "string" ? b.titulo.trim() : "";
  const dia = b.dia as Dia;
  const horaInicio = String(b.hora_inicio ?? "");
  const horaFin = String(b.hora_fin ?? "");
  const sede = SEDES.includes(b.sede as Sede) ? (b.sede as Sede) : null;

  if (!titulo) return null;
  if (!DIAS.includes(dia)) return null;
  if (!HORA.test(horaInicio) || !HORA.test(horaFin)) return null;
  if (horaFin <= horaInicio) return null; // "HH:MM" con cero a la izquierda ordena bien como string

  return { titulo, dia, horaInicio, horaFin, sede };
}
