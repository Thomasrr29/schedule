import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const horario = await prisma.schedule.findUnique({
    where: { userId_termLabel: { userId: user.id, termLabel: TERM_ACTUAL } },
    select: { _count: { select: { blocks: true } } },
  });

  return Response.json({
    id: user.id,
    name: user.name,
    carnet: user.carnet,
    tieneHorarioActivo: (horario?._count.blocks ?? 0) > 0,
  });
}
