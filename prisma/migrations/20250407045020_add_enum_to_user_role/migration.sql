-- CreateEnum
CREATE TYPE "RoleEnum" AS ENUM ('customer', 'technician', 'admin');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
