import { prisma } from "@/lib/db";
import {
  crearSesion,
  estaBloqueado,
  hashPin,
  limpiarIntentos,
  registrarFallo,
  verificarPin,
} from "@/lib/auth";

const CARNET = /^\d{4,15}$/;
const PIN = /^\d{4}$/;

/**
 * Un solo endpoint para entrar y para crear cuenta. El frontend guarda carnet
 * y PIN en estado local, y cuando le responde `needsName` reenvia todo con el
 * nombre. No hay estado en el servidor entre los dos pasos.
 */
export async function POST(req: Request) {
  let body: { carnet?: unknown; pin?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const carnet = String(body.carnet ?? "").trim();
  const pin = String(body.pin ?? "").trim();
  const name = typeof body.name === "string" ? body.name.trim() : undefined;

  if (!CARNET.test(carnet)) return Response.json({ error: "carnet" }, { status: 400 });
  if (!PIN.test(pin)) return Response.json({ error: "pin" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { carnet } });

  // Carnet nuevo: primero preguntamos el nombre. Un digito mal escrito crearia
  // una cuenta fantasma en silencio, y este es el unico punto donde se ataja.
  if (!user) {
    if (!name) return Response.json({ needsName: true });
    if (name.length > 40) return Response.json({ error: "nombre" }, { status: 400 });

    try {
      const creado = await prisma.user.create({
        data: { name, carnet, pinHash: await hashPin(pin) },
      });
      await crearSesion(creado.id);
      return Response.json({ ok: true });
    } catch {
      // Alguien mas creo el mismo carnet entre el findUnique y el create.
      return Response.json({ error: "reintentá" }, { status: 409 });
    }
  }

  if (estaBloqueado(user)) return Response.json({ error: "bloqueado" }, { status: 429 });

  if (!(await verificarPin(pin, user.pinHash))) {
    const r = await registrarFallo(user.id, user.intentosFallidos);
    return r.bloqueado
      ? Response.json({ error: "bloqueado" }, { status: 429 })
      : Response.json({ intentosRestantes: r.intentosRestantes }, { status: 401 });
  }

  if (user.intentosFallidos > 0) await limpiarIntentos(user.id);
  await crearSesion(user.id);
  return Response.json({ ok: true });
}
