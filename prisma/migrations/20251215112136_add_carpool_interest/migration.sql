-- AlterTable
ALTER TABLE "public"."Participant" ADD COLUMN     "carpoolContactNumber" TEXT;

-- CreateTable
CREATE TABLE "public"."CarpoolInterest" (
    "id" TEXT NOT NULL,
    "arrivalOwnerId" TEXT NOT NULL,
    "interestedParticipantId" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarpoolInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarpoolInterest_arrivalOwnerId_idx" ON "public"."CarpoolInterest"("arrivalOwnerId");

-- CreateIndex
CREATE INDEX "CarpoolInterest_interestedParticipantId_idx" ON "public"."CarpoolInterest"("interestedParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "CarpoolInterest_arrivalOwnerId_interestedParticipantId_key" ON "public"."CarpoolInterest"("arrivalOwnerId", "interestedParticipantId");

-- AddForeignKey
ALTER TABLE "public"."CarpoolInterest" ADD CONSTRAINT "CarpoolInterest_arrivalOwnerId_fkey" FOREIGN KEY ("arrivalOwnerId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarpoolInterest" ADD CONSTRAINT "CarpoolInterest_interestedParticipantId_fkey" FOREIGN KEY ("interestedParticipantId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
