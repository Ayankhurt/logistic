import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LogisticState } from '../../common/state/logistic-state.enum';

export class QueryLogisticRecordsDto {
  @ApiPropertyOptional({ description: 'Tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Type', enum: ['TRACKING', 'PICKING'] })
  @IsOptional()
  @IsEnum(['TRACKING', 'PICKING'])
  type?: 'TRACKING' | 'PICKING';

  @ApiPropertyOptional({ description: 'State', enum: LogisticState })
  @IsOptional()
  @IsEnum(LogisticState)
  state?: LogisticState;

  @ApiPropertyOptional({ description: 'Messenger ID' })
  @IsOptional()
  @IsString()
  messengerId?: string;

  @ApiPropertyOptional({ description: 'Labels', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @ApiPropertyOptional({ description: 'Guide Number' })
  @IsOptional()
  @IsString()
  guideNumber?: string;
}
