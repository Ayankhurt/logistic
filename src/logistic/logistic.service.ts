// src/logistic/logistic.service.ts
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
import { NotifyService } from '../notify/notify.service';
import { TrazabilityService } from '../integrations/trazability/trazability.service';

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
  ) {}

  // --- CREATE RECORD ---
  async createRecord(dto: CreateLogisticRecordDto): Promise<LogisticRecord> {
    try {
      // Validate sender and recipient contacts
      const senderValid = await this.contactsService.validateContact(dto.senderContactId, dto.tenantId);
      if (!senderValid) {
        throw new BadRequestException(`Invalid sender contact ID: ${dto.senderContactId}`);
      }
      const recipientValid = await this.contactsService.validateContact(dto.recipientContactId, dto.tenantId);
      if (!recipientValid) {
        throw new BadRequestException(`Invalid recipient contact ID: ${dto.recipientContactId}`);
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
          labels: (dto.labels ?? []).join(','),
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

      // Create trazability event (failure stops operation)
      try {
        await this.trazabilityService.createEvent({
          recordId: record.id,
          eventType: 'CREATED',
          payload: {
            guideNumber: record.guideNumber,
            type: record.type,
            tenantId: record.tenantId,
          },
        });
      } catch (trazabilityError) {
        // If trazability fails, rollback the record creation
        await this.prisma.logisticRecord.delete({ where: { id: record.id } });
        throw new BadRequestException('Failed to create trazability event - operation rolled back');
      }

      // Emit socket event
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

  // --- GET RECORD ---
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

  // --- UPDATE RECORD ---
  async updateRecord(
    id: string,
    dto: UpdateLogisticRecordDto,
  ): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.update({
      where: { id },
      data: {
        labels: dto.labels?.join(','),
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

  // --- LIST RECORDS ---
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

  // --- CHECK ITEMS ---
  async checkItems(id: string, dto: CheckItemsDto): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!record) throw new NotFoundException('Record not found');

    // Set checkStartedAt if not already set
    const checkStartedAt = record.checkStartedAt || new Date();

    // Update record with checkStartedAt if needed
    if (!record.checkStartedAt) {
      await this.prisma.logisticRecord.update({
        where: { id },
        data: { checkStartedAt },
      });
    }

    // Update each item with verified quantity
    for (const checkItem of dto.items) {
      await this.prisma.logisticItem.update({
        where: { id: checkItem.id },
        data: {
          qtyVerified: checkItem.qtyVerified,
          selected: checkItem.selected,
        },
      });
    }

    // Get updated record
    const updatedRecord = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true, audit: true, children: true },
    });

    // Create audit entry
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

    if (!updatedRecord) throw new NotFoundException('Record not found after update');

    // Emit socket event
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

  // --- FINALIZE CHECK ---
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

    // Create audit entry
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        recordId: id,
        action: 'CHECK_FINALIZED',
        createdBy: dto.userId,
      },
    });

    // Emit socket event
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

  // --- ASSIGN MESSENGER ---
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

    // Create audit entry
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

    // Emit socket event
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

  // --- PRINT GUIDE ---
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

    // Generate PDF using PrintingService
    const fileUri = await this.printingService.generatePDF(id, record.tenantId);

    if (!fileUri) {
      throw new BadRequestException('Failed to generate print file');
    }

    // Update record with file URI
    const updatedRecord = await this.prisma.logisticRecord.update({
      where: { id },
      data: {
        fileUri,
        updatedBy: userId,
      },
      include: { items: true, audit: true, children: true },
    });

    // Create audit entry
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

    // Emit socket event
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

  // --- SEND NOTIFICATION ---
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

    // Send notification using NotifyService
    if (channel.toLowerCase() === 'sms') {
      await this.notifyService.sendTrackingNotification(
        recipient,
        record.guideNumber,
        `https://tracking.example.com/${record.guideNumber}`,
      );
    } else if (channel.toLowerCase() === 'whatsapp') {
      await this.notifyService.sendWhatsAppTracking(
        recipient,
        record.guideNumber,
        `https://tracking.example.com/${record.guideNumber}`,
      );
    } else {
      throw new BadRequestException(`Unsupported notification channel: ${channel}`);
    }

    // Create audit entry
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

    // Emit socket event
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

  // --- DUPLICATE RECORD ---
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

    // Create new record with data from original
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

    // Create audit entry
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

    // Emit socket event
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

  // --- SPLIT RECORD ---
  async splitRecord(
    id: string,
    dto: SplitLogisticRecordDto,
  ): Promise<LogisticRecord> {
    const originalRecord = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!originalRecord) throw new NotFoundException('Record not found');

    // Create new record as a child of the original
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

    // Update quantities in original record items
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

    // Delete the record
    await this.prisma.logisticRecord.delete({
      where: { id },
    });

    // Create audit entry for deletion (optional, since record is deleted)
    // We can log this in a separate audit table if needed

    // Emit socket event
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

  // --- GET ASSIGNMENT ---
  async getAssignment(id: string): Promise<any> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      select: { messengerId: true, state: true },
    });
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  // --- ADD EVENT ---
  async addEvent(id: string, eventDto: any): Promise<any> {
    // Use trazability service to create event
    const event = await this.trazabilityService.createEvent({
      recordId: id,
      eventType: eventDto.eventType,
      payload: eventDto.payload,
    });
    return event;
  }

  // --- LIST EVENTS ---
  async listEvents(id: string): Promise<any[]> {
    // Get events from the audit log table
    const events = await this.prisma.auditLog.findMany({
      where: { recordId: id },
      orderBy: { createdAt: 'desc' },
    });

    return events.map(event => ({
      id: event.id,
      recordId: event.recordId,
      action: event.action,
      payload: event.payload,
      createdBy: event.createdBy,
      createdAt: event.createdAt,
    }));
  }

  // --- ADD ITEM ---
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

  // --- UPDATE ITEM ---
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

  // --- DELETE ITEM ---
  async deleteItem(id: string, itemId: string): Promise<void> {
    await this.prisma.logisticItem.delete({
      where: { id: itemId },
    });
  }

  private mapDbRecordToDomain(db: any): LogisticRecord {
    return {
      ...db,
      labels:
        typeof db.labels === 'string' && db.labels.length > 0
          ? db.labels.split(',')
          : [],
    } as LogisticRecord;
  }

  // --- ASSIGN TAGS ---
  async assignTags(id: string, tags: string[]): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.findUnique({ where: { id } });
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

  // --- UPDATE LABELS ---
  async updateLabels(id: string, dto: UpdateLabelsDto): Promise<LogisticRecord> {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true, audit: true, children: true },
    });

    if (!record) throw new NotFoundException('Record not found');

    // Update labels
    const updatedRecord = await this.prisma.logisticRecord.update({
      where: { id },
      data: {
        labels: dto.labels.join(','),
        updatedBy: dto.userId,
      },
      include: { items: true, audit: true, children: true },
    });

    // Create audit entry
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        recordId: id,
        action: 'STATE_CHANGED', // Using STATE_CHANGED for label updates
        createdBy: dto.userId,
        payload: JSON.stringify({ labels: dto.labels }),
      },
    });

    // Emit socket event
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
