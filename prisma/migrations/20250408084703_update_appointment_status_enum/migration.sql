/*
  Warnings:

  - The values [processing] on the enum `AppointmentStatusEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentStatusEnum_new" AS ENUM ('booked', 'confirmed', 'en_route', 'quoted', 'quote_confirmed', 'in_progress', 'technician_done', 'completed', 'cancelled');
ALTER TABLE "Appointment" ALTER COLUMN "currentStatus" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "currentStatus" TYPE "AppointmentStatusEnum_new" USING ("currentStatus"::text::"AppointmentStatusEnum_new");
ALTER TYPE "AppointmentStatusEnum" RENAME TO "AppointmentStatusEnum_old";
ALTER TYPE "AppointmentStatusEnum_new" RENAME TO "AppointmentStatusEnum";
DROP TYPE "AppointmentStatusEnum_old";
ALTER TABLE "Appointment" ALTER COLUMN "currentStatus" SET DEFAULT 'booked';
COMMIT;
