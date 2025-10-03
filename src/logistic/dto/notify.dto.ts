import { IsArray, IsEnum, IsString } from 'class-validator';
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
}
