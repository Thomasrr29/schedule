import { prisma } from "@/lib/db";
import type { SedeConAlias } from "@/lib/aula";

export type { SedeRef, SedeConAlias } from "@/lib/aula";
export { partirAula, reconocerSede } from "@/lib/aula";

export const listarSedes = (): Promise<SedeConAlias[]> =>
  prisma.sede.findMany({ select: { id: true, nombre: true, alias: true }, orderBy: { orden: "asc" } });

export const idsDeSedes = async () => new Set((await listarSedes()).map((s) => s.id));
