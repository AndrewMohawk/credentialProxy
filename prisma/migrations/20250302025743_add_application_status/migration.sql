-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('ACTIVE', 'PENDING', 'REVOKED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "callbackUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3),
ADD COLUMN     "registrationIp" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedReason" TEXT,
ADD COLUMN     "secret" TEXT,
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING';
