-- CreateEnum
CREATE TYPE "LogisticType" AS ENUM ('TRACKING', 'PICKING');

-- CreateEnum
CREATE TYPE "LogisticState" AS ENUM ('DRAFT', 'CHECK_PENDING', 'CHECK_IN_PROGRESS', 'CHECK_FINALIZED', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "LogisticRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "LogisticType" NOT NULL,
    "guideNumber" TEXT NOT NULL,
    "senderContactId" TEXT NOT NULL,
    "recipientContactId" TEXT NOT NULL,
    "carrierId" TEXT,
    "messengerId" TEXT,
    "state" "LogisticState" NOT NULL DEFAULT 'DRAFT',
    "labels" TEXT NOT NULL,
    "extra" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticItem" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "qtyExpected" INTEGER NOT NULL,
    "qtyVerified" INTEGER NOT NULL DEFAULT 0,
    "selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LogisticItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LogisticRecord_guideNumber_key" ON "LogisticRecord"("guideNumber");

-- AddForeignKey
ALTER TABLE "LogisticItem" ADD CONSTRAINT "LogisticItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "LogisticRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
