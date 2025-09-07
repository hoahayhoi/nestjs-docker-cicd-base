/*
  Warnings:

  - You are about to drop the column `serviceOrderDetailId` on the `UsedSparePart` table. All the data in the column will be lost.
  - Added the required column `appointmentId` to the `UsedSparePart` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UsedSparePart" DROP CONSTRAINT "UsedSparePart_serviceOrderDetailId_fkey";

-- AlterTable
ALTER TABLE "UsedSparePart" DROP COLUMN "serviceOrderDetailId",
ADD COLUMN     "appointmentId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "UsedSparePart" ADD CONSTRAINT "UsedSparePart_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
