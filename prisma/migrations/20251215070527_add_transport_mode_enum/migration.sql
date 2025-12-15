-- CreateEnum
CREATE TYPE "public"."TransportMode" AS ENUM ('FLIGHT', 'TRAIN', 'BUS', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Participant" ADD COLUMN     "arrivalDetailsSubmitted" BOOLEAN DEFAULT false,
ADD COLUMN     "arrivalFrom" TEXT,
ADD COLUMN     "arrivalTo" TEXT,
ADD COLUMN     "expectedArrivalTime" TIMESTAMP(3),
ADD COLUMN     "interestedInCarpool" BOOLEAN DEFAULT false,
ADD COLUMN     "transportMode" "public"."TransportMode";
