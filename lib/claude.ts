import Anthropic from "@anthropic-ai/sdk";
import type { Dia } from "@/lib/generated/prisma/enums";
import { partirAula, reconocerSede, type SedeConAlias, type SedeRef } from "@/lib/aula";
import { parsearRango } from "@/lib/horas";

// El ID va sin sufijo de fecha: "claude-haiku-4-5-20251001" da 400.
// Cambiar esta linea a "claude-opus-5" es todo lo que hace falta si las fotos
// salen mal leidas — a este volumen la diferencia de costo es de centavos.
const MODELO = "claude-haiku-4-5";

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab"] as const;

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
};

const anthropic = new Anthropic();

/**
 * Al modelo solo se le pide transcribir: las celdas de Hora y Aula vienen
 * literales y las parsea codigo probado. Clasificar la sede o normalizar
 * "8:0-9:59" desde el prompt seria pedirle criterio donde ya hay reglas.
 */
const tools: Anthropic.Tool[] = [
  {
    name: "guardar_bloques_horario",
    description: "Registra los bloques de clase detectados en la tabla de horario",
    input_schema: {
      type: "object",
      properties: {
        bloques: {
          type: "array",
          items: {
            type: "object",
            properties: {
              titulo: { type: "string", description: "Nombre de la asignatura" },
              dia: { type: "string", enum: [...DIAS] },
              hora: { type: "string", description: "La celda Hora copiada literal, ej '8:0-9:59'" },
              aula: { type: "string", description: "La celda Aula copiada literal, ej 'N-310 FRATERNIDAD MEDELLIN (MAÑANA)'" },
            },
            required: ["titulo", "dia", "hora"],
          },
        },
      },
      required: ["bloques"],
    },
  },
];

const INSTRUCCIONES = `Esta es una tabla de horario universitario del ITM. Cada fila de la columna Día es un bloque de clase distinto.

CELDAS COMBINADAS: cuando una asignatura tiene clase varios días, su nombre aparece UNA sola vez y las filas siguientes lo tienen vacío. Repetí el nombre de la asignatura en cada bloque que le corresponda. Una tabla con 5 asignaturas puede tener 8 bloques.

Para cada bloque:
- titulo: el nombre de la asignatura
- dia: el día de la columna Día, como lun/mar/mie/jue/vie/sab
- hora: la celda Hora copiada literalmente, sin normalizar ni corregir
- aula: la celda Aula copiada literalmente, con el código, la sede y lo que venga entre paréntesis

Ignorá las columnas Grupo, Int. y Período. No extraigas el nombre ni el correo del profesor.`;

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
          { type: "text", text: INSTRUCCIONES },
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
  if (!titulo || !DIAS.includes(dia)) return null;

  const rango = parsearRango(typeof b.hora === "string" ? b.hora : "");
  if (!rango) return null;

  const { aula, resto } = partirAula(typeof b.aula === "string" ? b.aula.trim() : "");

  return {
    titulo,
    dia,
    horaInicio: rango.inicio,
    horaFin: rango.fin,
    aula,
    sede: reconocerSede(resto, sedes),
  };
}

/** Una clave sin poner da un 401 enterrado en los logs y encima gasta cupo.
 *  Mejor atajarlo antes de llamar. */
export function claveConfigurada(): boolean {
  const k = process.env.ANTHROPIC_API_KEY ?? "";
  return k.startsWith("sk-ant-") && k.length > 30;
}
