-- CreateTable
CREATE TABLE "LogisticRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "guideNumber" TEXT NOT NULL,
    "originType" TEXT,
    "originId" TEXT,
    "senderContactId" TEXT NOT NULL,
    "recipientContactId" TEXT NOT NULL,
    "carrierId" TEXT,
    "messengerId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "labels" TEXT NOT NULL,
    "extra" JSONB,
    "summary" JSONB,
    "fileUri" TEXT,
    "parentRecordId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "checkStartedAt" DATETIME,
    "checkFinalizedAt" DATETIME,
    "checkFinalizedBy" TEXT,
    CONSTRAINT "LogisticRecord_parentRecordId_fkey" FOREIGN KEY ("parentRecordId") REFERENCES "LogisticRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogisticItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT NOT NULL,
    "originItemId" TEXT,
    "sku" TEXT,
    "name" TEXT,
    "qtyExpected" INTEGER NOT NULL,
    "qtyVerified" INTEGER NOT NULL DEFAULT 0,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "LogisticItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "LogisticRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "LogisticRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LogisticRecord_tenantId_state_idx" ON "LogisticRecord"("tenantId", "state");

-- CreateIndex
CREATE INDEX "LogisticRecord_tenantId_type_idx" ON "LogisticRecord"("tenantId", "type");

-- CreateIndex
CREATE INDEX "LogisticRecord_messengerId_idx" ON "LogisticRecord"("messengerId");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticRecord_tenantId_guideNumber_key" ON "LogisticRecord"("tenantId", "guideNumber");

-- CreateIndex
CREATE INDEX "LogisticItem_recordId_idx" ON "LogisticItem"("recordId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_recordId_idx" ON "AuditLog"("tenantId", "recordId");
