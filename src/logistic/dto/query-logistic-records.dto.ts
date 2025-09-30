import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { LogisticType } from '../interfaces/logistic.interface';
import { LogisticState } from './change-state.dto';

export class QueryLogisticRecordsDto {
  @ApiPropertyOptional({ description: 'Tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ 
    description: 'Type of logistic record',
    enum: ['TRACKING', 'PICKING']
  })
  @IsOptional()
  @IsEnum(['TRACKING', 'PICKING'])
  type?: LogisticType;

  @ApiPropertyOptional({ 
    description: 'State of the logistic record',
    enum: LogisticState
  })
  @IsOptional()
  @IsEnum(LogisticState)
  state?: LogisticState;

  @ApiPropertyOptional({ description: 'Messenger ID' })
  @IsOptional()
  @IsString()
  messengerId?: string;

  @ApiPropertyOptional({ 
    description: 'Labels to filter by',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}
