-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateTable
CREATE TABLE "OwnerInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerInvite_token_key" ON "OwnerInvite"("token");

-- CreateIndex
CREATE INDEX "OwnerInvite_token_idx" ON "OwnerInvite"("token");

-- CreateIndex
CREATE INDEX "OwnerInvite_email_idx" ON "OwnerInvite"("email");
