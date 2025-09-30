import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DuplicateDto {
  @ApiPropertyOptional({ 
    description: 'Whether to copy extra fields from the original record',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  copyExtra?: boolean = false;
}
