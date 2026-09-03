import { randomInt } from "node:crypto";
import { prisma } from "@/lib/db";

// Sin 0/O ni 1/l/I: el código se dicta en voz alta o se copia a mano.
const ALFABETO = "23456789abcdefghjkmnpqrstuvwxyz";
const LARGO = 8;

const nuevoCodigo = () =>
  Array.from({ length: LARGO }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");

/** Un link por persona, estable: se pega una vez en el grupo y sigue sirviendo. */
export async function miCodigo(userId: string): Promise<string> {
  const existente = await prisma.invitacion.findUnique({ where: { emisorId: userId } });
  if (existente) return existente.codigo;
  const creada = await prisma.invitacion.create({ data: { codigo: nuevoCodigo(), emisorId: userId } });
  return creada.codigo;
}

/** La salida si el link se filtra: el viejo deja de servir. */
export async function regenerarCodigo(userId: string): Promise<string> {
  await prisma.invitacion.deleteMany({ where: { emisorId: userId } });
  const creada = await prisma.invitacion.create({ data: { codigo: nuevoCodigo(), emisorId: userId } });
  return creada.codigo;
}

export type Resultado =
  | { estado: "listo" | "ya_eran"; amigo: string }
  | { estado: "vos_mismo" | "no_existe" };

export async function aceptarInvitacion(codigo: string, userId: string): Promise<Resultado> {
  const inv = await prisma.invitacion.findUnique({
    where: { codigo },
    select: { emisor: { select: { id: true, name: true } } },
  });
  if (!inv) return { estado: "no_existe" };
  if (inv.emisor.id === userId) return { estado: "vos_mismo" };

  // El unique es [solicitante, destinatario], asi que A->B y B->A son filas
  // distintas para la base. Hay que mirar los dos sentidos a mano.
  const ya = await prisma.friendship.findFirst({
    where: {
      OR: [
        { solicitanteId: inv.emisor.id, destinatarioId: userId },
        { solicitanteId: userId, destinatarioId: inv.emisor.id },
      ],
    },
  });

  if (ya) {
    if (ya.status !== "ACCEPTED") {
      await prisma.friendship.update({
        where: { id: ya.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
    }
    return { estado: "ya_eran", amigo: inv.emisor.name };
  }

  await prisma.friendship.create({
    data: {
      solicitanteId: inv.emisor.id,
      destinatarioId: userId,
      status: "ACCEPTED",
      respondedAt: new Date(),
    },
  });
  return { estado: "listo", amigo: inv.emisor.name };
}
