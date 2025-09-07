/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `ServiceCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Services` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `ServiceCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "slug" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "ServiceCategory" ADD COLUMN     "slug" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "Services" ADD COLUMN     "slug" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Services_slug_key" ON "Services"("slug");
