-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'CUSTOM', 'PER_ITEM', 'PERCENTAGE');

-- CreateTable
CREATE TABLE "RestaurantSettings" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 8,
    "taxIncluded" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "receiptHeader" TEXT,
    "receiptFooter" TEXT,
    "receiptShowCustomerInfo" BOOLEAN NOT NULL DEFAULT true,
    "receiptShowServerInfo" BOOLEAN NOT NULL DEFAULT true,
    "enableGratuity" BOOLEAN NOT NULL DEFAULT false,
    "gratuityRates" JSONB NOT NULL DEFAULT '[]',
    "roundTo" TEXT NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSplit" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Split',
    "amount" DECIMAL(10,2) NOT NULL,
    "splitType" "SplitType" NOT NULL DEFAULT 'CUSTOM',
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSplit" (
    "id" TEXT NOT NULL,
    "orderSplitId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantSettings_restaurantId_key" ON "RestaurantSettings"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantSettings_restaurantId_idx" ON "RestaurantSettings"("restaurantId");

-- CreateIndex
CREATE INDEX "OrderSplit_orderId_idx" ON "OrderSplit"("orderId");

-- CreateIndex
CREATE INDEX "OrderSplit_customerId_idx" ON "OrderSplit"("customerId");

-- CreateIndex
CREATE INDEX "PaymentSplit_orderSplitId_idx" ON "PaymentSplit"("orderSplitId");

-- CreateIndex
CREATE INDEX "PaymentSplit_paymentId_idx" ON "PaymentSplit"("paymentId");

-- AddForeignKey
ALTER TABLE "RestaurantSettings" ADD CONSTRAINT "RestaurantSettings_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSplit" ADD CONSTRAINT "OrderSplit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSplit" ADD CONSTRAINT "OrderSplit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSplit" ADD CONSTRAINT "PaymentSplit_orderSplitId_fkey" FOREIGN KEY ("orderSplitId") REFERENCES "OrderSplit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSplit" ADD CONSTRAINT "PaymentSplit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
