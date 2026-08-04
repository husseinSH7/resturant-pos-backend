-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'CALLED', 'SEATED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "customerId" TEXT,
    "tableId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "guestCount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "specialRequests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "guestCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "estimatedWait" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seatedAt" TIMESTAMP(3),

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_restaurantId_idx" ON "Reservation"("restaurantId");

-- CreateIndex
CREATE INDEX "Reservation_date_idx" ON "Reservation"("date");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_customerId_idx" ON "Reservation"("customerId");

-- CreateIndex
CREATE INDEX "Reservation_tableId_idx" ON "Reservation"("tableId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_restaurantId_idx" ON "WaitlistEntry"("restaurantId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_status_idx" ON "WaitlistEntry"("status");

-- CreateIndex
CREATE INDEX "WaitlistEntry_createdAt_idx" ON "WaitlistEntry"("createdAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_customerId_idx" ON "WaitlistEntry"("customerId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
