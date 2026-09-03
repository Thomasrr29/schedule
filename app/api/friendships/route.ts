import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "no autenticado" }, { status: 401 });

  const filas = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ solicitanteId: user.id }, { destinatarioId: user.id }],
    },
    select: {
      id: true,
      solicitante: { select: { id: true, name: true } },
      destinatario: { select: { id: true, name: true } },
    },
  });

  // Al que le importa al que pregunta es el otro, sin importar quién invitó.
  return Response.json(
    filas.map((f) => ({
      id: f.id,
      amigo: f.solicitante.id === user.id ? f.destinatario : f.solicitante,
    })),
  );
}
