/*
  Warnings:

  - You are about to alter the column `average_rating` on the `Services` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Services" ALTER COLUMN "average_rating" SET DATA TYPE DOUBLE PRECISION;
