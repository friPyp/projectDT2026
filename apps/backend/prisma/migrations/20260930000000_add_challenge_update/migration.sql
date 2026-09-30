-- CreateTable
CREATE TABLE "challenge_updates" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenge_updates_challengeId_idx" ON "challenge_updates"("challengeId");

-- AddForeignKey
ALTER TABLE "challenge_updates" ADD CONSTRAINT "challenge_updates_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_updates" ADD CONSTRAINT "challenge_updates_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
