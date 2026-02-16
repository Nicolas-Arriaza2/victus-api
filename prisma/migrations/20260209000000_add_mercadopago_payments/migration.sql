-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('pending', 'transferred', 'cancelled');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'payment_confirmed';
ALTER TYPE "NotificationType" ADD VALUE 'new_enrollment';
ALTER TYPE "NotificationType" ADD VALUE 'transfer_completed';

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_enrollmentId_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amountCents",
DROP COLUMN "currency",
DROP COLUMN "externalId",
DROP COLUMN "method",
DROP COLUMN "paymentUrl",
ADD COLUMN     "activityId" TEXT NOT NULL,
ADD COLUMN     "leaderAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "leaderId" TEXT NOT NULL,
ADD COLUMN     "mpPaymentId" TEXT,
ADD COLUMN     "mpPreferenceId" TEXT,
ADD COLUMN     "mpStatus" TEXT,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'mercadopago',
ADD COLUMN     "platformFee" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "transferNotes" TEXT,
ADD COLUMN     "transferStatus" "TransferStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "transferredAt" TIMESTAMP(3),
ADD COLUMN     "transferredBy" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "PaymentMethod";

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpPaymentId_key" ON "Payment"("mpPaymentId");

-- CreateIndex
CREATE INDEX "Payment_leaderId_idx" ON "Payment"("leaderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_transferStatus_idx" ON "Payment"("transferStatus");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ActivityEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
