/*
  Warnings:

  - You are about to drop the column `appointment_id` on the `Notifications` table. All the data in the column will be lost.
  - The `status` column on the `Notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `UserNotification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `entity_type` to the `Notifications` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `entity_type` to the `UserNotification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('appointment', 'promotion', 'system');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('sms', 'email', 'push');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('sent', 'failed');

-- CreateEnum
CREATE TYPE "UserNotificationStatus" AS ENUM ('pending', 'delivered', 'read', 'failed');

-- AlterTable
ALTER TABLE "Notifications" DROP COLUMN "appointment_id",
ADD COLUMN     "entity_id" INTEGER,
ADD COLUMN     "entity_type" "EntityType" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'sent';

-- AlterTable
ALTER TABLE "UserNotification" ADD COLUMN     "delivered_at" TIMESTAMP(3),
ADD COLUMN     "entity_id" INTEGER,
ADD COLUMN     "entity_type" "EntityType" NOT NULL,
ALTER COLUMN "device_id" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "UserNotificationStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Notifications_entity_type_entity_id_idx" ON "Notifications"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "UserNotification_user_id_status_idx" ON "UserNotification"("user_id", "status");

-- CreateIndex
CREATE INDEX "UserNotification_entity_type_entity_id_idx" ON "UserNotification"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "Notifications"("notification_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "Devices"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;
