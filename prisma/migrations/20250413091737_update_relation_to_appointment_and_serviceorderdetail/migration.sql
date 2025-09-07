-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceOrderDetailId_fkey" FOREIGN KEY ("serviceOrderDetailId") REFERENCES "ServiceOrderDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
