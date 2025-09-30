import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LogisticState {
  DRAFT = 'DRAFT',
  CHECK_PENDING = 'CHECK_PENDING',
  CHECK_IN_PROGRESS = 'CHECK_IN_PROGRESS',
  CHECK_FINALIZED = 'CHECK_FINALIZED',
  READY = 'READY',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class ChangeStateDto {
  @ApiProperty({ 
    description: 'New state for the logistic record',
    enum: LogisticState,
    example: LogisticState.READY
  })
  @IsEnum(LogisticState)
  state: LogisticState;
}
