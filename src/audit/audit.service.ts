import { Injectable, Logger } from '@nestjs/common';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async getAuditLogsByRecord(recordId: string): Promise<AuditLogResponseDto[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      tenantId: log.tenantId,
      recordId: log.recordId,
      action: log.action,
      payload: log.payload as unknown,
      createdBy: log.createdBy ?? undefined,
      createdAt: log.createdAt,
    }));
  }

  async createAuditLog(
    tenantId: string,
    recordId: string,
    action: AuditAction,
    payload?: unknown,
    createdBy?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        tenantId,
        recordId,
        action,
        // @ts-expect-error allow unknown to JsonValue
        payload,
        createdBy,
      },
    });
  }
}
