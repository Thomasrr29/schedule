import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { miCodigo } from "@/lib/invitaciones";
import { BottomNav } from "@/components/ui/BottomNav";
import { Parceros } from "./Parceros";

export default async function Amigos() {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");

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

  const amigos = filas.map((f) => ({
    id: f.id,
    amigo: f.solicitante.id === user.id ? f.destinatario : f.solicitante,
  }));

  return (
    <>
      <Parceros link={`${protocolo}://${host}/i/${codigo}`} amigos={amigos} />
      <BottomNav />
    </>
  );
}
