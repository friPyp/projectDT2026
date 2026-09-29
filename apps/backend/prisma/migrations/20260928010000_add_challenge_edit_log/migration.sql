-- CreateTable
CREATE TABLE "challenge_edit_logs" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedFields" JSONB NOT NULL,

    CONSTRAINT "challenge_edit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenge_edit_logs_challengeId_idx" ON "challenge_edit_logs"("challengeId");

-- AddForeignKey
ALTER TABLE "challenge_edit_logs" ADD CONSTRAINT "challenge_edit_logs_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
