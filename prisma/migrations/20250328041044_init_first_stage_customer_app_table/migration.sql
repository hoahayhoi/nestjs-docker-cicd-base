-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "avatar" TEXT,
    "loginProvider" VARCHAR(10) NOT NULL DEFAULT 'LOCAL',
    "providerKey" VARCHAR(255),
    "role" VARCHAR(20) NOT NULL DEFAULT 'Customer',
    "branchId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technicians" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "specialization" VARCHAR(100),
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    "total_review" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAddress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phoneNumber" VARCHAR(15) NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrderDetail" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "rating" INTEGER,

    CONSTRAINT "ServiceOrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "fullName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "address" TEXT NOT NULL,
    "serviceOrderId" INTEGER NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "scheduledTime" TIME NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "currentStatus" VARCHAR(50) NOT NULL,
    "customerNote" TEXT,
    "employeeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelReason" TEXT,
    "rescheduleCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatus" (
    "id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "update_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AppointmentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "deviceType" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    "review_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceImages" (
    "id" SERIAL NOT NULL,
    "service_cat_id" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "ServiceImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "assignDate" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "resultImage" TEXT,
    "orderId" INTEGER,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "serviceOrdersDetailId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "technicianId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "mediaList" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devices" (
    "device_id" SERIAL NOT NULL,
    "customerID" INTEGER NOT NULL,
    "device_token" TEXT NOT NULL,
    "device_type" VARCHAR(20) NOT NULL,
    "os_version" VARCHAR(50),
    "app_version" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Devices_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "notification_id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "action_url" TEXT,
    "sent_by" VARCHAR(50) NOT NULL DEFAULT 'System',
    "schedule_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Technicians_user_id_key" ON "Technicians"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserAddress_userId_key" ON "UserAddress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_serviceOrderId_key" ON "Appointment"("serviceOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentStatus_appointment_id_key" ON "AppointmentStatus"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "Devices_device_token_key" ON "Devices"("device_token");

-- AddForeignKey
ALTER TABLE "Technicians" ADD CONSTRAINT "Technicians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderDetail" ADD CONSTRAINT "ServiceOrderDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatus" ADD CONSTRAINT "AppointmentStatus_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceImages" ADD CONSTRAINT "ServiceImages_service_cat_id_fkey" FOREIGN KEY ("service_cat_id") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Technicians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceOrdersDetailId_fkey" FOREIGN KEY ("serviceOrdersDetailId") REFERENCES "ServiceOrderDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technicians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
