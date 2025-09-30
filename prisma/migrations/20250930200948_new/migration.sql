-- CreateEnum
CREATE TYPE "LogisticType" AS ENUM ('TRACKING', 'PICKING');

-- CreateEnum
CREATE TYPE "LogisticState" AS ENUM ('DRAFT', 'CHECK_PENDING', 'CHECK_IN_PROGRESS', 'CHECK_FINALIZED', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'DUPLICATED', 'STATE_CHANGED', 'CHECK_VERIFIED', 'CHECK_FINALIZED', 'MESSENGER_ASSIGNED', 'PRINTED', 'NOTIFICATION_SENT');

-- CreateTable
CREATE TABLE "LogisticsRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "LogisticType" NOT NULL,
    "guideNumber" TEXT NOT NULL,
    "originType" TEXT,
    "originId" TEXT,
    "senderContactId" TEXT NOT NULL,
    "recipientContactId" TEXT NOT NULL,
    "carrierId" TEXT,
    "messengerId" TEXT,
    "state" "LogisticState" NOT NULL DEFAULT 'DRAFT',
    "labels" TEXT[],
    "extra" JSONB,
    "summary" JSONB,
    "fileUri" TEXT,
    "parentRecordId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checkStartedAt" TIMESTAMP(3),
    "checkFinalizedAt" TIMESTAMP(3),
    "checkFinalizedBy" TEXT,

    CONSTRAINT "LogisticsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticItem" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "originItemId" TEXT,
    "sku" TEXT,
    "name" TEXT,
    "qtyExpected" INTEGER NOT NULL,
    "qtyVerified" INTEGER NOT NULL DEFAULT 0,
    "selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LogisticItem_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "LogisticsRecord_tenantId_state_idx" ON "LogisticsRecord"("tenantId", "state");

-- CreateIndex
CREATE INDEX "LogisticsRecord_tenantId_type_idx" ON "LogisticsRecord"("tenantId", "type");

-- CreateIndex
CREATE INDEX "LogisticsRecord_messengerId_idx" ON "LogisticsRecord"("messengerId");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsRecord_tenantId_guideNumber_key" ON "LogisticsRecord"("tenantId", "guideNumber");

-- CreateIndex
CREATE INDEX "LogisticItem_recordId_idx" ON "LogisticItem"("recordId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_recordId_idx" ON "AuditLog"("tenantId", "recordId");

-- AddForeignKey
ALTER TABLE "LogisticsRecord" ADD CONSTRAINT "LogisticsRecord_parentRecordId_fkey" FOREIGN KEY ("parentRecordId") REFERENCES "LogisticsRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticItem" ADD CONSTRAINT "LogisticItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "LogisticsRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
