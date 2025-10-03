import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTagsDto {
  @ApiProperty({
    description: 'Tags to assign to the record',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
