import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LogisticState } from '../../common/state/logistic-state.enum';

export class UpdateKanbanColumnDto {
  @ApiProperty({ description: 'Record ID' })
  @IsString()
  recordId: string;

  @ApiProperty({
    description: 'New state/column for the record',
    enum: LogisticState,
  })
  @IsEnum(LogisticState)
  newState: LogisticState;
}
