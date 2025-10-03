import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLogisticItemDto } from './create-logistic-item.dto';
import { LogisticType } from '@prisma/client';

export class CreateLogisticRecordDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'Type of logistic record',
    enum: ['TRACKING', 'PICKING'],
  })
  @IsIn(['TRACKING', 'PICKING'])
  type: LogisticType;

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

  @ApiPropertyOptional({ description: 'Labels', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @ApiPropertyOptional({ description: 'Extra fields data' })
  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Items', type: [CreateLogisticItemDto] })
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
