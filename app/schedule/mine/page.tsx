import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";
import { listarSedes } from "@/lib/sedes";
import { BottomNav } from "@/components/ui/BottomNav";
import { EditorHorario } from "./EditorHorario";

// Server component: los bloques se renderizan de una, sin el parpadeo de
// "no tenés nada" mientras el cliente hace el fetch.
export default async function MiHorario() {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");

  const [schedule, sedes] = await Promise.all([
    prisma.schedule.findUnique({
      where: { userId_termLabel: { userId: user.id, termLabel: TERM_ACTUAL } },
      include: {
        blocks: {
          orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
          include: { sede: { select: { nombre: true } } },
        },
      },
    }),
    listarSedes(),
  ]);

  return (
    <>
      <EditorHorario bloques={schedule?.blocks ?? []} sedes={sedes} />
      <BottomNav />
    </>
  );
}
