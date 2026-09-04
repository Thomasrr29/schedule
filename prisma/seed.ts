/**
 * Datos de referencia: las sedes del ITM. Se corre con `npx prisma db seed` y
 * es idempotente — volver a correrlo actualiza nombres y alias sin duplicar.
 *
 * Para agregar una sede no hace falta tocar código: insertá la fila.
 */
import { prisma } from "@/lib/db";

const SEDES = [
  { id: "robledo", nombre: "Robledo", orden: 1, alias: ["ROBLEDO"] },
  { id: "fraternidad", nombre: "Fraternidad", orden: 2, alias: ["FRATERNIDAD"] },
  { id: "cata", nombre: "CATA", orden: 3, alias: ["CATA"] },
  { id: "floresta", nombre: "Floresta", orden: 4, alias: ["FLORESTA", "LA FLORESTA"] },
  { id: "castilla", nombre: "Castilla", orden: 5, alias: ["CASTILLA"] },
];

async function main() {
  for (const sede of SEDES) {
    await prisma.sede.upsert({ where: { id: sede.id }, create: sede, update: sede });
  }
  console.log(`${SEDES.length} sedes listas: ${SEDES.map((s) => s.nombre).join(", ")}`);
  await prisma.$disconnect();
}

main();
