-- AlterTable
ALTER TABLE "public"."Participant" ADD COLUMN     "checkInTime" TIMESTAMP(3),
ADD COLUMN     "isCheckedIn" BOOLEAN NOT NULL DEFAULT false;
