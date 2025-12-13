-- CreateTable
CREATE TABLE "public"."UserLocation" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "siteName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserLocation_participantId_key" ON "public"."UserLocation"("participantId");

-- CreateIndex
CREATE INDEX "UserLocation_siteName_idx" ON "public"."UserLocation"("siteName");

-- CreateIndex
CREATE INDEX "UserLocation_isActive_idx" ON "public"."UserLocation"("isActive");

-- AddForeignKey
ALTER TABLE "public"."UserLocation" ADD CONSTRAINT "UserLocation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
