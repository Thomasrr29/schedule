import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validarBloque } from "@/lib/validar";
import { idsDeSedes } from "@/lib/sedes";

/** Confirma que el bloque existe y es del que pregunta. Sin esto, cualquiera
 *  con un id podria editar el horario ajeno. */
async function delDueño(id: string, userId: string) {
  const bloque = await prisma.timeBlock.findUnique({
    where: { id },
    select: { id: true, schedule: { select: { userId: true } } },
  });
  return bloque && bloque.schedule.userId === userId ? bloque : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const { id } = await params;
  if (!(await delDueño(id, user.id))) return Response.json({ error: "no existe" }, { status: 404 });

  const v = validarBloque(await req.json().catch(() => null), await idsDeSedes());
  if (!v.ok) return Response.json({ error: v.error }, { status: 400 });

  return Response.json({ bloque: await prisma.timeBlock.update({ where: { id }, data: v.bloque }) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const { id } = await params;
  if (!(await delDueño(id, user.id))) return Response.json({ error: "no existe" }, { status: 404 });

  await prisma.timeBlock.delete({ where: { id } });
  return Response.json({ ok: true });
}
