import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** La única salida de un link mal clickeado. Cualquiera de los dos lados puede
 *  romper la amistad, y se borra la fila en vez de marcarla: no hay nada que
 *  recordar de una amistad que ya no existe. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.friendship.deleteMany({
    where: { id, OR: [{ solicitanteId: user.id }, { destinatarioId: user.id }] },
  });

  return count > 0
    ? Response.json({ ok: true })
    : Response.json({ error: "no existe" }, { status: 404 });
}
