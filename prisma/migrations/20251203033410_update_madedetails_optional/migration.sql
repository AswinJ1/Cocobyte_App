/*
  Warnings:

  - Made the column `college` on table `Participant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Participant" ALTER COLUMN "college" SET NOT NULL,
ALTER COLUMN "hostelName" DROP NOT NULL,
ALTER COLUMN "wifiusername" DROP NOT NULL,
ALTER COLUMN "wifiPassword" DROP NOT NULL,
ALTER COLUMN "contactNumber" DROP NOT NULL;
