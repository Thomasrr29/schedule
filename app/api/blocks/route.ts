import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";
import { validarBloque } from "@/lib/validar";
import { idsDeSedes } from "@/lib/sedes";

/** Crea un bloque suelto: la clase de bachata, "los miércoles voy a estudiar".
 *  Queda con origen manual para que resubir la foto del horario no lo borre. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const v = validarBloque(body, await idsDeSedes());
  if (!v.ok) return Response.json({ error: v.error }, { status: 400 });

  const termLabel = typeof body.termLabel === "string" ? body.termLabel : TERM_ACTUAL;

  const schedule = await prisma.schedule.upsert({
    where: { userId_termLabel: { userId: user.id, termLabel } },
    create: { userId: user.id, termLabel },
    update: {},
  });

  const bloque = await prisma.timeBlock.create({
    data: { ...v.bloque, scheduleId: schedule.id, origen: "manual" },
  });

  return Response.json({ bloque }, { status: 201 });
}
