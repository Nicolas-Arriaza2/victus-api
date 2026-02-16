-- CreateEnum
CREATE TYPE "ActivityPricingModel" AS ENUM ('per_session', 'monthly_subscription');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'pending_payment', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "SubscriptionBillingStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'subscription_payment_due';
ALTER TYPE "NotificationType" ADD VALUE 'subscription_payment_confirmed';
ALTER TYPE "NotificationType" ADD VALUE 'subscription_overdue';
ALTER TYPE "NotificationType" ADD VALUE 'subscription_cancelled';
ALTER TYPE "NotificationType" ADD VALUE 'new_subscriber';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "monthlyPriceCents" INTEGER,
ADD COLUMN     "pricingModel" "ActivityPricingModel" NOT NULL DEFAULT 'per_session';

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'pending_payment',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionBilling" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "leaderAmount" DECIMAL(10,2) NOT NULL,
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "mpStatus" TEXT,
    "status" "SubscriptionBillingStatus" NOT NULL DEFAULT 'pending',
    "transferStatus" "TransferStatus" NOT NULL DEFAULT 'pending',
    "transferredAt" TIMESTAMP(3),
    "transferredBy" TEXT,
    "transferNotes" TEXT,
    "paidAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionBilling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_activityId_key" ON "Subscription"("userId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionBilling_mpPaymentId_key" ON "SubscriptionBilling"("mpPaymentId");

-- CreateIndex
CREATE INDEX "SubscriptionBilling_subscriptionId_idx" ON "SubscriptionBilling"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionBilling_status_idx" ON "SubscriptionBilling"("status");

-- CreateIndex
CREATE INDEX "SubscriptionBilling_transferStatus_idx" ON "SubscriptionBilling"("transferStatus");

-- CreateIndex
CREATE INDEX "SubscriptionBilling_dueDate_idx" ON "SubscriptionBilling"("dueDate");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionBilling" ADD CONSTRAINT "SubscriptionBilling_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionBilling" ADD CONSTRAINT "SubscriptionBilling_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
