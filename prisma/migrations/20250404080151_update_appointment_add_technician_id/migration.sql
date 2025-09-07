-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "technicianId" INTEGER;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technicians"("id") ON DELETE SET NULL ON UPDATE CASCADE;
