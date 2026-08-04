-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'GIFT_CARD';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "giftCardId" TEXT;

-- CreateTable
CREATE TABLE "GiftCard" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "customerId" TEXT,
    "cardNumber" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "initialAmount" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftCard_cardNumber_key" ON "GiftCard"("cardNumber");

-- CreateIndex
CREATE INDEX "GiftCard_restaurantId_idx" ON "GiftCard"("restaurantId");

-- CreateIndex
CREATE INDEX "GiftCard_cardNumber_idx" ON "GiftCard"("cardNumber");

-- CreateIndex
CREATE INDEX "GiftCard_customerId_idx" ON "GiftCard"("customerId");

-- CreateIndex
CREATE INDEX "Payment_giftCardId_idx" ON "Payment"("giftCardId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
