import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LogisticService } from './logistic.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContactsService } from '../integrations/contacts/contacts.service';
import { CustomFieldsService } from '../integrations/custom-fields/custom-fields.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { TrazabilityService } from '../integrations/trazability/trazability.service';
import { StorageService } from '../integrations/storage/storage.service';
import { CreateLogisticRecordDto } from './dto/create-logistic-record.dto';
import { LogisticType } from './interfaces/logistic.interface';

describe('LogisticService', () => {
  let service: LogisticService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    logisticRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    logisticItem: {
      findMany: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockContactsService = {
    validateContacts: jest.fn(),
  };

  const mockCustomFieldsService = {
    validateLabels: jest.fn(),
  };

  const mockSocketsGateway = {
    emitEvent: jest.fn(),
  };

  const mockTrazabilityService = {
    emitBaseEvent: jest.fn(),
  };

  const mockStorageService = {
    uploadPdf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ContactsService, useValue: mockContactsService },
        { provide: CustomFieldsService, useValue: mockCustomFieldsService },
        { provide: SocketsGateway, useValue: mockSocketsGateway },
        { provide: TrazabilityService, useValue: mockTrazabilityService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<LogisticService>(LogisticService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateLogisticRecordDto = {
      tenantId: 'tenant-1',
      senderContactId: 'sender-1',
      recipientContactId: 'recipient-1',
      carrierId: 'carrier-1',
      labels: ['urgent'],
      items: [
        {
          sku: 'SKU-001',
          name: 'Test Item',
          qtyExpected: 1,
        },
      ],
    };

    const mockRecord = {
      id: 'record-1',
      tenantId: 'tenant-1',
      type: 'TRACKING' as LogisticType,
      guideNumber: 'TRK-001',
      state: 'CHECK_PENDING',
      labels: ['urgent'],
      items: [],
      audit: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      summary: {
        sender: 'sender-1',
        recipient: 'recipient-1',
        carrier: 'carrier-1',
        items: 0,
      },
    };

    it('should create a logistic record successfully', async () => {
      mockContactsService.validateContacts.mockResolvedValue([]);
      mockCustomFieldsService.validateLabels.mockResolvedValue(['urgent']);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          logisticRecord: {
            create: jest.fn().mockResolvedValue(mockRecord),
            update: jest.fn().mockResolvedValue(mockRecord),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.create(createDto, 'TRACKING');

      expect(mockContactsService.validateContacts).toHaveBeenCalledWith('tenant-1', [
        'sender-1',
        'recipient-1',
      ]);
      expect(mockCustomFieldsService.validateLabels).toHaveBeenCalledWith('tenant-1', ['urgent']);
      expect(result).toEqual(mockRecord);
    });

    it('should throw BadRequestException when tenantId is missing', async () => {
      const invalidDto = { ...createDto, tenantId: undefined as any };

      await expect(service.create(invalidDto, 'TRACKING')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when contacts are missing', async () => {
      const invalidDto = { ...createDto, senderContactId: undefined as any };

      await expect(service.create(invalidDto, 'TRACKING')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('get', () => {
    it('should return a logistic record by id', async () => {
      const mockRecord = { id: 'record-1', tenantId: 'tenant-1' };
      mockPrismaService.logisticRecord.findUnique.mockResolvedValue(mockRecord);

      const result = await service.get('record-1');

      expect(mockPrismaService.logisticRecord.findUnique).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        include: { items: true, children: true },
      });
      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException when record not found', async () => {
      mockPrismaService.logisticRecord.findUnique.mockResolvedValue(null);

      await expect(service.get('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyItems', () => {
    it('should verify items successfully', async () => {
      const mockRecord = { id: 'record-1', tenantId: 'tenant-1', checkStartedAt: null };
      const verifyItems = [
        { id: 'item-1', selected: true, qtyVerified: 1 },
        { id: 'item-2', selected: false, qtyVerified: 0 },
      ];

      jest.spyOn(service, 'get').mockResolvedValue(mockRecord as any);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          logisticItem: {
            update: jest.fn().mockResolvedValue({}),
          },
          logisticRecord: {
            update: jest.fn().mockResolvedValue({}),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.verifyItems('record-1', verifyItems);

      expect(result).toEqual({ ok: true });
    });

    it('should throw BadRequestException when no items provided', async () => {
      const mockRecord = { id: 'record-1', tenantId: 'tenant-1' };
      jest.spyOn(service, 'get').mockResolvedValue(mockRecord as any);
      
      await expect(service.verifyItems('record-1', [])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('finalizeCheck', () => {
    it('should finalize check successfully', async () => {
      const mockRecord = { id: 'record-1', tenantId: 'tenant-1' };
      const mockItems = [{ id: 'item-1', selected: true }];

      jest.spyOn(service, 'get').mockResolvedValue(mockRecord as any);
      mockPrismaService.logisticItem.findMany.mockResolvedValue(mockItems);
      mockPrismaService.logisticRecord.update.mockResolvedValue(mockRecord);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.finalizeCheck('record-1', 'user-1');

      expect(mockPrismaService.logisticRecord.update).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        data: {
          state: 'CHECK_FINALIZED',
          checkFinalizedAt: expect.any(Date),
          checkFinalizedBy: 'user-1',
        },
      });
      expect(result).toEqual(mockRecord);
    });

    it('should throw BadRequestException when no items are verified', async () => {
      const mockRecord = { id: 'record-1', tenantId: 'tenant-1' };

      jest.spyOn(service, 'get').mockResolvedValue(mockRecord as any);
      mockPrismaService.logisticItem.findMany.mockResolvedValue([]);

      await expect(service.finalizeCheck('record-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('changeState', () => {
    it('should change state successfully', async () => {
      const mockRecord = { id: 'record-1', tenantId: 'tenant-1' };
      mockPrismaService.logisticRecord.update.mockResolvedValue(mockRecord);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.changeState('record-1', 'READY');

      expect(mockPrismaService.logisticRecord.update).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        data: { state: 'READY' },
      });
      expect(result).toEqual(mockRecord);
    });
  });

  describe('assignMessenger', () => {
    it('should assign messenger successfully', async () => {
      const mockRecord = { id: 'record-1', tenantId: 'tenant-1' };
      mockPrismaService.logisticRecord.update.mockResolvedValue(mockRecord);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.assignMessenger('record-1', 'messenger-1');

      expect(mockPrismaService.logisticRecord.update).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        data: { messengerId: 'messenger-1' },
      });
      expect(result).toEqual(mockRecord);
    });
  });

  describe('printGuide', () => {
    it('should print guide successfully', async () => {
      const mockRecord = { id: 'record-1', tenantId: 'tenant-1', guideNumber: 'TRK-001' };
      const fileUri = 'https://storage.example.com/guide.pdf';

      jest.spyOn(service, 'get').mockResolvedValue(mockRecord as any);
      mockStorageService.uploadPdf.mockResolvedValue(fileUri);
      mockPrismaService.logisticRecord.update.mockResolvedValue({ ...mockRecord, fileUri });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.printGuide('record-1');

      expect(mockStorageService.uploadPdf).toHaveBeenCalledWith(
        'tenant-1',
        'guide-TRK-001.pdf',
        expect.any(Buffer),
      );
      expect(result.fileUri).toBe(fileUri);
    });
  });

  describe('notify', () => {
    it('should send notification successfully', async () => {
      const mockRecord = { id: 'record-1', tenantId: 'tenant-1', guideNumber: 'TRK-001' };
      const channels = ['EMAIL', 'SMS'];

      jest.spyOn(service, 'get').mockResolvedValue(mockRecord as any);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.notify('record-1', channels);

      expect(result).toEqual({
        ok: true,
        link: expect.stringContaining('TRK-001'),
      });
    });
  });

  describe('duplicate', () => {
    it('should duplicate record successfully', async () => {
      const mockRecord = {
        id: 'record-1',
        tenantId: 'tenant-1',
        type: 'TRACKING' as LogisticType,
        senderContactId: 'sender-1',
        recipientContactId: 'recipient-1',
        carrierId: 'carrier-1',
        labels: ['urgent'],
        extra: { test: 'data' },
        summary: { test: 'summary' },
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        audit: [],
      };
      const mockDuplicated = { ...mockRecord, id: 'record-2' };

      jest.spyOn(service, 'get').mockResolvedValue(mockRecord as any);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          logisticRecord: {
            create: jest.fn().mockResolvedValue(mockDuplicated),
          },
          logisticItem: {
            findMany: jest.fn().mockResolvedValue([]),
            createMany: jest.fn().mockResolvedValue({}),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.duplicate('record-1', true);

      expect(result).toEqual(mockDuplicated);
    });
  });
});
