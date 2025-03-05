/*
  Warnings:

  - You are about to drop the column `applicationId` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `configuration` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `currentCount` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `isEnabled` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `maxCount` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `pattern` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `pluginId` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Policy` table. All the data in the column will be lost.
  - Made the column `credentialId` on table `Policy` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Policy" DROP CONSTRAINT "Policy_applicationId_fkey";

-- First add the config column with NULL allowed temporarily
ALTER TABLE "Policy" ADD COLUMN "config" JSONB;

-- Update the config column with a JSON object that combines the old fields
UPDATE "Policy" 
SET "config" = 
  jsonb_build_object(
    'configuration', COALESCE("configuration", '{}'::jsonb),
    'pattern', "pattern",
    'startTime', "startTime",
    'endTime', "endTime",
    'maxCount', "maxCount",
    'currentCount', "currentCount",
    'scope', "scope"
  );

-- Now make the config column NOT NULL
ALTER TABLE "Policy" ALTER COLUMN "config" SET NOT NULL;

-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "applicationId",
DROP COLUMN "configuration",
DROP COLUMN "currentCount",
DROP COLUMN "endTime",
DROP COLUMN "isEnabled",
DROP COLUMN "maxCount",
DROP COLUMN "pattern",
DROP COLUMN "pluginId",
DROP COLUMN "scope",
DROP COLUMN "startTime",
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'ALLOW_LIST',
ALTER COLUMN "credentialId" SET NOT NULL;

-- CreateTable
CREATE TABLE "_ApplicationToPolicy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ApplicationToPolicy_AB_unique" ON "_ApplicationToPolicy"("A", "B");

-- CreateIndex
CREATE INDEX "_ApplicationToPolicy_B_index" ON "_ApplicationToPolicy"("B");

-- CreateIndex
CREATE INDEX "Policy_credentialId_idx" ON "Policy"("credentialId");

-- CreateIndex
CREATE INDEX "Policy_type_idx" ON "Policy"("type");

-- AddForeignKey
ALTER TABLE "_ApplicationToPolicy" ADD CONSTRAINT "_ApplicationToPolicy_A_fkey" FOREIGN KEY ("A") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToPolicy" ADD CONSTRAINT "_ApplicationToPolicy_B_fkey" FOREIGN KEY ("B") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
