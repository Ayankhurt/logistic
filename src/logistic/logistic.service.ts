import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateGuideNumber } from '../common/auth/helpers/guide-number';
import { ContactsService } from '../integrations/contacts/contacts.service';
import { CustomFieldsService } from '../integrations/custom-fields/custom-fields.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { TrazabilityService } from '../integrations/trazability/trazability.service';
import { StorageService } from '../integrations/storage/storage.service';
import { randomUUID } from 'crypto';

@Injectable()
export class LogisticService {
  constructor(
    private prisma: PrismaService,
    private contacts: ContactsService,
    private customFields: CustomFieldsService,
    private sockets: SocketsGateway,
    private traz: TrazabilityService,
    private storage: StorageService,
  ) {}

  private async emit(event: string, record: any, changedBy?: string) {
    const payload = {
      id: record.id,
      tenantId: record.tenantId,
      guideNumber: record.guideNumber,
      type: record.type,
      state: record.state,
      messengerId: record.messengerId ?? null,
      etiquetas: record.labels,
      resumen: record.summary ?? null,
      changedBy,
      timestamp: new Date().toISOString(),
    };
    this.sockets.emitEvent(`logistic.${event}`, payload);
  }

  async create(
    dto: any,
    type: 'TRACKING' | 'PICKING',
    origin?: { originType?: string; originId?: string },
  ) {
    const tenantId = dto.tenantId;
    if (!tenantId) throw new BadRequestException('tenantId required');
    if (!dto.senderContactId || !dto.recipientContactId)
      throw new BadRequestException('Contacts required');

    await this.contacts.validateContacts(tenantId, [
      dto.senderContactId,
      dto.recipientContactId,
    ]);
    if (dto.labels)
      await this.customFields.validateLabels(tenantId, dto.labels);

    const guide = generateGuideNumber(type, tenantId);

    const created = await this.prisma.$transaction(async (tx) => {
      const record = await tx.logisticRecord.create({
        data: {
          tenantId,
          type,
          guideNumber: guide,
          originType: origin?.originType,
          originId: origin?.originId,
          senderContactId: dto.senderContactId,
          recipientContactId: dto.recipientContactId,
          carrierId: dto.carrierId ?? null,
          labels: dto.labels ?? [],
          extra: dto.extra ?? {},
          state: 'CHECK_PENDING',
          createdBy: dto.userId ?? null,
          items: {
            create: (dto.items ?? []).map((i: any) => ({
              originItemId: i.originItemId ?? null,
              sku: i.sku ?? null,
              name: i.name ?? null,
              qtyExpected: i.qtyExpected ?? 1,
            })),
          },
        },
        include: { items: true },
      });

      const summary = {
        sender: dto.senderContactId,
        recipient: dto.recipientContactId,
        carrier: dto.carrierId ?? null,
        items: record.items.length,
      };

      await tx.logisticRecord.update({
        where: { id: record.id },
        data: { summary },
      });

      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId,
          recordId: record.id,
          action: 'CREATED',
          payload: { type, origin, dto },
          createdBy: dto.userId ?? null,
        },
      });

      return { ...record, summary };
    });

    await this.traz.emitBaseEvent('CREATED', { id: created.id, tenantId });
    await this.emit('created', created, dto.userId);
    await this.emit('updated', created, dto.userId);
    return created;
  }

  async list(q: any) {
    const tenantId = q.tenantId;
    if (!tenantId) throw new BadRequestException('tenantId required');
    const where: any = { tenantId };
    if (q.type) where.type = q.type;
    if (q.state) where.state = q.state;
    if (q.messengerId) where.messengerId = q.messengerId;
    if (q.labels?.length) where.labels = { hasEvery: q.labels };
    return this.prisma.logisticRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async get(id: string) {
    const rec = await this.prisma.logisticRecord.findUnique({
      where: { id },
      include: { items: true, children: true }, // comment this if schema has no children relation yet
    });
    if (!rec) throw new NotFoundException('Not found');
    return rec;
  }

  async update(id: string, dto: any) {
    const rec = await this.get(id);
    const allowed: any = {};
    if (dto.labels)
      allowed.labels = await this.customFields.validateLabels(
        rec.tenantId,
        dto.labels,
      );
    if (dto.extra) allowed.extra = dto.extra;
    if (dto.carrierId !== undefined) allowed.carrierId = dto.carrierId;

    const updated = await this.prisma.logisticRecord.update({
      where: { id },
      data: allowed,
    });
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: updated.tenantId,
        recordId: id,
        action: 'UPDATED',
        payload: allowed,
        createdBy: dto.userId ?? null,
      },
    });
    await this.traz.emitBaseEvent('UPDATED', {
      id,
      tenantId: updated.tenantId,
    });
    await this.emit('updated', updated, dto.userId);
    return updated;
  }

  async remove(id: string) {
    const rec = await this.get(id);
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: rec.tenantId,
        recordId: id,
        action: 'DELETED',
      },
    });
    await this.prisma.logisticRecord.delete({ where: { id } });
    return { ok: true };
  }

  async verifyItems(
    id: string,
    items: { id: string; selected: boolean; qtyVerified?: number }[],
  ) {
    const rec = await this.get(id);
    if (!items?.length) throw new BadRequestException('No items provided');

    await this.prisma.$transaction(async (tx) => {
      for (const it of items) {
        await tx.logisticItem.update({
          where: { id: it.id },
          data: {
            selected: !!it.selected,
            qtyVerified:
              typeof it.qtyVerified === 'number' ? it.qtyVerified : undefined,
          },
        });
      }
      await tx.logisticRecord.update({
        where: { id },
        data: {
          state: 'CHECK_IN_PROGRESS',
          checkStartedAt: rec.checkStartedAt ?? new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: rec.tenantId,
          recordId: id,
          action: 'CHECK_VERIFIED',
          payload: { items },
        },
      });
    });

    const after = await this.get(id);
    await this.traz.emitBaseEvent('CHECK_VERIFIED', {
      id,
      tenantId: rec.tenantId,
    });
    await this.emit('check.updated', after);
    return { ok: true };
  }

  async finalizeCheck(id: string, userId?: string) {
    const rec = await this.get(id);
    const items = await this.prisma.logisticItem.findMany({
      where: { recordId: id, selected: true },
    });
    if (!items.length)
      throw new BadRequestException('At least one item must be verified');

    const updated = await this.prisma.logisticRecord.update({
      where: { id },
      data: {
        state: 'CHECK_FINALIZED',
        checkFinalizedAt: new Date(),
        checkFinalizedBy: userId ?? null,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: rec.tenantId,
        recordId: id,
        action: 'CHECK_FINALIZED',
        createdBy: userId ?? null,
      },
    });
    await this.traz.emitBaseEvent('CHECK_FINALIZED', {
      id,
      tenantId: rec.tenantId,
    });
    await this.emit('check.finalized', updated, userId);
    return updated;
  }

  async changeState(id: string, state: string) {
    const updated = await this.prisma.logisticRecord.update({
      where: { id },
      data: { state } as any,
    });
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: updated.tenantId,
        recordId: id,
        action: 'STATE_CHANGED',
        payload: { state },
      },
    });
    await this.traz.emitBaseEvent('STATE_CHANGED', {
      id,
      tenantId: updated.tenantId,
      state,
    });
    await this.emit('state.changed', updated);
    return updated;
  }

  async updateLabels(id: string, labels: string[]) {
    const rec = await this.get(id);
    const valid = await this.customFields.validateLabels(rec.tenantId, labels);
    const updated = await this.prisma.logisticRecord.update({
      where: { id },
      data: { labels: valid },
    });
    await this.emit('labels.updated', updated);
    return updated;
  }

  async assignMessenger(id: string, messengerId: string) {
    const updated = await this.prisma.logisticRecord.update({
      where: { id },
      data: { messengerId },
    });
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: updated.tenantId,
        recordId: id,
        action: 'MESSENGER_ASSIGNED',
        payload: { messengerId },
      },
    });
    await this.traz.emitBaseEvent('MESSENGER_ASSIGNED', {
      id,
      tenantId: updated.tenantId,
      messengerId,
    });
    await this.emit('messenger.assigned', updated);
    return updated;
  }

  async printGuide(id: string) {
    const rec = await this.get(id);
    const pdfBuffer = Buffer.from(`PDF Guide ${rec.guideNumber}`);
    const fileUri = await this.storage.uploadPdf(
      rec.tenantId,
      `guide-${rec.guideNumber}.pdf`,
      pdfBuffer,
    );
    const updated = await this.prisma.logisticRecord.update({
      where: { id },
      data: { fileUri },
    });
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: rec.tenantId,
        recordId: id,
        action: 'PRINTED',
        payload: { fileUri },
      },
    });
    await this.traz.emitBaseEvent('PRINTED', {
      id,
      tenantId: rec.tenantId,
      fileUri,
    });
    await this.emit('printed', updated);
    return updated;
  }

  async notify(id: string, channels: string[]) {
    const rec = await this.get(id);
    const link = `${process.env.PUBLIC_TRACK_BASE_URL}/${rec.tenantId}/${rec.guideNumber}`;
    await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: rec.tenantId,
        recordId: id,
        action: 'NOTIFICATION_SENT',
        payload: { channels, link },
      },
    });
    await this.traz.emitBaseEvent('NOTIFICATION_SENT', {
      id,
      tenantId: rec.tenantId,
      channels,
      link,
    });
    await this.emit('notification.sent', rec);
    return { ok: true, link };
  }

  async duplicate(id: string, copyExtra = false) {
    const rec = await this.get(id);
    const guide = generateGuideNumber(rec.type, rec.tenantId);
    const dup = await this.prisma.$transaction(async (tx) => {
      const newRec = await tx.logisticRecord.create({
        data: {
          tenantId: rec.tenantId,
          type: rec.type,
          guideNumber: guide,
          originType: rec.originType,
          originId: rec.originId,
          senderContactId: rec.senderContactId,
          recipientContactId: rec.recipientContactId,
          carrierId: rec.carrierId,
          labels: rec.labels,
          extra: copyExtra ? (rec.extra as any) : {},
          state: 'CHECK_PENDING',
          summary: rec.summary as any,
        },
      });
      const its = await tx.logisticItem.findMany({
        where: { recordId: rec.id },
      });
      if (its.length) {
        await tx.logisticItem.createMany({
          data: its.map((i) => ({
            recordId: newRec.id,
            originItemId: i.originItemId,
            sku: i.sku,
            name: i.name,
            qtyExpected: i.qtyExpected,
          })),
        });
      }
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: rec.tenantId,
          recordId: newRec.id,
          action: 'DUPLICATED',
          payload: { from: rec.id },
        },
      });
      return newRec;
    });
    await this.traz.emitBaseEvent('DUPLICATED', {
      fromId: rec.id,
      id: dup.id,
      tenantId: rec.tenantId,
    });
    await this.emit('duplicated', dup);
    return dup;
  }

  async split(
    id: string,
    splits: { items: { id: string; qty: number }[]; labels?: string[] }[],
  ) {
    const rec = await this.get(id);
    const allItems = await this.prisma.logisticItem.findMany({
      where: { recordId: id },
    });
    const qtyById = new Map(allItems.map((i) => [i.id, i.qtyExpected]));
    for (const s of splits) {
      for (const it of s.items) {
        if (!qtyById.has(it.id))
          throw new BadRequestException(`Item ${it.id} not in record`);
        if (it.qty <= 0 || it.qty > (qtyById.get(it.id) || 0))
          throw new BadRequestException(`Invalid qty for ${it.id}`);
      }
    }
    const createdChildren = await this.prisma.$transaction(async (tx) => {
      const children: any[] = [];
      for (const s of splits) {
        const guide = generateGuideNumber(rec.type, rec.tenantId);
        const child = await tx.logisticRecord.create({
          data: {
            tenantId: rec.tenantId,
            type: rec.type,
            guideNumber: guide,
            originType: rec.originType,
            originId: rec.originId,
            senderContactId: rec.senderContactId,
            recipientContactId: rec.recipientContactId,
            carrierId: rec.carrierId,
            labels: s.labels ?? rec.labels,
            extra: {},
            state: 'CHECK_PENDING',
            parentRecordId: rec.id,
          },
        });
        await tx.logisticItem.createMany({
          data: s.items.map((it) => {
            const base = allItems.find((ai) => ai.id === it.id)!;
            return {
              recordId: child.id,
              originItemId: base.originItemId,
              sku: base.sku,
              name: base.name,
              qtyExpected: it.qty,
            };
          }),
        });
        children.push(child);
      }
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: rec.tenantId,
          recordId: rec.id,
          action: 'UPDATED',
          payload: { splitInto: children.map((c) => c.id) },
        },
      });
      return children;
    });
    await this.emit('updated', rec);
    return { ok: true, children: createdChildren };
  }
}
