import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { VerifyItemsDto } from '../logistic/dto/verify-items.dto';
import { AuditService } from '../audit/audit.service';
import { SocketsService } from '../sockets/sockets.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckService {
  private readonly logger = new Logger(CheckService.name);

  constructor(
    private prisma: PrismaService,
    private socketsGateway: SocketsService,
    private auditService: AuditService,
  ) {}

  async verifyItems(recordId: string, dto: VerifyItemsDto, userId?: string) {
    const record = await this.prisma.logisticRecord.findUnique({
      where: { id: recordId },
    });
    if (!record) throw new BadRequestException('Record not found');

    for (const itemDto of dto.items) {
      await this.prisma.logisticItem.update({
        where: { id: itemDto.id },
        data: {
          selected: itemDto.selected,
          qtyVerified: itemDto.qtyVerified ?? 0,
        },
      });
    }

    await this.auditService.createAuditLog(
      record.tenantId,
      recordId,
      'CHECK_VERIFIED',
      dto as unknown,
      userId,
    );

    // Emit socket event
    this.socketsGateway.emitToTenant(
      record.tenantId,
      'logistic.check.updated',
      {
        id: recordId,
        tenantId: record.tenantId,
        guideNumber: record.guideNumber,
        type: record.type,
        state: record.state,
        messengerId: record.messengerId || undefined,
        etiquetas: record.labels,
        resumen: record.summary,
        changedBy: userId || 'system',
        timestamp: new Date().toISOString(),
      },
    );

    return { success: true };
  }

  async finalizeCheck(recordId: string, userId: string) {
    const items = await this.prisma.logisticItem.findMany({
      where: { recordId, selected: true },
    });
    if (items.length === 0) throw new BadRequestException('No items verified');

    const record = await this.prisma.logisticRecord.update({
      where: { id: recordId },
      data: {
        checkFinalizedAt: new Date(),
        checkFinalizedBy: userId,
      },
    });

    await this.auditService.createAuditLog(
      record.tenantId,
      recordId,
      'CHECK_FINALIZED',
      {} as unknown,
      userId,
    );

    // Emit socket event
    this.socketsGateway.emitToTenant(
      record.tenantId,
      'logistic.check.finalized',
      {
        id: recordId,
        tenantId: record.tenantId,
        guideNumber: record.guideNumber,
        type: record.type,
        state: record.state,
        messengerId: record.messengerId || undefined,
        etiquetas: record.labels,
        resumen: record.summary,
        changedBy: userId || 'system',
        timestamp: new Date().toISOString(),
      },
    );

    return { success: true };
  }
}
