/*
  Warnings:

  - You are about to drop the column `status` on the `Appointment` table. All the data in the column will be lost.
  - The `currentStatus` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AppointmentStatusEnum" AS ENUM ('booked', 'processing', 'en_route', 'in_progress', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "status",
DROP COLUMN "currentStatus",
ADD COLUMN     "currentStatus" "AppointmentStatusEnum" NOT NULL DEFAULT 'booked';
