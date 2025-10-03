import {
  IsString,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CheckItemDto {
  @ApiProperty({ description: 'Item ID to verify' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Quantity verified' })
  @IsNumber()
  @Min(0)
  qtyVerified: number;

  @ApiProperty({ description: 'Whether the item is selected' })
  @IsBoolean()
  selected: boolean;
}

export class CheckItemsDto {
  @ApiProperty({ description: 'Items to verify', type: [CheckItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckItemDto)
  items: CheckItemDto[];

  @ApiProperty({ description: 'User ID performing the verification' })
  @IsString()
  userId: string;
}
