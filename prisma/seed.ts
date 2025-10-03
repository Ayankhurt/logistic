import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create demo tracking record
  const trackingRecord = await prisma.logisticRecord.create({
    data: {
      tenantId: 'demo-tenant',
      type: 'TRACKING',
      guideNumber: 'TRK-DEMO-001',
      originType: 'order',
      originId: 'order-001',
      senderContactId: 'contact-sender-001',
      recipientContactId: 'contact-recipient-001',
      carrierId: 'carrier-001',
      state: 'DRAFT',
      labels: 'urgent,express',
      extra: {
        weight: 2.5,
        dimensions: '30x20x10',
        value: 150.00
      },
      summary: {
        senderName: 'Demo Sender',
        recipientName: 'Demo Recipient',
        itemsCount: 3,
        totalValue: 150.00
      },
      createdBy: 'demo-user',
      updatedBy: 'demo-user',
      items: {
        create: [
          {
            originItemId: 'item-001',
            sku: 'SKU-001',
            name: 'Demo Product 1',
            qtyExpected: 2,
            qtyVerified: 0,
            selected: false
          },
          {
            originItemId: 'item-002',
            sku: 'SKU-002',
            name: 'Demo Product 2',
            qtyExpected: 1,
            qtyVerified: 0,
            selected: false
          }
        ]
      },
      audit: {
        create: [
          {
            tenantId: 'demo-tenant',
            action: 'CREATED',
            payload: { guideNumber: 'TRK-DEMO-001' },
            createdBy: 'demo-user'
          }
        ]
      }
    }
  });

  // Create demo picking record
  const pickingRecord = await prisma.logisticRecord.create({
    data: {
      tenantId: 'demo-tenant',
      type: 'PICKING',
      guideNumber: 'PCK-DEMO-001',
      originType: 'order',
      originId: 'order-002',
      senderContactId: 'contact-warehouse-001',
      recipientContactId: 'contact-customer-001',
      state: 'DRAFT',
      labels: 'priority,fragile',
      extra: {
        location: 'Warehouse A',
        pickingZone: 'Zone 1',
        specialInstructions: 'Handle with care'
      },
      summary: {
        senderName: 'Demo Warehouse',
        recipientName: 'Demo Customer',
        itemsCount: 5,
        priority: 'high'
      },
      createdBy: 'demo-user',
      updatedBy: 'demo-user',
      items: {
        create: [
          {
            originItemId: 'item-003',
            sku: 'SKU-003',
            name: 'Demo Product 3',
            qtyExpected: 3,
            qtyVerified: 0,
            selected: false
          },
          {
            originItemId: 'item-004',
            sku: 'SKU-004',
            name: 'Demo Product 4',
            qtyExpected: 2,
            qtyVerified: 0,
            selected: false
          }
        ]
      },
      audit: {
        create: [
          {
            tenantId: 'demo-tenant',
            action: 'CREATED',
            payload: { guideNumber: 'PCK-DEMO-001' },
            createdBy: 'demo-user'
          }
        ]
      }
    }
  });

  console.log('Demo data created successfully!');
  console.log('Tracking Record ID:', trackingRecord.id);
  console.log('Picking Record ID:', pickingRecord.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
