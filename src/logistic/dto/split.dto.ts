import { IsArray, IsString, IsInt, Min, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SplitItemDto {
  @ApiProperty({ description: 'Item ID to split' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Quantity for this split', minimum: 1 })
  @IsInt()
  @Min(1)
  qty: number;
}

export class SplitDto {
  @ApiProperty({ description: 'Items and quantities for this split', type: [SplitItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitItemDto)
  items: SplitItemDto[];

  @ApiPropertyOptional({ description: 'Labels for this split', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}

export class SplitRecordsDto {
  @ApiProperty({ description: 'Splits to create', type: [SplitDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitDto)
  splits: SplitDto[];
}
