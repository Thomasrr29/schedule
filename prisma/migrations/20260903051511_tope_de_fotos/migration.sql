-- AlterTable
ALTER TABLE "User" ADD COLUMN     "extraccionesFecha" TEXT,
ADD COLUMN     "extraccionesHoy" INTEGER NOT NULL DEFAULT 0;
