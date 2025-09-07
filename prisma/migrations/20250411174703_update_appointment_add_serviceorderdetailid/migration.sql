/*
  Warnings:

  - A unique constraint covering the columns `[serviceOrderDetailId]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serviceOrderDetailId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "serviceOrderDetailId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_serviceOrderDetailId_key" ON "Appointment"("serviceOrderDetailId");
