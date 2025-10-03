import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateKanbanTagsDto {
  @ApiProperty({ description: 'Record ID', type: String })
  recordId: string;

  @ApiProperty({ description: 'Labels/tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  labels: string[];
}
