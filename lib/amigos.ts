import { prisma } from "@/lib/db";

/** La amistad es una sola fila: quien la pidió y quien la aceptó. Para saber
 *  con quién estás emparchado hay que mirar los dos lados. */
export async function idsDeAmigos(userId: string): Promise<string[]> {
  const filas = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ solicitanteId: userId }, { destinatarioId: userId }],
    },
    select: { solicitanteId: true, destinatarioId: true },
  });
  return filas.map((f) => (f.solicitanteId === userId ? f.destinatarioId : f.solicitanteId));
}
