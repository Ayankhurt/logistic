import { IsString, IsArray, IsOptional, IsObject, IsUUID, IsInt, Min, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLogisticItemDto {
  @ApiPropertyOptional({ description: 'Origin item ID from source document' })
  @IsOptional()
  @IsString()
  originItemId?: string;

  @ApiPropertyOptional({ description: 'SKU of the item' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Name of the item' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Expected quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  qtyExpected: number;
}

export class CreateLogisticRecordDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: 'Sender contact ID' })
  @IsUUID()
  senderContactId: string;

  @ApiProperty({ description: 'Recipient contact ID' })
  @IsUUID()
  recipientContactId: string;

  @ApiPropertyOptional({ description: 'Carrier ID' })
  @IsOptional()
  @IsString()
  carrierId?: string;

  @ApiPropertyOptional({ description: 'Labels for categorization', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @ApiPropertyOptional({ description: 'Extra fields data' })
  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Items in this record', type: [CreateLogisticItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLogisticItemDto)
  items?: CreateLogisticItemDto[];

  @ApiPropertyOptional({ description: 'User ID who created the record' })
  @IsOptional()
  @IsString()
  userId?: string;
}
