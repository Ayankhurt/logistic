import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('api/v1/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('records/:recordId')
  async getAuditLogsByRecord(@Param('recordId') recordId: string) {
    const logs = await this.auditService.getAuditLogsByRecord(recordId);
    return { success: true, data: logs };
  }
}
