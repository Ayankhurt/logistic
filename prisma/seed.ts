import { PrismaClient, LogisticState } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'tenant-demo';
  const tracking = await prisma.logisticRecord.create({
    data: {
      tenantId,
      type: 'TRACKING',
      guideNumber: 'T-240101-ABC123-TENA',
      senderContactId: 'sender-1',
      recipientContactId: 'recipient-1',
      labels: ['priority'],
      state: LogisticState.CHECK_PENDING,
      items: {
        create: [
          { name: 'Item A', qtyExpected: 2 as any },
          { name: 'Item B', qtyExpected: 1 as any },
        ],
      },
    },
  });
  const picking = await prisma.logisticRecord.create({
    data: {
      tenantId,
      type: 'PICKING',
      guideNumber: 'P-240101-XYZ789-TENA',
      senderContactId: 'warehouse-1',
      recipientContactId: 'customer-1',
      labels: ['standard'],
      state: 'CHECK_PENDING',
      items: { create: [{ name: 'SKU-1', qtyExpected: 3 }] },
    },
  });
  console.log({ tracking: tracking.id, picking: picking.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
