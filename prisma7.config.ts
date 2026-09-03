import "dotenv/config"; // debe ir primero: Prisma 7 ya no lee .env solo
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // --env-file porque Next carga .env solo, pero un script suelto no.
    seed: "tsx --env-file=.env prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
