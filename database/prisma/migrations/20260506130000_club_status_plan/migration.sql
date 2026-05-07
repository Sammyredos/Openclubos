-- CreateEnum
CREATE TYPE "ClubStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ClubPlan" AS ENUM ('PRO', 'BASIC');

-- AlterTable
ALTER TABLE "Club"
ADD COLUMN     "status" "ClubStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "plan" "ClubPlan" NOT NULL DEFAULT 'BASIC';

