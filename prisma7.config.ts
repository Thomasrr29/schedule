import "dotenv/config"; // debe ir primero: Prisma 7 ya no lee .env solo
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // --env-file porque Next carga .env solo, pero un script suelto no.
    seed: "tsx --env-file=.env prisma/seed.ts",
  },
  datasource: {
    // Este archivo lo lee SOLO el CLI (migrate, studio, seed), nunca la app —
    // la app conecta por lib/db.ts con DATABASE_URL, o sea por el pooler.
    //
    // El CLI va por la conexión directa a propósito: PgBouncer en modo
    // transacción devuelve la conexión al pool sin soltar el advisory lock que
    // usan las migraciones, y el siguiente `migrate` se queda esperándolo para
    // siempre. Si no hay pooler de por medio, DIRECT_URL sobra.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
