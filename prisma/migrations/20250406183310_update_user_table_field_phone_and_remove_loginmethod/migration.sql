/*
  Warnings:

  - You are about to drop the column `login_method` on the `User` table. All the data in the column will be lost.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "login_method",
ALTER COLUMN "phone" SET NOT NULL;
