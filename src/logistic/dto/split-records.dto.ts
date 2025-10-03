import {
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SplitItemDto {
  @ApiProperty({ description: 'Origin item ID to split' })
  @IsString()
  originItemId: string;

  @ApiProperty({ description: 'Quantity to split', minimum: 1 })
  @IsInt()
  @Min(1)
  qtyToSplit: number;
}

export class SplitLogisticRecordDto {
  @ApiProperty({ description: 'Items to split', type: [SplitItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitItemDto)
  items: SplitItemDto[];

  @ApiProperty({ description: 'User ID performing the action' })
  @IsString()
  userId: string;
}
