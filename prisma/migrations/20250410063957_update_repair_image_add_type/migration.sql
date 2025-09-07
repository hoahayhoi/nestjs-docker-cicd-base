/*
  Warnings:

  - Added the required column `image_type` to the `RepairImage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RepairImageTypeEnum" AS ENUM ('pre', 'post');

-- AlterTable
ALTER TABLE "RepairImage" ADD COLUMN     "image_type" "RepairImageTypeEnum" NOT NULL;
