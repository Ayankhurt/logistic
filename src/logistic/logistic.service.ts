import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LogisticRecord } from './interfaces/logistic.interface';
import { SocketsService } from '../sockets/sockets.gateway';
import { CreateLogisticRecordDto } from './dto/create-logistic-record.dto';
import { UpdateLabelsDto } from './dto/update-labels.dto';
import { UpdateLogisticRecordDto } from './dto/update-logistic-record.dto';
import { ChangeStateDto } from './dto/change-state.dto';
import { QueryLogisticRecordsDto } from './dto/query-logistic-records.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CheckItemsDto } from './dto/check-items.dto';
import { FinalizeCheckDto } from './dto/finalize-check.dto';
import { SplitLogisticRecordDto } from './dto/split-records.dto';
import { LogisticState } from '../common/state/logistic-state.enum';
import { ContactsService } from '../integrations/contacts/contacts.service';
import { PrintingService } from '../printing/printing.service';
import {
  NotifyService,
  NotificationRecordData,
} from '../notify/notify.service';
import { TrazabilityService } from '../integrations/trazability/trazability.service';
import { CustomFieldsService } from '../integrations/custom-fields/custom-fields.service';
import { AuthService } from '../integrations/auth/auth.service';

@Injectable()
export class LogisticService {
  private readonly logger = new Logger(LogisticService.name);
  constructor(
    private readonly socketsService: SocketsService,
    private readonly prisma: PrismaService,
    private readonly contactsService: ContactsService,
    private readonly printingService: PrintingService,
    private readonly notifyService: NotifyService,
    private readonly trazabilityService: TrazabilityService,
    private readonly customFieldsService: CustomFieldsService,
    private readonly authService: AuthService,
  ) { }

  async createRecord(dto: CreateLogisticRecordDto): Promise<LogisticRecord> {
    try {
      if (!dto.userId) {
        throw new BadRequestException('User ID is required');
      }
      const userValid = await this.authService.validateUser(
        dto.userId,
        dto.tenantId,
      );
      if (!userValid) {
        throw new BadRequestException(`Invalid user ID: ${dto.userId}`);
      }

      const senderValid = await this.contactsService.validateContact(
        dto.senderContactId,
        dto.tenantId,
      );
      if (!senderValid) {
        throw new BadRequestException(
          `Invalid sender contact ID: ${dto.senderContactId}`,
        );
      }
      const recipientValid = await this.contactsService.validateContact(
        dto.recipientContactId,
        dto.tenantId,
      );
      if (!recipientValid) {
        throw new BadRequestException(
          `Invalid recipient contact ID: ${dto.recipientContactId}`,
        );
      }

      if (dto.type === 'TRACKING') {
        if (!dto.carrierId) {
          throw new BadRequestException(
            'Carrier ID is required for TRACKING records',
          );
        }
      } else if (dto.type === 'PICKING') {
        if (!dto.items || dto.items.length === 0) {
          throw new BadRequestException(
            'Items are required for PICKING records',
          );
        }
      }

      const guideNumber = `G-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const record = await this.prisma.logisticRecord.create({
        data: {
          id: randomUUID(),
          tenantId: dto.tenantId,
          type: dto.type,
          guideNumber,
          senderContactId: dto.senderContactId,
          recipientContactId: dto.recipientContactId,
          carrierId: dto.carrierId,
          labels:
            dto.labels && dto.labels.length > 0 ? dto.labels.join(',') : null,
          extra: dto.extra,
          createdBy: dto.userId,
          items: {
            create: dto.items?.map((i) => ({
              id: randomUUID(),
              originItemId: i.originItemId,
              sku: i.sku,
              name: i.name,
              qtyExpected: i.qtyExpected,
            })),
          },
        },
        include: {
          items: true,
          audit: true,
        },
      });

      try {
        await this.trazabilityService.createEvent({
          action: 'CREATED',
          entity: 'logisticRecord',
          entityId: record.id,
          tenantId: record.tenantId,
          userId: record.createdBy || 'system',
          data: {
            guideNumber: record.guideNumber,
            type: record.type,
          },
        });
      } catch (trazabilityError) {
        await this.prisma.logisticRecord.delete({ where: { id: record.id } });
        throw new BadRequestException(
          'Failed to create trazability event - operation rolled back',
        );
      }

      this.socketsService.emitLogisticCreated({
        id: record.id,
        tenantId: record.tenantId,
        guideNumber: record.guideNumber,
        type: record.type,
        state: record.state,
        messengerId: record.messengerId || undefined,
        etiquetas: record.labels,
        resumen: record.summary,
        changedBy: record.createdBy || 'system',
        timestamp: record.createdAt.toISOString(),
      });

      return this.mapDbRecordToDomain(record);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating record: ${err.message}`);
      throw err;
    }
  }

  async getRecord(id: string, tenantId: string): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true, audit: true, children: true },
    });
    if (!record) throw new NotFoundException('Record not found');
    if (record.tenantId !== tenantId)
      throw new BadRequestException('Tenant mismatch');
    return this.mapDbRecordToDomain(record);
  }

  async updateRecord(
    id: string,
    dto: UpdateLogisticRecordDto,
  ): Promise<LogisticRecord> {
    if (!dto.userId) {
      throw new BadRequestException('User ID is required');
    }
    const existingRecord = await this.prisma.logisticRecord.findUnique({
      where: { id },
    });
    if (!existingRecord) throw new NotFoundException('Record not found');
    const userValid = await this.authService.validateUser(
      dto.userId,
      existingRecord.tenantId,
    );
    if (!userValid) {
      throw new BadRequestException(`Invalid user ID: ${dto.userId}`);
    }

    const record = await this.prisma.logisticRecord.update({
      where: { id },
      data: {
        labels:
          dto.labels && dto.labels.length > 0 ? dto.labels.join(',') : null,
        extra: dto.extra as any,
        carrierId: dto.carrierId,
        updatedBy: dto.userId,
      },
      include: { items: true, audit: true, children: true },
    });

    this.socketsService.emitLogisticUpdated({
      id: record.id,
      tenantId: record.tenantId,
      guideNumber: record.guideNumber,
      type: record.type,
      state: record.state,
      messengerId: record.messengerId || undefined,
      etiquetas: record.labels,
      resumen: record.summary,
      changedBy: record.updatedBy || 'system',
      timestamp: record.updatedAt.toISOString(),
    });
    return this.mapDbRecordToDomain(record);
  }

  // --- CHANGE STATE ---
  async changeState(id: string, dto: ChangeStateDto): Promise<LogisticRecord> {
    // Validate user
    if (!dto.userId) {
      throw new BadRequestException('User ID is required');
    }
    const existingRecord = await this.prisma.logisticRecord.findUnique({
      where: { id },
    });
    if (!existingRecord) throw new NotFoundException('Record not found');
    const userValid = await this.authService.validateUser(
      dto.userId,
      existingRecord.tenantId,
    );
    if (!userValid) {
      throw new BadRequestException(`Invalid user ID: ${dto.userId}`);
    }

    const record = await this.prisma.logisticRecord.update({
      where: { id },
      data: { state: dto.state as any },
      include: { items: true, audit: true, children: true },
    });
    this.socketsService.emitLogisticStateChanged({
      id: record.id,
      tenantId: record.tenantId,
      guideNumber: record.guideNumber,
      type: record.type,
      state: record.state,
      messengerId: record.messengerId || undefined,
      etiquetas: record.labels,
      resumen: record.summary,
      changedBy: dto.userId,
      timestamp: new Date().toISOString(),
    });
    return this.mapDbRecordToDomain(record);
  }

  async listRecords(query: QueryLogisticRecordsDto): Promise<LogisticRecord[]> {
    const where: any = {};

    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.type) where.type = query.type;
    if (query.state) where.state = query.state;
    if (query.messengerId) where.messengerId = query.messengerId;
    if (query.labels && query.labels.length > 0) {
      where.labels = {
        contains: query.labels.join(','),
      };
    }
    if (query.guideNumber) where.guideNumber = query.guideNumber;

    const records = await this.prisma.logisticRecord.findMany({
      where,
      include: { items: true, audit: true, children: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.mapDbRecordToDomain(record));
  }

  async checkItems(id: string, dto: CheckItemsDto): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!record) throw new NotFoundException('Record not found');

    const checkStartedAt = record.checkStartedAt || new Date();

    if (!record.checkStartedAt) {
      await this.prisma.logisticRecord.update({
        where: { id },
        data: { checkStartedAt },
      });
    }

    for (const checkItem of dto.items) {
      const originalItem = record.items.find(
        (item) => item.id === checkItem.id,
      );
      if (originalItem && checkItem.qtyVerified > originalItem.qtyExpected) {
        this.logger.warn(
          `Item ${checkItem.id} verified quantity (${checkItem.qtyVerified}) exceeds expected quantity (${originalItem.qtyExpected}) for record ${id}`,
        );
      }
      await this.prisma.logisticItem.update({
        where: { id: checkItem.id },
        data: {
          qtyVerified: checkItem.qtyVerified,
          selected: checkItem.selected,
        },
      });
    }

    const updatedRecord = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true, audit: true, children: true },
    });

    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        recordId: id,
        action: 'CHECK_VERIFIED',
        payload: JSON.stringify(dto.items),
        createdBy: dto.userId,
      },
    });

    if (!updatedRecord)
      throw new NotFoundException('Record not found after update');

    this.socketsService.emitLogisticCheckUpdated({
      id: updatedRecord.id,
      tenantId: updatedRecord.tenantId,
      guideNumber: updatedRecord.guideNumber,
      type: updatedRecord.type,
      state: updatedRecord.state,
      messengerId: updatedRecord.messengerId || undefined,
      etiquetas: updatedRecord.labels,
      resumen: updatedRecord.summary,
      changedBy: dto.userId,
      timestamp: new Date().toISOString(),
    });

    return this.mapDbRecordToDomain(updatedRecord);
  }

  async finalizeCheck(
    id: string,
    dto: FinalizeCheckDto,
  ): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.update({
      where: { id },
      data: {
        checkFinalizedAt: new Date(),
        checkFinalizedBy: dto.userId,
        state: LogisticState.CHECK_FINALIZED as any,
      },
      include: { items: true, audit: true, children: true },
    });

    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        recordId: id,
        action: 'CHECK_FINALIZED',
        createdBy: dto.userId,
      },
    });

    this.socketsService.emitLogisticCheckFinalized({
      id: record.id,
      tenantId: record.tenantId,
      guideNumber: record.guideNumber,
      type: record.type,
      state: record.state,
      messengerId: record.messengerId || undefined,
      etiquetas: record.labels,
      resumen: record.summary,
      changedBy: dto.userId,
      timestamp: new Date().toISOString(),
    });

    return this.mapDbRecordToDomain(record);
  }

  async assignMessenger(
    id: string,
    messengerId: string,
    userId: string,
  ): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.update({
      where: { id },
      data: {
        messengerId,
        state: LogisticState.ASSIGNED as any,
        updatedBy: userId,
      },
      include: { items: true, audit: true, children: true },
    });


    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        recordId: id,
        action: 'MESSENGER_ASSIGNED',
        createdBy: userId,
        payload: JSON.stringify({ messengerId }),
      },
    });

    this.socketsService.emitLogisticMessengerAssigned({
      id: record.id,
      tenantId: record.tenantId,
      guideNumber: record.guideNumber,
      type: record.type,
      state: record.state,
      messengerId: record.messengerId || undefined,
      etiquetas: record.labels,
      resumen: record.summary,
      changedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return this.mapDbRecordToDomain(record);
  }

  async printGuide(
    id: string,
    format: string,
    userId: string,
  ): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true, audit: true, children: true },
    });

    if (!record) throw new NotFoundException('Record not found');

    const fileUri = await this.printingService.generatePDF(id, record.tenantId);

    if (!fileUri) {
      throw new BadRequestException('Failed to generate print file');
    }

    const updatedRecord = await this.prisma.logisticRecord.update({
      where: { id },
      data: {
        fileUri,
        updatedBy: userId,
      },
      include: { items: true, audit: true, children: true },
    });

    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        recordId: id,
        action: 'PRINTED',
        createdBy: userId,
        payload: JSON.stringify({ format }),
      },
    });

    this.socketsService.emitLogisticPrinted({
      id: updatedRecord.id,
      tenantId: updatedRecord.tenantId,
      guideNumber: updatedRecord.guideNumber,
      type: updatedRecord.type,
      state: updatedRecord.state,
      messengerId: updatedRecord.messengerId || undefined,
      etiquetas: updatedRecord.labels,
      resumen: updatedRecord.summary,
      changedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return this.mapDbRecordToDomain(updatedRecord);
  }

  async sendNotification(
    id: string,
    channel: string,
    recipient: string,
    userId: string,
  ): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true, audit: true, children: true },
    });

    if (!record) throw new NotFoundException('Record not found');

    const notificationData: NotificationRecordData = {
      guideNumber: record.guideNumber,
      type: record.type,
      senderContactId: record.senderContactId,
      recipientContactId: record.recipientContactId,
      carrierId: record.carrierId || undefined,
      labels: this.mapDbRecordToDomain(record).labels,
      items: record.items.map((item) => ({
        name: item.name,
        qtyExpected: item.qtyExpected,
      })),
      tenantId: record.tenantId,
    };

    if (channel.toLowerCase() === 'sms') {
      await this.notifyService.sendTrackingNotification(
        recipient,
        notificationData,
        `https://tracking.example.com/${record.guideNumber}`,
      );
    } else if (channel.toLowerCase() === 'whatsapp') {
      await this.notifyService.sendWhatsAppTracking(
        recipient,
        notificationData,
        `https://tracking.example.com/${record.guideNumber}`,
      );
    } else {
      throw new BadRequestException(
        `Unsupported notification channel: ${channel}`,
      );
    }

    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        recordId: id,
        action: 'NOTIFICATION_SENT',
        createdBy: userId,
        payload: JSON.stringify({ channel, recipient }),
      },
    });

    this.socketsService.emitLogisticNotificationSent({
      id: record.id,
      tenantId: record.tenantId,
      guideNumber: record.guideNumber,
      type: record.type,
      state: record.state,
      messengerId: record.messengerId || undefined,
      etiquetas: record.labels,
      resumen: record.summary,
      changedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return this.mapDbRecordToDomain(record);
  }

  async duplicateRecord(
    id: string,
    copyExtraFields: boolean,
    userId: string,
  ): Promise<LogisticRecord> {
    const originalRecord = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!originalRecord) throw new NotFoundException('Record not found');

    const newRecord = await this.prisma.logisticRecord.create({
      data: {
        id: randomUUID(),
        tenantId: originalRecord.tenantId,
        type: originalRecord.type,
        guideNumber: `G-${Date.now()}`,
        senderContactId: originalRecord.senderContactId,
        recipientContactId: originalRecord.recipientContactId,
        carrierId: originalRecord.carrierId,
        labels: originalRecord.labels,
        extra: copyExtraFields ? (originalRecord.extra as any) : null,
        createdBy: userId,
        items: {
          create: originalRecord.items.map((item) => ({
            id: randomUUID(),
            originItemId: item.originItemId,
            sku: item.sku,
            name: item.name,
            qtyExpected: item.qtyExpected,
          })),
        },
      },
      include: { items: true, audit: true },
    });

    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: originalRecord.tenantId,
        recordId: newRecord.id,
        action: 'DUPLICATED',
        createdBy: userId,
        payload: JSON.stringify({ originalRecordId: id }),
      },
    });

    this.socketsService.emitLogisticDuplicated({
      id: newRecord.id,
      tenantId: newRecord.tenantId,
      guideNumber: newRecord.guideNumber,
      type: newRecord.type,
      state: newRecord.state,
      messengerId: newRecord.messengerId || undefined,
      etiquetas: newRecord.labels,
      resumen: newRecord.summary,
      changedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return this.mapDbRecordToDomain(newRecord);
  }

  async splitRecord(
    id: string,
    dto: SplitLogisticRecordDto,
  ): Promise<LogisticRecord> {
    const originalRecord = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!originalRecord) throw new NotFoundException('Record not found');

    const newRecord = await this.prisma.logisticRecord.create({
      data: {
        id: randomUUID(),
        tenantId: originalRecord.tenantId,
        type: originalRecord.type,
        guideNumber: `G-${Date.now()}-SPLIT`,
        senderContactId: originalRecord.senderContactId,
        recipientContactId: originalRecord.recipientContactId,
        carrierId: originalRecord.carrierId,
        labels: originalRecord.labels,
        extra: originalRecord.extra as any,
        parentRecordId: id,
        createdBy: dto.userId,
        items: {
          create: dto.items.map((splitItem) => {
            const originalItem = originalRecord.items.find(
              (item) => item.id === splitItem.originItemId,
            );

            if (!originalItem) {
              throw new BadRequestException(
                `Item with ID ${splitItem.originItemId} not found in original record`,
              );
            }

            if (splitItem.qtyToSplit > originalItem.qtyExpected) {
              throw new BadRequestException(
                `Cannot split more than available quantity for item ${splitItem.originItemId}`,
              );
            }

            return {
              id: randomUUID(),
              originItemId: originalItem.originItemId,
              sku: originalItem.sku,
              name: originalItem.name,
              qtyExpected: splitItem.qtyToSplit,
            };
          }),
        },
      },
      include: { items: true, audit: true },
    });

    for (const splitItem of dto.items) {
      const originalItem = originalRecord.items.find(
        (item) => item.id === splitItem.originItemId,
      );

      await this.prisma.logisticItem.update({
        where: { id: splitItem.originItemId },
        data: {
          qtyExpected: originalItem!.qtyExpected - splitItem.qtyToSplit,
        },
      });
    }

    // Create audit entries
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: originalRecord.tenantId,
        recordId: id,
        action: 'SPLIT',
        createdBy: dto.userId,
        payload: JSON.stringify({ newRecordId: newRecord.id }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: originalRecord.tenantId,
        recordId: newRecord.id,
        action: 'CREATED_FROM_SPLIT',
        createdBy: dto.userId,
        payload: JSON.stringify({ parentRecordId: id }),
      },
    });

    // Emit socket events
    const originalRecordData = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true, audit: true, children: true },
    });

    this.socketsService.emitLogisticUpdated({
      id: originalRecordData!.id,
      tenantId: originalRecordData!.tenantId,
      guideNumber: originalRecordData!.guideNumber,
      type: originalRecordData!.type,
      state: originalRecordData!.state,
      messengerId: originalRecordData!.messengerId || undefined,
      etiquetas: originalRecordData!.labels,
      resumen: originalRecordData!.summary,
      changedBy: dto.userId,
      timestamp: new Date().toISOString(),
    });

    this.socketsService.emitLogisticCreated({
      id: newRecord.id,
      tenantId: newRecord.tenantId,
      guideNumber: newRecord.guideNumber,
      type: newRecord.type,
      state: newRecord.state,
      messengerId: newRecord.messengerId || undefined,
      etiquetas: newRecord.labels,
      resumen: newRecord.summary,
      changedBy: dto.userId,
      timestamp: new Date().toISOString(),
    });

    return this.mapDbRecordToDomain(newRecord);
  }

  // --- DELETE RECORD ---
  async deleteRecord(id: string, userId: string): Promise<void> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!record) throw new NotFoundException('Record not found');

    // Delete associated items first
    await this.prisma.logisticItem.deleteMany({
      where: { recordId: id },
    });

    // Delete audit logs
    await this.prisma.auditLog.deleteMany({
      where: { recordId: id },
    });

    await this.prisma.logisticRecord.delete({
      where: { id },
    });


    this.socketsService.emitToTenant(
      record.tenantId,
      'logistic.record.deleted',
      {
        id,
        tenantId: record.tenantId,
        guideNumber: record.guideNumber,
        type: record.type,
        state: record.state,
        messengerId: record.messengerId || undefined,
        etiquetas: record.labels,
        resumen: record.summary,
        changedBy: userId,
        timestamp: new Date().toISOString(),
      },
    );
  }

  async getAssignment(id: string): Promise<any> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      select: { messengerId: true, state: true },
    });
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  async addEvent(id: string, eventDto: any): Promise<any> {
   
    const event = await this.trazabilityService.createEvent({
      action: eventDto.eventType || 'CUSTOM_EVENT',
      entity: 'logisticRecord',
      entityId: id,
      tenantId: eventDto.tenantId,
      userId: eventDto.userId,
      data: eventDto.payload || {},
    });
    return event;
  }

 
  async listEvents(id: string): Promise<any[]> {
    
    const events = await this.prisma.auditLog.findMany({
      where: { recordId: id },
      orderBy: { createdAt: 'desc' },
    });

    return events.map((event) => ({
      id: event.id,
      recordId: event.recordId,
      action: event.action,
      payload: event.payload,
      createdBy: event.createdBy,
      createdAt: event.createdAt,
    }));
  }

  async addItem(id: string, dto: any): Promise<any> {
    const item = await this.prisma.logisticItem.create({
      data: {
        id: randomUUID(),
        recordId: id,
        originItemId: dto.originItemId,
        sku: dto.sku,
        name: dto.name,
        qtyExpected: dto.qtyExpected,
      },
    });
    return item;
  }

  async updateItem(id: string, itemId: string, dto: any): Promise<any> {
    const item = await this.prisma.logisticItem.update({
      where: { id: itemId },
      data: {
        qtyVerified: dto.qtyVerified,
        selected: dto.selected,
      },
    });
    return item;
  }

  async deleteItem(id: string, itemId: string): Promise<void> {
    await this.prisma.logisticItem.delete({
      where: { id: itemId },
    });
  }

  private mapDbRecordToDomain(db: any): LogisticRecord {
    return {
      ...db,
      labels: Array.isArray(db.labels)
        ? db.labels
        : typeof db.labels === 'string' && db.labels.length > 0
          ? db.labels.split(',')
          : [],
    } as LogisticRecord;
  }

  async assignTags(id: string, tags: string[]): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
    });
    if (!record) throw new NotFoundException('Record not found');

    const currentLabels = record.labels ? record.labels.split(',') : [];
    const newLabels = [...new Set([...currentLabels, ...tags])];

    const updatedRecord = await this.prisma.logisticRecord.update({
      where: { id },
      data: { labels: newLabels.join(',') },
      include: { items: true, audit: true, children: true },
    });

    return this.mapDbRecordToDomain(updatedRecord);
  }

  async updateLabels(
    id: string,
    dto: UpdateLabelsDto,
  ): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true, audit: true, children: true },
    });

    if (!record) throw new NotFoundException('Record not found');

    const isValid = await this.customFieldsService.validateExtraFields(
      { labels: dto.labels },
      record.tenantId,
    );
    if (!isValid) {
      throw new BadRequestException(
        'Invalid labels according to custom fields validation',
      );
    }

    const updatedRecord = await this.prisma.logisticRecord.update({
      where: { id },
      data: {
        labels: dto.labels.join(','),
        updatedBy: dto.userId,
      },
      include: { items: true, audit: true, children: true },
    });

    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        recordId: id,
        action: 'STATE_CHANGED', 
        createdBy: dto.userId,
        payload: JSON.stringify({ labels: dto.labels }),
      },
    });

   
    await this.customFieldsService.notifyLabelUpdate(
      record.tenantId,
      id,
      dto.labels,
    );

    
    this.socketsService.emitLogisticLabelsUpdated({
      id: updatedRecord.id,
      tenantId: updatedRecord.tenantId,
      guideNumber: updatedRecord.guideNumber,
      type: updatedRecord.type,
      state: updatedRecord.state,
      messengerId: updatedRecord.messengerId || undefined,
      etiquetas: updatedRecord.labels,
      resumen: updatedRecord.summary,
      changedBy: dto.userId,
      timestamp: new Date().toISOString(),
    });

    return this.mapDbRecordToDomain(updatedRecord);
  }
}
