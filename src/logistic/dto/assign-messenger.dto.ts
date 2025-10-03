import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignMessengerDto {
  @ApiProperty({
    description: 'Messenger ID to assign',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  messengerId: string;
}
