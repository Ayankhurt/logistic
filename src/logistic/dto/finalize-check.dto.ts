import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FinalizeCheckDto {
  @ApiProperty({ description: 'User ID finalizing the check' })
  @IsString()
  userId: string;
}
