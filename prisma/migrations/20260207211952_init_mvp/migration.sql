-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'COMMUNITY_LEADER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'blocked', 'deleted');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'non_binary', 'na');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('trekking', 'theater', 'dance', 'fitness', 'outdoor', 'wellness', 'gastronomy', 'music', 'art', 'sports', 'other');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('pending', 'confirmed', 'attended', 'cancelled');

-- CreateEnum
CREATE TYPE "SwipeAction" AS ENUM ('LIKE', 'PASS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "birthdate" TIMESTAMP(3),
    "gender" "Gender",
    "bio" TEXT,
    "avatarUrl" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "userId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("userId","interestId")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityInterest" (
    "activityId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,

    CONSTRAINT "ActivityInterest_pkey" PRIMARY KEY ("activityId","interestId")
);

-- CreateTable
CREATE TABLE "ActivitySession" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "priceCents" INTEGER,
    "locationName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivitySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEnrollment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwipeEvent" (
    "id" TEXT NOT NULL,
    "byUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "action" "SwipeAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwipeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_slug_key" ON "Interest"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityEnrollment_sessionId_userId_key" ON "ActivityEnrollment"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "SwipeEvent_toUserId_sessionId_idx" ON "SwipeEvent"("toUserId", "sessionId");

-- CreateIndex
CREATE INDEX "SwipeEvent_byUserId_sessionId_idx" ON "SwipeEvent"("byUserId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SwipeEvent_byUserId_toUserId_sessionId_key" ON "SwipeEvent"("byUserId", "toUserId", "sessionId");

-- CreateIndex
CREATE INDEX "Match_userAId_idx" ON "Match"("userAId");

-- CreateIndex
CREATE INDEX "Match_userBId_idx" ON "Match"("userBId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_userAId_userBId_sessionId_key" ON "Match"("userAId", "userBId", "sessionId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityInterest" ADD CONSTRAINT "ActivityInterest_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityInterest" ADD CONSTRAINT "ActivityInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEnrollment" ADD CONSTRAINT "ActivityEnrollment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ActivitySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEnrollment" ADD CONSTRAINT "ActivityEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwipeEvent" ADD CONSTRAINT "SwipeEvent_byUserId_fkey" FOREIGN KEY ("byUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwipeEvent" ADD CONSTRAINT "SwipeEvent_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwipeEvent" ADD CONSTRAINT "SwipeEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ActivitySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ActivitySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
