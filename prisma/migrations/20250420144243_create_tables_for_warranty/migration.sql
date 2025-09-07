-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('Active', 'Expired', 'Void', 'Claimed');

-- CreateEnum
CREATE TYPE "WarrantyUnit" AS ENUM ('days', 'months', 'years');

-- AlterTable
ALTER TABLE "Services" ADD COLUMN     "warranty_period" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warranty_unit" "WarrantyUnit" NOT NULL DEFAULT 'months';

-- CreateTable
CREATE TABLE "ServiceWarranty" (
    "id" SERIAL NOT NULL,
    "orderDetailId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'Active',
    "claims_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "ServiceWarranty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceWarranty_orderDetailId_key" ON "ServiceWarranty"("orderDetailId");

-- CreateIndex
CREATE INDEX "ServiceWarranty_orderDetailId_idx" ON "ServiceWarranty"("orderDetailId");

-- CreateIndex
CREATE INDEX "ServiceWarranty_serviceId_idx" ON "ServiceWarranty"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceWarranty_end_date_idx" ON "ServiceWarranty"("end_date");

-- AddForeignKey
ALTER TABLE "ServiceWarranty" ADD CONSTRAINT "ServiceWarranty_orderDetailId_fkey" FOREIGN KEY ("orderDetailId") REFERENCES "ServiceOrderDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceWarranty" ADD CONSTRAINT "ServiceWarranty_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
