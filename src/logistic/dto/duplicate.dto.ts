import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class DuplicateDto {
  @ApiPropertyOptional({
    description: 'Copy extra fields from original',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  copyExtraFields?: boolean = false;

  @ApiProperty({ description: 'User ID performing the action' })
  @IsString()
  userId: string;
}
