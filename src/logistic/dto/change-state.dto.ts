import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LogisticState } from '../../common/state/logistic-state.enum';

export class ChangeStateDto {
  @ApiProperty({
    description: 'New state',
    enum: LogisticState,
    example: LogisticState.READY,
  })
  @IsEnum(LogisticState)
  state: LogisticState;

  @ApiProperty({
    description: 'User ID performing the action',
  })
  userId: string;
}
