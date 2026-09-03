-- CreateTable
CREATE TABLE "Invitacion" (
    "codigo" TEXT NOT NULL,
    "emisorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitacion_pkey" PRIMARY KEY ("codigo")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitacion_emisorId_key" ON "Invitacion"("emisorId");

-- AddForeignKey
ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_emisorId_fkey" FOREIGN KEY ("emisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
