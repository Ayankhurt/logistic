/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,guideNumber]` on the table `LogisticRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'DUPLICATED', 'STATE_CHANGED', 'CHECK_VERIFIED', 'CHECK_FINALIZED', 'MESSENGER_ASSIGNED', 'PRINTED', 'NOTIFICATION_SENT');

-- DropIndex
DROP INDEX "public"."LogisticRecord_guideNumber_key";

-- AlterTable
ALTER TABLE "LogisticItem" ADD COLUMN     "originItemId" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LogisticRecord" ADD COLUMN     "checkFinalizedAt" TIMESTAMP(3),
ADD COLUMN     "checkFinalizedBy" TEXT,
ADD COLUMN     "checkStartedAt" TIMESTAMP(3),
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "fileUri" TEXT,
ADD COLUMN     "originId" TEXT,
ADD COLUMN     "originType" TEXT,
ADD COLUMN     "parentRecordId" TEXT,
ADD COLUMN     "summary" JSONB,
ADD COLUMN     "updatedBy" TEXT;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "payload" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_recordId_idx" ON "AuditLog"("tenantId", "recordId");

-- CreateIndex
CREATE INDEX "LogisticItem_recordId_idx" ON "LogisticItem"("recordId");

-- CreateIndex
CREATE INDEX "LogisticRecord_tenantId_state_idx" ON "LogisticRecord"("tenantId", "state");

-- CreateIndex
CREATE INDEX "LogisticRecord_tenantId_type_idx" ON "LogisticRecord"("tenantId", "type");

-- CreateIndex
CREATE INDEX "LogisticRecord_messengerId_idx" ON "LogisticRecord"("messengerId");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticRecord_tenantId_guideNumber_key" ON "LogisticRecord"("tenantId", "guideNumber");

-- AddForeignKey
ALTER TABLE "LogisticRecord" ADD CONSTRAINT "LogisticRecord_parentRecordId_fkey" FOREIGN KEY ("parentRecordId") REFERENCES "LogisticRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "LogisticRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
