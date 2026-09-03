import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Sin esto, `pg` cae a localhost:5432 y el error que ves es un ECONNREFUSED
// que no menciona la variable. Next carga .env solo; un script suelto no
// (correlos con `tsx --env-file=.env`).
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL. Copiá .env.example a .env y llenalo.");

// Prisma 7 exige un driver adapter para providers SQL: ya no hay engine binario.
const adapter = new PrismaPg({
  connectionString: url,
  connectionTimeoutMillis: 5000,
  max: 10,
});

// En dev, Next recarga los modulos en cada cambio. Sin el singleton se abriria
// un pool nuevo por recarga hasta agotar las conexiones de Postgres.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
