import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLabelsDto {
  @ApiProperty({ 
    description: 'Labels for categorization and filtering',
    type: [String],
    example: ['urgent', 'fragile', 'express']
  })
  @IsArray()
  @IsString({ each: true })
  labels: string[];
}
