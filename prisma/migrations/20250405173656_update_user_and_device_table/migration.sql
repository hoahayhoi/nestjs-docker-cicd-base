/*
  Warnings:

  - You are about to drop the column `customerID` on the `Devices` table. All the data in the column will be lost.
  - Added the required column `last_activity` to the `Devices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Devices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Devices" DROP COLUMN "customerID",
ADD COLUMN     "last_activity" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
