import { Test, TestingModule } from '@nestjs/testing';
import { LogisticService } from '../logistic/logistic.service';
import { PrismaService } from '../prisma/prisma.service';
import { SocketsService } from '../sockets/sockets.gateway';
import { ContactsService } from '../integrations/contacts/contacts.service';
import { TrazabilityService } from '../integrations/trazability/trazability.service';
import { CreateLogisticRecordDto } from '../logistic/dto/create-logistic-record.dto';
import { LogisticType } from '@prisma/client';

describe('LogisticService', () => {
  let service: LogisticService;
  let prismaService: PrismaService;
  let socketsService: SocketsService;
  let contactsService: ContactsService;
  let trazabilityService: TrazabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticService,
        {
          provide: PrismaService,
          useValue: {
            logisticRecord: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: SocketsService,
          useValue: {
            emitLogisticCreated: jest.fn(),
          },
        },
        {
          provide: ContactsService,
          useValue: {
            validateContact: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: TrazabilityService,
          useValue: {
            createEvent: jest.fn().mockResolvedValue({ status: 'success' }),
          },
        },
      ],
    }).compile();

    service = module.get<LogisticService>(LogisticService);
    prismaService = module.get<PrismaService>(PrismaService);
    socketsService = module.get<SocketsService>(SocketsService);
    contactsService = module.get<ContactsService>(ContactsService);
    trazabilityService = module.get<TrazabilityService>(TrazabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRecord', () => {
    it('should create a logistic record successfully', async () => {
      const dto: CreateLogisticRecordDto = {
        tenantId: 'tenant-1',
        type: LogisticType.TRACKING,
        senderContactId: 'sender-1',
        recipientContactId: 'recipient-1',
        userId: 'user-1',
      };

      const mockRecord = {
        id: 'record-1',
        tenantId: 'tenant-1',
        type: LogisticType.TRACKING,
        guideNumber: 'G-123',
        state: 'DRAFT',
        labels: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.logisticRecord, 'create').mockResolvedValue(mockRecord as any);

      const result = await service.createRecord(dto);

      expect(result).toBeDefined();
      expect(prismaService.logisticRecord.create).toHaveBeenCalled();
      expect(socketsService.emitLogisticCreated).toHaveBeenCalled();
      expect(trazabilityService.createEvent).toHaveBeenCalled();
    });

    it('should throw error if trazability service fails', async () => {
      const dto: CreateLogisticRecordDto = {
        tenantId: 'tenant-1',
        type: LogisticType.TRACKING,
        senderContactId: 'sender-1',
        recipientContactId: 'recipient-1',
        userId: 'user-1',
      };

      jest.spyOn(trazabilityService, 'createEvent').mockRejectedValue(new Error('Trazability error'));

      await expect(service.createRecord(dto)).rejects.toThrow('Failed to create trazability event');
    });
  });
});
