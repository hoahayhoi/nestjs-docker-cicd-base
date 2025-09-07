-- CreateEnum
CREATE TYPE "ChangedBy" AS ENUM ('system', 'customer', 'technician', 'admin');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('delay', 'quality', 'technician', 'other');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('pending', 'resolved');

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "old_status" VARCHAR(50),
    "new_status" VARCHAR(50) NOT NULL,
    "changed_by" "ChangedBy" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRequests" (
    "id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "issue_type" "IssueType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SupportStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "SupportRequests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StatusHistory_appointment_id_key" ON "StatusHistory"("appointment_id");

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequests" ADD CONSTRAINT "SupportRequests_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequests" ADD CONSTRAINT "SupportRequests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
