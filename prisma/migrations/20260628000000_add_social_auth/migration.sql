-- AlterTable: make passwordHash nullable, add social auth fields
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authProvider" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "appleId" TEXT;

-- CreateIndex: unique constraints for social IDs
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_appleId_key" ON "User"("appleId");
