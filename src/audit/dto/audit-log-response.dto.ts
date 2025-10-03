import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ description: 'Audit log ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Record ID' })
  recordId: string;

  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiPropertyOptional({ description: 'Action payload' })
  payload?: unknown;

  @ApiPropertyOptional({ description: 'User who performed the action' })
  createdBy?: string;

  @ApiProperty({ description: 'When the action was performed' })
  createdAt: Date;
}
