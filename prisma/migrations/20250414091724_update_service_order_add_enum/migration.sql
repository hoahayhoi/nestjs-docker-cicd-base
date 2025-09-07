-- CreateEnum
CREATE TYPE "PaymentMethodEnum" AS ENUM ('cash', 'bank_transfer');

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "paymentMethod" "PaymentMethodEnum";
