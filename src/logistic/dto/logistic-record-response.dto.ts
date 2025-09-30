import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LogisticType, LogisticState } from '../interfaces/logistic.interface';

export class LogisticItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiProperty({ description: 'Record ID' })
  recordId: string;

  @ApiPropertyOptional({ description: 'Origin item ID' })
  originItemId?: string;

  @ApiPropertyOptional({ description: 'SKU' })
  sku?: string;

  @ApiPropertyOptional({ description: 'Item name' })
  name?: string;

  @ApiProperty({ description: 'Expected quantity' })
  qtyExpected: number;

  @ApiProperty({ description: 'Verified quantity' })
  qtyVerified: number;

  @ApiProperty({ description: 'Whether item is selected' })
  selected: boolean;
}

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
  payload?: Record<string, any>;

  @ApiPropertyOptional({ description: 'User who performed the action' })
  createdBy?: string;

  @ApiProperty({ description: 'When the action was performed' })
  createdAt: Date;
}

export class LogisticRecordResponseDto {
  @ApiProperty({ description: 'Record ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Type of record', enum: ['TRACKING', 'PICKING'] })
  type: LogisticType;

  @ApiProperty({ description: 'Unique guide number' })
  guideNumber: string;

  @ApiPropertyOptional({ description: 'Origin document type' })
  originType?: string;

  @ApiPropertyOptional({ description: 'Origin document ID' })
  originId?: string;

  @ApiProperty({ description: 'Sender contact ID' })
  senderContactId: string;

  @ApiProperty({ description: 'Recipient contact ID' })
  recipientContactId: string;

  @ApiPropertyOptional({ description: 'Carrier ID' })
  carrierId?: string;

  @ApiPropertyOptional({ description: 'Assigned messenger ID' })
  messengerId?: string;

  @ApiProperty({ description: 'Current state', enum: ['DRAFT', 'CHECK_PENDING', 'CHECK_IN_PROGRESS', 'CHECK_FINALIZED', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] })
  state: LogisticState;

  @ApiProperty({ description: 'Labels', type: [String] })
  labels: string;

  @ApiPropertyOptional({ description: 'Extra fields data' })
  extra?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Summary data' })
  summary?: Record<string, any>;

  @ApiPropertyOptional({ description: 'File URI for printed guide' })
  fileUri?: string;

  @ApiPropertyOptional({ description: 'Parent record ID' })
  parentRecordId?: string;

  @ApiPropertyOptional({ description: 'Child records', type: [LogisticRecordResponseDto] })
  children?: LogisticRecordResponseDto[];

  @ApiProperty({ description: 'Items in this record', type: [LogisticItemResponseDto] })
  items: LogisticItemResponseDto[];

  @ApiProperty({ description: 'Audit logs', type: [AuditLogResponseDto] })
  audit: AuditLogResponseDto[];

  @ApiPropertyOptional({ description: 'User who created the record' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'User who last updated the record' })
  updatedBy?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Check start timestamp' })
  checkStartedAt?: Date;

  @ApiPropertyOptional({ description: 'Check finalization timestamp' })
  checkFinalizedAt?: Date;

  @ApiPropertyOptional({ description: 'User who finalized the check' })
  checkFinalizedBy?: string;
}
