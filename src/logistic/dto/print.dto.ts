import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PrintFormat {
  PDF = 'PDF',
  PNG = 'PNG',
  JPG = 'JPG',
}

export class PrintDto {
  @ApiProperty({
    description: 'Print format',
    enum: PrintFormat,
  })
  @IsEnum(PrintFormat)
  format: PrintFormat;

  @ApiProperty({
    description: 'User ID performing the print',
  })
  @IsString()
  userId: string;
}
