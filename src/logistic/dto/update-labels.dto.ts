import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLabelsDto {
  @ApiProperty({
    description: 'Labels',
    type: [String],
    example: ['urgent', 'fragile'],
  })
  @IsArray()
  @IsString({ each: true })
  labels: string[];

  @ApiProperty({ description: 'User ID performing the action' })
  @IsString()
  userId: string;
}
