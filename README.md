# ¿Quién cayó?

Saber cuándo coincidís con tus parceros en la U, sin escribirle a cada uno por
WhatsApp cada semana.

Stack: Next.js 16 (App Router) · Prisma 7 + PostgreSQL · Tailwind v4 · Claude Haiku 4.5.

## Arrancar

```bash
npm install
cp .env.example .env      # y llenar DATABASE_URL + ANTHROPIC_API_KEY
npx prisma migrate dev --name init
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor en http://localhost:3000 |
| `npm run check` | Casos borde del motor de cruce, sin base de datos |
| `npx prisma migrate dev` | Aplica cambios del schema |
| `npx prisma studio` | Ver y editar la base a mano (aquí se resetean PINs) |

## Detalles de Prisma 7

No es como la v6. Tres cosas que rompen si se olvidan:

1. **La URL no va en `schema.prisma`** sino en `prisma7.config.ts`, y ese archivo
   necesita `import "dotenv/config"` porque Prisma ya no lee `.env` solo.
2. **Driver adapter obligatorio.** Ya no hay engine binario: `lib/db.ts` conecta
   con `@prisma/adapter-pg`. Sin adapter el cliente no arranca.
3. **El cliente se genera en `lib/generated/prisma/`** y se importa de ahí, no de
   `@prisma/client`. Los tipos salen de `/client`, los enums de `/enums`.

## Mapa

```
lib/
  matching.ts   ventanas de presencia + solape + clasificación   <- el corazón
  time.ts       intervalos en minutos, "ahora" en America/Bogota
  auth.ts       cookie de sesión, PIN, bloqueo por intentos
  claude.ts     lee la foto del horario
  config.ts     márgenes, semestre activo, zona horaria
  db.ts         cliente Prisma con adapter
scripts/check-matching.ts   los casos borde del cruce
```

## Decisiones que no son obvias

- **Coincidencia = presencia, no tiempo libre.** Los encuentros pasan en los
  bordes: saliendo de clase, llegando 15 min antes. Por eso la ventana de
  presencia se extiende 15 min antes y 30 después.
- **Se agrupa por `(día, sede)`, no por día.** Robledo 8-10 y Fraternidad 14-16
  son dos ventanas, no una de 8 a 16: entre las dos vas en camino.
- **Nada se precalcula.** Con 20 bloques por persona cruzar en memoria es
  instantáneo, y si un amigo corrige su horario tu siguiente carga ya lo ve.
- **La foto nunca se guarda**, solo los bloques que el usuario confirmó.
- **No hay recuperación de PIN.** El reset es a mano en `prisma studio`. Con 8
  personas se aguanta, pero hay que avisarles al invitarlas.
