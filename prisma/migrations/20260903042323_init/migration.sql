-- CreateEnum
CREATE TYPE "Sede" AS ENUM ('ROBLEDO', 'FRATERNIDAD');

-- CreateEnum
CREATE TYPE "Dia" AS ENUM ('lun', 'mar', 'mie', 'jue', 'vie', 'sab');

-- CreateEnum
CREATE TYPE "TipoBloque" AS ENUM ('OCUPADO', 'DISPONIBLE');

-- CreateEnum
CREATE TYPE "OrigenBloque" AS ENUM ('foto', 'manual');

-- CreateEnum
CREATE TYPE "EstadoAmistad" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "carnet" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "status" "EstadoAmistad" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "termLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeBlock" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "dia" "Dia" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "sede" "Sede" NOT NULL,
    "tipo" "TipoBloque" NOT NULL DEFAULT 'OCUPADO',
    "origen" "OrigenBloque" NOT NULL DEFAULT 'foto',

    CONSTRAINT "TimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_carnet_key" ON "User"("carnet");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_tokenHash_key" ON "DeviceToken"("tokenHash");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "Friendship_destinatarioId_status_idx" ON "Friendship"("destinatarioId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_solicitanteId_destinatarioId_key" ON "Friendship"("solicitanteId", "destinatarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_userId_termLabel_key" ON "Schedule"("userId", "termLabel");

-- CreateIndex
CREATE INDEX "TimeBlock_scheduleId_dia_sede_idx" ON "TimeBlock"("scheduleId", "dia", "sede");

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
