import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLogisticItemDto {
  @ApiPropertyOptional({ description: 'Origin item ID' })
  @IsOptional()
  @IsString()
  originItemId?: string;

  @ApiPropertyOptional({ description: 'SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Name of the item' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Expected quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  qtyExpected: number;
}
