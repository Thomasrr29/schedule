import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const termLabel = new URL(req.url).searchParams.get("term") ?? TERM_ACTUAL;

  const schedule = await prisma.schedule.findUnique({
    where: { userId_termLabel: { userId: user.id, termLabel } },
    include: { blocks: { orderBy: [{ dia: "asc" }, { horaInicio: "asc" }] } },
  });

  return Response.json({ termLabel, bloques: schedule?.blocks ?? [] });
}
