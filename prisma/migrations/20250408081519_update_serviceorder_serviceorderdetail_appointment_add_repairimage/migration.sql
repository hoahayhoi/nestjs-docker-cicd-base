/*
  Warnings:

  - Added the required column `totalAmount` to the `ServiceOrder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AppointmentCancelBy" AS ENUM ('customer', 'technician', 'admin');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cancelBy" "AppointmentCancelBy",
ADD COLUMN     "diagnosis" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "totalAmount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ServiceOrderDetail" ADD COLUMN     "additionalPrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "basePrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "finalPrice" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RepairImage" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RepairImage" ADD CONSTRAINT "RepairImage_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
