/*
  Warnings:

  - You are about to drop the column `sede` on the `TimeBlock` table. All the data in the column will be lost.
  - Added the required column `sedeId` to the `TimeBlock` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TimeBlock_scheduleId_dia_sede_idx";

-- AlterTable
ALTER TABLE "TimeBlock" DROP COLUMN "sede",
ADD COLUMN     "aula" TEXT,
ADD COLUMN     "sedeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Sede";

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "alias" TEXT[],
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sede_nombre_key" ON "Sede"("nombre");

-- CreateIndex
CREATE INDEX "TimeBlock_scheduleId_dia_sedeId_idx" ON "TimeBlock"("scheduleId", "dia", "sedeId");

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
