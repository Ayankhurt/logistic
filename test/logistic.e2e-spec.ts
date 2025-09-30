import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('LogisticController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.auditLog.deleteMany();
    await prismaService.logisticItem.deleteMany();
    await prismaService.logisticRecord.deleteMany();
  });

  describe('/api/v1/logistic/records (POST)', () => {
    it('should create a tracking record', () => {
      const createDto = {
        tenantId: 'tenant-test',
        senderContactId: 'sender-001',
        recipientContactId: 'recipient-001',
        carrierId: 'fedex',
        labels: ['urgent'],
        items: [
          {
            sku: 'SKU-001',
            name: 'Test Product',
            qtyExpected: 1,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/api/v1/logistic/records?type=TRACKING')
        .set('Authorization', 'Bearer test-token')
        .set('x-tenant-id', 'tenant-test')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('guideNumber');
          expect(res.body.type).toBe('TRACKING');
          expect(res.body.state).toBe('CHECK_PENDING');
          expect(res.body.labels).toEqual(['urgent']);
        });
    });

    it('should create a picking record', () => {
      const createDto = {
        tenantId: 'tenant-test',
        senderContactId: 'warehouse-001',
        recipientContactId: 'store-001',
        carrierId: 'ups',
        labels: ['bulk'],
        items: [
          {
            sku: 'SKU-100',
            name: 'Bulk Item',
            qtyExpected: 10,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/api/v1/logistic/records?type=PICKING')
        .set('Authorization', 'Bearer test-token')
        .set('x-tenant-id', 'tenant-test')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.type).toBe('PICKING');
          expect(res.body.guideNumber).toMatch(/^PKG-/);
        });
    });

    it('should return 400 when required fields are missing', () => {
      const invalidDto = {
        tenantId: 'tenant-test',
        // Missing senderContactId and recipientContactId
      };

      return request(app.getHttpServer())
        .post('/api/v1/logistic/records?type=TRACKING')
        .set('Authorization', 'Bearer test-token')
        .set('x-tenant-id', 'tenant-test')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/api/v1/logistic/records (GET)', () => {
    beforeEach(async () => {
      // Create test records
      await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'CHECK_PENDING',
          labels: ['urgent'],
          items: {
            create: [
              {
                id: 'item-1',
                sku: 'SKU-001',
                name: 'Test Item',
                qtyExpected: 1,
              },
            ],
          },
        },
      });
    });

    it('should return list of records', () => {
      return request(app.getHttpServer())
        .get('/api/v1/logistic/records?tenantId=tenant-test')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('guideNumber');
        });
    });

    it('should filter by type', () => {
      return request(app.getHttpServer())
        .get('/api/v1/logistic/records?tenantId=tenant-test&type=TRACKING')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.every((record: any) => record.type === 'TRACKING')).toBe(true);
        });
    });

    it('should filter by state', () => {
      return request(app.getHttpServer())
        .get('/api/v1/logistic/records?tenantId=tenant-test&state=CHECK_PENDING')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.every((record: any) => record.state === 'CHECK_PENDING')).toBe(true);
        });
    });
  });

  describe('/api/v1/logistic/records/:id (GET)', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'CHECK_PENDING',
          labels: ['urgent'],
          items: {
            create: [
              {
                id: 'item-1',
                sku: 'SKU-001',
                name: 'Test Item',
                qtyExpected: 1,
              },
            ],
          },
        },
      });
      recordId = record.id;
    });

    it('should return a specific record', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/logistic/records/${recordId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(recordId);
          expect(res.body.guideNumber).toBe('TRK-001');
          expect(res.body.items).toHaveLength(1);
        });
    });

    it('should return 404 for non-existent record', () => {
      return request(app.getHttpServer())
        .get('/api/v1/logistic/records/non-existent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);
    });
  });

  describe('/api/v1/logistic/records/:id/check/verify (POST)', () => {
    let recordId: string;
    let itemId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'CHECK_PENDING',
          labels: ['urgent'],
          items: {
            create: [
              {
                id: 'item-1',
                sku: 'SKU-001',
                name: 'Test Item',
                qtyExpected: 1,
              },
            ],
          },
        },
      });
      recordId = record.id;
      itemId = 'item-1';
    });

    it('should verify items successfully', () => {
      const verifyDto = {
        items: [
          {
            id: itemId,
            selected: true,
            qtyVerified: 1,
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/api/v1/logistic/records/${recordId}/check/verify`)
        .set('Authorization', 'Bearer test-token')
        .send(verifyDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ ok: true });
        });
    });

    it('should return 400 when no items provided', () => {
      const invalidDto = { items: [] };

      return request(app.getHttpServer())
        .post(`/api/v1/logistic/records/${recordId}/check/verify`)
        .set('Authorization', 'Bearer test-token')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/api/v1/logistic/records/:id/check/finalize (POST)', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'CHECK_IN_PROGRESS',
          labels: ['urgent'],
          items: {
            create: [
              {
                id: 'item-1',
                sku: 'SKU-001',
                name: 'Test Item',
                qtyExpected: 1,
                qtyVerified: 1,
                selected: true,
              },
            ],
          },
        },
      });
      recordId = record.id;
    });

    it('should finalize check successfully', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/logistic/records/${recordId}/check/finalize`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.state).toBe('CHECK_FINALIZED');
          expect(res.body.checkFinalizedAt).toBeDefined();
        });
    });
  });

  describe('/api/v1/logistic/records/:id/state (POST)', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'CHECK_FINALIZED',
          labels: ['urgent'],
        },
      });
      recordId = record.id;
    });

    it('should change state successfully', () => {
      const stateDto = { state: 'READY' };

      return request(app.getHttpServer())
        .post(`/api/v1/logistic/records/${recordId}/state`)
        .set('Authorization', 'Bearer test-token')
        .send(stateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.state).toBe('READY');
        });
    });
  });

  describe('/api/v1/logistic/records/:id/labels (PATCH)', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'CHECK_PENDING',
          labels: ['urgent'],
        },
      });
      recordId = record.id;
    });

    it('should update labels successfully', () => {
      const labelsDto = { labels: ['urgent', 'fragile', 'express'] };

      return request(app.getHttpServer())
        .patch(`/api/v1/logistic/records/${recordId}/labels`)
        .set('Authorization', 'Bearer test-token')
        .send(labelsDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.labels).toEqual(['urgent', 'fragile', 'express']);
        });
    });
  });

  describe('/api/v1/logistic/records/:id/messenger/assign (POST)', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'READY',
          labels: ['urgent'],
        },
      });
      recordId = record.id;
    });

    it('should assign messenger successfully', () => {
      const messengerDto = { messengerId: 'messenger-001' };

      return request(app.getHttpServer())
        .post(`/api/v1/logistic/records/${recordId}/messenger/assign`)
        .set('Authorization', 'Bearer test-token')
        .send(messengerDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.messengerId).toBe('messenger-001');
        });
    });
  });

  describe('/api/v1/logistic/records/:id/print (POST)', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'READY',
          labels: ['urgent'],
        },
      });
      recordId = record.id;
    });

    it('should print guide successfully', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/logistic/records/${recordId}/print`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.fileUri).toBeDefined();
        });
    });
  });

  describe('/api/v1/logistic/records/:id/notify (POST)', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'READY',
          labels: ['urgent'],
        },
      });
      recordId = record.id;
    });

    it('should send notification successfully', () => {
      const notifyDto = { channels: ['EMAIL', 'SMS'] };

      return request(app.getHttpServer())
        .post(`/api/v1/logistic/records/${recordId}/notify`)
        .set('Authorization', 'Bearer test-token')
        .send(notifyDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(res.body.link).toBeDefined();
        });
    });
  });

  describe('/api/v1/logistic/records/:id/duplicate (POST)', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'READY',
          labels: ['urgent'],
          extra: { test: 'data' },
          items: {
            create: [
              {
                id: 'item-1',
                sku: 'SKU-001',
                name: 'Test Item',
                qtyExpected: 1,
              },
            ],
          },
        },
      });
      recordId = record.id;
    });

    it('should duplicate record successfully', () => {
      const duplicateDto = { copyExtra: true };

      return request(app.getHttpServer())
        .post(`/api/v1/logistic/records/${recordId}/duplicate`)
        .set('Authorization', 'Bearer test-token')
        .send(duplicateDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).not.toBe(recordId);
          expect(res.body.guideNumber).not.toBe('TRK-001');
          expect(res.body.type).toBe('TRACKING');
          expect(res.body.state).toBe('CHECK_PENDING');
        });
    });
  });

  describe('/api/v1/logistic/records/:id/split (POST)', () => {
    let recordId: string;
    let itemId: string;

    beforeEach(async () => {
      const record = await prismaService.logisticRecord.create({
        data: {
          id: 'record-1',
          tenantId: 'tenant-test',
          type: 'TRACKING',
          guideNumber: 'TRK-001',
          senderContactId: 'sender-001',
          recipientContactId: 'recipient-001',
          state: 'READY',
          labels: ['urgent'],
          items: {
            create: [
              {
                id: 'item-1',
                sku: 'SKU-001',
                name: 'Test Item',
                qtyExpected: 10,
              },
            ],
          },
        },
      });
      recordId = record.id;
      itemId = 'item-1';
    });

    it('should split record successfully', () => {
      const splitDto = {
        splits: [
          {
            items: [{ id: itemId, qty: 3 }],
            labels: ['split-1'],
          },
          {
            items: [{ id: itemId, qty: 7 }],
            labels: ['split-2'],
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/api/v1/logistic/records/${recordId}/split`)
        .set('Authorization', 'Bearer test-token')
        .send(splitDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(res.body.children).toHaveLength(2);
          expect(res.body.children[0].labels).toEqual(['split-1']);
          expect(res.body.children[1].labels).toEqual(['split-2']);
        });
    });
  });
});
