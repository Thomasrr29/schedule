import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";
import { miCodigo } from "@/lib/invitaciones";
import { BottomNav } from "@/components/ui/BottomNav";
import { Parceros } from "./Parceros";

export default async function Amigos({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");

  const { bienvenida } = await searchParams;

  const [codigo, filas, cabeceras] = await Promise.all([
    miCodigo(user.id),
    prisma.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ solicitanteId: user.id }, { destinatarioId: user.id }] },
      select: {
        id: true,
        solicitante: { select: { id: true, name: true } },
        destinatario: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    headers(),
  ]);

  // El link se arma acá y no en el cliente: con window.location.origin el
  // servidor y el navegador renderizarían cosas distintas.
  const host = cabeceras.get("host") ?? "localhost:3000";
  const protocolo = cabeceras.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  const parejas = filas.map((f) => ({
    id: f.id,
    amigo: f.solicitante.id === user.id ? f.destinatario : f.solicitante,
  }));

  // El horario de cada parcero viaja con la página: son pocos bloques por
  // persona, y así el panel abre de una, sin spinner ni segundo viaje. Solo
  // el semestre activo — el del semestre pasado no le sirve a nadie.
  const horarios = await prisma.schedule.findMany({
    where: { userId: { in: parejas.map((p) => p.amigo.id) }, termLabel: TERM_ACTUAL },
    select: {
      userId: true,
      blocks: {
        orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
        select: {
          id: true, titulo: true, dia: true, horaInicio: true, horaFin: true,
          aula: true, tipo: true, sede: { select: { nombre: true } },
        },
      },
    },
  });
  const bloquesDe = new Map(
    horarios.map((h) => [h.userId, h.blocks.map(({ sede, ...b }) => ({ ...b, sedeNombre: sede.nombre }))]),
  );

  const amigos = parejas.map((p) => ({ ...p, bloques: bloquesDe.get(p.amigo.id) ?? [] }));

  return (
    <>
      <Parceros
        link={`${protocolo}://${host}/i/${codigo}`}
        amigos={amigos}
        bienvenida={bienvenida === "1"}
      />
      <BottomNav />
    </>
  );
}
