import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

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
    // Clean up test data
    await prismaService.logisticRecord.deleteMany({});
    await prismaService.auditLog.deleteMany({});
  });

  describe('POST /records', () => {
    it('should create a logistic record', () => {
      return request(app.getHttpServer())
        .post('/records')
        .send({
          tenantId: 'test-tenant',
          type: 'TRACKING',
          senderContactId: 'sender-1',
          recipientContactId: 'recipient-1',
          userId: 'user-1',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('guideNumber');
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/records')
        .send({
          tenantId: 'test-tenant',
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('GET /records/:id', () => {
    it('should return a logistic record', async () => {
      // First create a record
      const createResponse = await request(app.getHttpServer())
        .post('/records')
        .send({
          tenantId: 'test-tenant',
          type: 'TRACKING',
          senderContactId: 'sender-1',
          recipientContactId: 'recipient-1',
          userId: 'user-1',
        });

      const recordId = createResponse.body.data.id;

      return request(app.getHttpServer())
        .get(`/records/${recordId}?tenantId=test-tenant`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('id', recordId);
        });
    });
  });

  describe('POST /records/:id/assign', () => {
    it('should assign messenger to record', async () => {
      // First create a record
      const createResponse = await request(app.getHttpServer())
        .post('/records')
        .send({
          tenantId: 'test-tenant',
          type: 'TRACKING',
          senderContactId: 'sender-1',
          recipientContactId: 'recipient-1',
          userId: 'user-1',
        });

      const recordId = createResponse.body.data.id;

      return request(app.getHttpServer())
        .post(`/records/${recordId}/assign`)
        .send({
          messengerId: 'messenger-1',
          userId: 'user-1',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('messengerId', 'messenger-1');
        });
    });
  });

  describe('POST /records/:id/check/finalize', () => {
    it('should finalize check for record', async () => {
      // First create a record
      const createResponse = await request(app.getHttpServer())
        .post('/records')
        .send({
          tenantId: 'test-tenant',
          type: 'TRACKING',
          senderContactId: 'sender-1',
          recipientContactId: 'recipient-1',
          userId: 'user-1',
        });

      const recordId = createResponse.body.data.id;

      return request(app.getHttpServer())
        .post(`/records/${recordId}/check/finalize`)
        .send({
          userId: 'user-1',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });
  });

  describe('GET /public/track/:guideNumber', () => {
    it('should return public tracking info', async () => {
      // First create a record
      const createResponse = await request(app.getHttpServer())
        .post('/records')
        .send({
          tenantId: 'test-tenant',
          type: 'TRACKING',
          senderContactId: 'sender-1',
          recipientContactId: 'recipient-1',
          userId: 'user-1',
        });

      const guideNumber = createResponse.body.data.guideNumber;

      return request(app.getHttpServer())
        .get(`/public/track/${guideNumber}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('guideNumber', guideNumber);
          expect(res.body).toHaveProperty('state');
        });
    });
  });
});
