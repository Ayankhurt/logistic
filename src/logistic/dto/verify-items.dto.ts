import { IsString, IsBoolean, IsOptional, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyItemDto {
  @ApiProperty({ description: 'Item ID to verify' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Whether the item is selected/verified' })
  @IsBoolean()
  selected: boolean;

  @ApiPropertyOptional({ description: 'Verified quantity', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  qtyVerified?: number;
}

export class VerifyItemsDto {
  @ApiProperty({ description: 'Items to verify', type: [VerifyItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerifyItemDto)
  items: VerifyItemDto[];
}
