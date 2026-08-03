-- CreateEnum
CREATE TYPE "KitchenStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'COMPLETED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "kitchenStatus" "KitchenStatus" NOT NULL DEFAULT 'PENDING';
