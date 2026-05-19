/*
  Warnings:

  - You are about to drop the column `registrationDeadline` on the `Tournament` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('STROKE_PLAY', 'MATCH_PLAY', 'STABLEFORD', 'SCRAMBLE', 'BEST_BALL');

-- CreateEnum
CREATE TYPE "ScoringType" AS ENUM ('GROSS', 'NET');

-- CreateEnum
CREATE TYPE "TournamentVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY');

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_clubId_fkey";

-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "about" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'NG',
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'Golf Club',
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "address" TEXT,
ADD COLUMN     "alsoKnownAs" TEXT,
ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "architect" TEXT,
ADD COLUMN     "bookingUrl" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'NG',
ADD COLUMN     "courseRating" DOUBLE PRECISION,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "par" INTEGER NOT NULL DEFAULT 72,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "slopeRating" INTEGER,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Parkland',
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yearEstablished" INTEGER,
ALTER COLUMN "clubId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "registrationDeadline",
ADD COLUMN     "allowExternalPlayers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowGuests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowRegisteredPlayers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoGrouping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "divisions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "enableHoleScoring" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableLiveScoring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableWaitlist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "format" "TournamentFormat" NOT NULL DEFAULT 'STROKE_PLAY',
ADD COLUMN     "hasHandicapRestriction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "holes" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "isRefundable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "maxPlayersPerGroup" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "paymentDeadline" TIMESTAMP(3),
ADD COLUMN     "publishImmediately" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationCloseAt" TIMESTAMP(3),
ADD COLUMN     "registrationOpenAt" TIMESTAMP(3),
ADD COLUMN     "requireMarkerVerification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scoringType" "ScoringType" NOT NULL DEFAULT 'GROSS',
ADD COLUMN     "teeIntervalMinutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "teeStartTime" TEXT,
ADD COLUMN     "venue" TEXT,
ADD COLUMN     "visibility" "TournamentVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "dob" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "TeeBox" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "yardage" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION,
    "slope" INTEGER,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "TeeBox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Registration_userId_idx" ON "Registration"("userId");

-- CreateIndex
CREATE INDEX "Registration_tournamentId_idx" ON "Registration"("tournamentId");

-- CreateIndex
CREATE INDEX "Registration_groupId_idx" ON "Registration"("groupId");

-- CreateIndex
CREATE INDEX "Score_userId_idx" ON "Score"("userId");

-- CreateIndex
CREATE INDEX "Score_groupId_idx" ON "Score"("groupId");

-- CreateIndex
CREATE INDEX "Score_holeId_idx" ON "Score"("holeId");

-- CreateIndex
CREATE INDEX "Tournament_clubId_idx" ON "Tournament"("clubId");

-- CreateIndex
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");

-- CreateIndex
CREATE INDEX "Tournament_name_idx" ON "Tournament"("name");

-- CreateIndex
CREATE INDEX "User_clubId_idx" ON "User"("clubId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_firstName_lastName_idx" ON "User"("firstName", "lastName");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeeBox" ADD CONSTRAINT "TeeBox_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
