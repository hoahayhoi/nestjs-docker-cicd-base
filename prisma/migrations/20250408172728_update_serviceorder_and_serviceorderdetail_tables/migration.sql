/*
  Warnings:

  - The `status` column on the `ServiceOrderDetail` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ServiceOrderStatusEnum" AS ENUM ('booked', 'confirmed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ServiceOrderDetailStatusEnum" AS ENUM ('booked', 'confirmed', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "status" "ServiceOrderStatusEnum" NOT NULL DEFAULT 'booked';

-- AlterTable
ALTER TABLE "ServiceOrderDetail" DROP COLUMN "status",
ADD COLUMN     "status" "ServiceOrderDetailStatusEnum" NOT NULL DEFAULT 'booked';
