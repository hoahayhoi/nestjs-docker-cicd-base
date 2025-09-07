-- CreateTable
CREATE TABLE "UserNotification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_id" INTEGER NOT NULL,
    "device_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'unread',

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);
