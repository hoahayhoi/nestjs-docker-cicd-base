-- CreateTable
CREATE TABLE "UsedSparePart" (
    "id" SERIAL NOT NULL,
    "serviceOrderDetailId" INTEGER NOT NULL,
    "sparePartId" INTEGER NOT NULL,
    "quantityUsed" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsedSparePart_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UsedSparePart" ADD CONSTRAINT "UsedSparePart_serviceOrderDetailId_fkey" FOREIGN KEY ("serviceOrderDetailId") REFERENCES "ServiceOrderDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsedSparePart" ADD CONSTRAINT "UsedSparePart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
