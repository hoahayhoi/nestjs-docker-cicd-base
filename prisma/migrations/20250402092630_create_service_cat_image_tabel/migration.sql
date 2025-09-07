/*
  Warnings:

  - You are about to drop the column `service_cat_id` on the `ServiceImages` table. All the data in the column will be lost.
  - Added the required column `service_id` to the `ServiceImages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ServiceImages" DROP CONSTRAINT "ServiceImages_service_cat_id_fkey";

-- AlterTable
ALTER TABLE "ServiceImages" DROP COLUMN "service_cat_id",
ADD COLUMN     "service_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ServiceCatImages" (
    "id" SERIAL NOT NULL,
    "service_cat_id" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "ServiceCatImages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceImages" ADD CONSTRAINT "ServiceImages_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCatImages" ADD CONSTRAINT "ServiceCatImages_service_cat_id_fkey" FOREIGN KEY ("service_cat_id") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
