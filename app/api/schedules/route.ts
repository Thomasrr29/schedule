import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";
import { idsDeSedes } from "@/lib/sedes";
import { validarBloque, type BloqueValido } from "@/lib/validar";

/**
 * Guarda el horario que el usuario confirmo en la pantalla de la foto.
 * Reemplaza los bloques con origen "foto" y CONSERVA los "manual": resubir el
 * horario no puede borrarte la clase de bachata que agregaste a mano.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const crudos = Array.isArray(body?.bloques) ? body.bloques : null;
  if (!crudos) return Response.json({ error: "Faltan los bloques" }, { status: 400 });
  if (crudos.length === 0) return Response.json({ error: "No hay nada que guardar" }, { status: 400 });
  if (crudos.length > 60) return Response.json({ error: "Son demasiados bloques" }, { status: 400 });

  const termLabel = typeof body.termLabel === "string" ? body.termLabel : TERM_ACTUAL;
  const sedes = await idsDeSedes();

  const bloques: BloqueValido[] = [];
  for (const [i, crudo] of crudos.entries()) {
    const v = validarBloque(crudo, sedes);
    if (!v.ok) return Response.json({ error: v.error, indice: i }, { status: 400 });
    bloques.push(v.bloque);
  }

  const schedule = await prisma.schedule.upsert({
    where: { userId_termLabel: { userId: user.id, termLabel } },
    create: { userId: user.id, termLabel },
    update: {},
  });

  // Borrar y crear en una transaccion: si falla el create, no queremos dejar
  // al usuario sin el horario que ya tenia.
  await prisma.$transaction([
    prisma.timeBlock.deleteMany({ where: { scheduleId: schedule.id, origen: "foto" } }),
    prisma.timeBlock.createMany({
      data: bloques.map((b) => ({ ...b, scheduleId: schedule.id, origen: "foto" as const })),
    }),
  ]);

  return Response.json({ scheduleId: schedule.id, bloquesGuardados: bloques.length });
}
