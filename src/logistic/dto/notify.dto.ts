import { IsArray, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export class NotifyDto {
  @ApiProperty({
    description: 'Notification channels',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiProperty({
    description: 'Recipient contact information',
  })
  @IsString()
  recipient: string;

  @ApiProperty({
    description: 'Guide number for tracking',
  })
  @IsString()
  guideNumber: string;

  @ApiProperty({
    description: 'Tracking link',
  })
  @IsString()
  link: string;

  @ApiProperty({ description: 'Type of logistic record' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Sender contact ID' })
  @IsUUID()
  senderContactId: string;

  @ApiProperty({ description: 'Recipient contact ID' })
  @IsUUID()
  recipientContactId: string;

  @ApiProperty({ description: 'Carrier ID', required: false })
  @IsString()
  carrierId?: string;

  @ApiProperty({ description: 'Labels', type: [String], required: false })
  @IsArray()
  labels?: string[];

  @ApiProperty({ description: 'Items', type: [Object] })
  @IsArray()
  items: Array<{ name: string | null; qtyExpected: number }>;

  @ApiProperty({ description: 'Tenant ID' })
  @IsString()
  tenantId: string;
}
