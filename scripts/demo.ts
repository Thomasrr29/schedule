/**
 * Siembra una amiga de prueba con un horario que cruza con el tuyo en unos
 * puntos y en otros no, para poder ver el dashboard antes de invitar a nadie.
 *
 *   npx tsx --env-file=.env scripts/demo.ts <tu-carnet>
 *   npx tsx --env-file=.env scripts/demo.ts <tu-carnet> --limpiar
 */
import { prisma } from "@/lib/db";
import { hashPin } from "@/lib/auth";
import { TERM_ACTUAL } from "@/lib/config";
import type { Dia, Sede, TipoBloque } from "@/lib/generated/prisma/enums";

const CARNET_DEMO = "9999001";

const BLOQUES: [string, Dia, string, string, Sede, TipoBloque][] = [
  // Lunes: yo salgo 12:00 y ella entra 12:00 -> cruce en la puerta (corto).
  ["Estadística", "lun", "12:00", "14:00", "ROBLEDO", "OCUPADO"],
  // Martes: misma hora que mi clase pero en la otra sede -> no cuenta.
  ["Física II", "mar", "14:00", "16:00", "FRATERNIDAD", "OCUPADO"],
  // Miércoles: mi bloque DISPONIBLE no se resta -> encuentro largo al salir ella.
  ["Redes", "mie", "14:00", "16:00", "ROBLEDO", "OCUPADO"],
  // Jueves: ella sola en el campus, yo no caigo -> nada.
  ["Ética", "jue", "08:00", "10:00", "ROBLEDO", "OCUPADO"],
  // Viernes: yo salgo 09:00, ella entra 09:00, misma sede -> corto.
  ["Cálculo II", "vie", "09:00", "11:00", "FRATERNIDAD", "OCUPADO"],
];

async function main() {
  const carnet = process.argv[2];
  const limpiar = process.argv.includes("--limpiar");
  if (!carnet) throw new Error("Pasá tu carnet: npx tsx --env-file=.env scripts/demo.ts 1088234");

  if (limpiar) {
    const { count } = await prisma.user.deleteMany({ where: { carnet: CARNET_DEMO } });
    console.log(count ? "Camila borrada (con su horario y la amistad)" : "No había nada que borrar");
    return prisma.$disconnect();
  }

  const yo = await prisma.user.findUnique({ where: { carnet } });
  if (!yo) throw new Error(`No existe el carnet ${carnet}. Creá tu cuenta primero en /entrar`);

  await prisma.user.deleteMany({ where: { carnet: CARNET_DEMO } });
  const camila = await prisma.user.create({
    data: {
      name: "Camila",
      carnet: CARNET_DEMO,
      pinHash: await hashPin("0000"),
      schedules: {
        create: {
          termLabel: TERM_ACTUAL,
          blocks: {
            create: BLOQUES.map(([titulo, dia, horaInicio, horaFin, sede, tipo]) => ({
              titulo, dia, horaInicio, horaFin, sede, tipo, origen: "manual" as const,
            })),
          },
        },
      },
    },
  });

  await prisma.friendship.create({
    data: { solicitanteId: camila.id, destinatarioId: yo.id, status: "ACCEPTED", respondedAt: new Date() },
  });

  console.log(`Camila (carnet ${CARNET_DEMO}, PIN 0000) creada con ${BLOQUES.length} bloques y emparchada con ${yo.name}.`);
  await prisma.$disconnect();
}

main();
