-- CreateEnum
CREATE TYPE "Category" AS ENUM ('EDUCATION', 'AGRICULTURE', 'HEALTHCARE', 'WATER', 'ENVIRONMENT', 'ENERGY', 'URBAN_DEVELOPMENT', 'PUBLIC_ADMIN');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CHALLENGE_ASSIGNED', 'STATUS_UPDATED');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('UNIVERSITY', 'INDUSTRY');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'PARTNER', 'ADMIN');

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "district" TEXT NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'SUBMITTED',
    "assignedPartnerId" TEXT,
    "team" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "locality" TEXT,
    "address" TEXT,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL,
    "domains" "Category"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "district" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_userId_key" ON "partners"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone" ASC);

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_assignedPartnerId_fkey" FOREIGN KEY ("assignedPartnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
