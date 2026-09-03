import { prisma } from "@/lib/db";
import { TERM_ACTUAL } from "@/lib/config";
import { idsDeAmigos } from "@/lib/amigos";
import { calcularCoincidencias, type BloqueBase, type Coincidencia } from "@/lib/matching";

export type AmigoConCoincidencias = {
  amigo: { id: string; name: string };
  coincidencias: Coincidencia[];
};

/** Prisma anida el nombre de la sede; el motor de cruce lo quiere plano. */
const aplanar = (
  bloques: (Omit<BloqueBase, "sedeNombre"> & { sede: { nombre: string } })[],
): BloqueBase[] => bloques.map(({ sede, ...b }) => ({ ...b, sedeNombre: sede.nombre }));

/**
 * Nada de esto se precalcula ni se guarda: con ~20 bloques por persona cruzar
 * en memoria es instantaneo, y si un amigo corrige su horario la siguiente
 * carga ya lo refleja. No hay job de sincronizacion que se pueda quedar viejo.
 *
 * Vive aparte del route handler porque el dashboard lo llama directo — pasar
 * por un fetch a mi propia API seria una vuelta de red de gratis.
 */
export async function coincidenciasDe(userId: string): Promise<AmigoConCoincidencias[]> {
  const amigos = await idsDeAmigos(userId);
  if (amigos.length === 0) return [];

  // Mi horario y el de todos los amigos en una sola ida a la base.
  const horarios = await prisma.schedule.findMany({
    where: { userId: { in: [userId, ...amigos] }, termLabel: TERM_ACTUAL },
    include: {
      blocks: {
        select: {
          titulo: true, dia: true, horaInicio: true, horaFin: true, tipo: true,
          sedeId: true, sede: { select: { nombre: true } },
        },
      },
      user: { select: { id: true, name: true } },
    },
  });

  const mio = horarios.find((h) => h.user.id === userId);
  if (!mio || mio.blocks.length === 0) return [];
  const misBloques = aplanar(mio.blocks);

  return horarios
    .filter((h) => h.user.id !== userId)
    .map((h) => ({
      amigo: h.user,
      coincidencias: calcularCoincidencias(misBloques, aplanar(h.blocks)),
    }));
}
