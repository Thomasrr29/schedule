import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listarSedes } from "@/lib/sedes";
import { claveConfigurada, extraerHorario, MEDIA_TYPES, type MediaType } from "@/lib/claude";
import { fechaHoyBogota } from "@/lib/time";

const TOPE_DIARIO = 10;
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Recibe la foto en memoria, la manda en base64 y descarta el buffer al
 * salir: la imagen nunca toca disco ni base. Lo unico que se guarda son los
 * bloques que el usuario confirma despues, en POST /api/schedules.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  // Antes del cupo: un error de configuración no debería costarle una subida
  // al usuario, y el 401 de la API se lee como "la foto estaba mala".
  if (!claveConfigurada()) {
    return Response.json(
      { error: "Falta configurar ANTHROPIC_API_KEY en el servidor" },
      { status: 503 },
    );
  }

  const hoy = fechaHoyBogota();
  const usadas = user.extraccionesFecha === hoy ? user.extraccionesHoy : 0;
  if (usadas >= TOPE_DIARIO) {
    return Response.json({ error: "Ya subiste muchas fotos hoy. Mañana seguís" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const imagen = form?.get("imagen");
  if (!(imagen instanceof File)) return Response.json({ error: "Mandá una foto" }, { status: 400 });
  if (!MEDIA_TYPES.includes(imagen.type as MediaType)) {
    return Response.json({ error: "Esa foto no sirve. Mandá una JPG o PNG" }, { status: 400 });
  }
  if (imagen.size > MAX_BYTES) {
    return Response.json({ error: "La foto está muy pesada. Sacale uma más liviana" }, { status: 400 });
  }

  // El cupo se descuenta ANTES de llamar. Si se descontara despues, un
  // reintento en bucle podria llamar sin tope; perder un cupo de diez por un
  // error de red es el precio mas barato de los dos.
  await prisma.user.update({
    where: { id: user.id },
    data: { extraccionesFecha: hoy, extraccionesHoy: usadas + 1 },
  });

  try {
    const base64 = Buffer.from(await imagen.arrayBuffer()).toString("base64");
    const bloques = await extraerHorario(base64, imagen.type as MediaType, await listarSedes());
    return Response.json({ bloques, restantes: TOPE_DIARIO - usadas - 1 });
  } catch (e) {
    // El usuario ve algo entendible; la causa real queda en el log del server,
    // porque sin esto un fallo de la API es indistinguible de una foto mala.
    console.error("[extract] falló la lectura:", e);
    return Response.json({ error: "No se pudo leer la foto. Intentá otra vez" }, { status: 502 });
  }
}
