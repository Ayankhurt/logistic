import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const tenantId = 'tenant-demo-1';

  // Create demo tracking record
  const tracking = await prisma.logisticRecord.create({
    data: {
      id: 'tracking-001',
      tenantId,
      type: 'TRACKING',
      guideNumber: 'TRK-2024-001',
      originType: 'ORDER',
      originId: 'order-123',
      senderContactId: 'contact-sender-001',
      recipientContactId: 'contact-recipient-001',
      carrierId: 'carrier-fedex',
      state: 'CHECK_FINALIZED',
      labels: 'urgent,fragile',
      extra: {
        priority: 'high',
        specialInstructions: 'Handle with care',
        insuranceValue: 500.00
      },
      summary: {
        sender: 'contact-sender-001',
        recipient: 'contact-recipient-001',
        carrier: 'carrier-fedex',
        items: 3
      },
      createdBy: 'user-001',
      checkStartedAt: new Date('2024-01-15T10:00:00Z'),
      checkFinalizedAt: new Date('2024-01-15T10:30:00Z'),
      checkFinalizedBy: 'user-001',
      items: {
        create: [
          {
            id: 'item-001',
            originItemId: 'order-item-001',
            sku: 'SKU-001',
            name: 'Laptop Computer',
            qtyExpected: 1,
            qtyVerified: 1,
            selected: true
          },
          {
            id: 'item-002',
            originItemId: 'order-item-002',
            sku: 'SKU-002',
            name: 'Wireless Mouse',
            qtyExpected: 2,
            qtyVerified: 2,
            selected: true
          },
          {
            id: 'item-003',
            originItemId: 'order-item-003',
            sku: 'SKU-003',
            name: 'USB Cable',
            qtyExpected: 1,
            qtyVerified: 1,
            selected: true
          }
        ]
      },
      audit: {
        create: [
          {
            id: 'audit-001',
            tenantId,
            action: 'CREATED',
            payload: { type: 'TRACKING', origin: { originType: 'ORDER', originId: 'order-123' } },
            createdBy: 'user-001'
          },
          {
            id: 'audit-002',
            tenantId,
            action: 'CHECK_VERIFIED',
            payload: { items: [{ id: 'item-001', selected: true, qtyVerified: 1 }] },
            createdBy: 'user-001'
          },
          {
            id: 'audit-003',
            tenantId,
            action: 'CHECK_FINALIZED',
            createdBy: 'user-001'
          }
        ]
      }
    }
  });

  // Create demo picking record
  const picking = await prisma.logisticRecord.create({
    data: {
      id: 'picking-001',
      tenantId,
      type: 'PICKING',
      guideNumber: 'PKG-2024-001',
      originType: 'WAREHOUSE_ORDER',
      originId: 'wo-456',
      senderContactId: 'contact-warehouse-001',
      recipientContactId: 'contact-store-001',
      carrierId: 'carrier-ups',
      state: 'READY',
      labels: 'bulk,warehouse',
      extra: {
        warehouseZone: 'A-1',
        pickingList: ['A1-B2-C3', 'A1-B2-C4'],
        estimatedWeight: 15.5
      },
      summary: {
        sender: 'contact-warehouse-001',
        recipient: 'contact-store-001',
        carrier: 'carrier-ups',
        items: 5
      },
      createdBy: 'user-002',
      checkStartedAt: new Date('2024-01-15T14:00:00Z'),
      checkFinalizedAt: new Date('2024-01-15T14:45:00Z'),
      checkFinalizedBy: 'user-002',
      items: {
        create: [
          {
            id: 'item-004',
            originItemId: 'wo-item-001',
            sku: 'SKU-100',
            name: 'T-Shirt (Red)',
            qtyExpected: 10,
            qtyVerified: 10,
            selected: true
          },
          {
            id: 'item-005',
            originItemId: 'wo-item-002',
            sku: 'SKU-101',
            name: 'T-Shirt (Blue)',
            qtyExpected: 8,
            qtyVerified: 8,
            selected: true
          },
          {
            id: 'item-006',
            originItemId: 'wo-item-003',
            sku: 'SKU-102',
            name: 'Jeans (32)',
            qtyExpected: 5,
            qtyVerified: 5,
            selected: true
          },
          {
            id: 'item-007',
            originItemId: 'wo-item-004',
            sku: 'SKU-103',
            name: 'Sneakers (Size 9)',
            qtyExpected: 3,
            qtyVerified: 3,
            selected: true
          },
          {
            id: 'item-008',
            originItemId: 'wo-item-005',
            sku: 'SKU-104',
            name: 'Backpack',
            qtyExpected: 2,
            qtyVerified: 2,
            selected: true
          }
        ]
      },
      audit: {
        create: [
          {
            id: 'audit-004',
            tenantId,
            action: 'CREATED',
            payload: { type: 'PICKING', origin: { originType: 'WAREHOUSE_ORDER', originId: 'wo-456' } },
            createdBy: 'user-002'
          },
          {
            id: 'audit-005',
            tenantId,
            action: 'CHECK_VERIFIED',
            payload: { items: [{ id: 'item-004', selected: true, qtyVerified: 10 }] },
            createdBy: 'user-002'
          },
          {
            id: 'audit-006',
            tenantId,
            action: 'CHECK_FINALIZED',
            createdBy: 'user-002'
          },
          {
            id: 'audit-007',
            tenantId,
            action: 'STATE_CHANGED',
            payload: { state: 'READY' },
            createdBy: 'user-002'
          }
        ]
      }
    }
  });

  console.log('✅ Created tracking record:', tracking.guideNumber);
  console.log('✅ Created picking record:', picking.guideNumber);
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
