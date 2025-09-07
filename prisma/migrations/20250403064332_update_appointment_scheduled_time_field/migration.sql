/*
  Warnings:

  - Changed the type of `scheduledTime` on the `Appointment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "scheduledTime",
ADD COLUMN     "scheduledTime" VARCHAR(10) NOT NULL;
