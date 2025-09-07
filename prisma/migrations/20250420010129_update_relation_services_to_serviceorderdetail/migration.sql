-- AddForeignKey
ALTER TABLE "ServiceOrderDetail" ADD CONSTRAINT "ServiceOrderDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
