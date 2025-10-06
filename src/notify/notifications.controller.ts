import { Controller, Post, Body } from '@nestjs/common';
import { NotifyService } from './notify.service';
import { NotifyDto, NotificationChannel } from '../logistic/dto/notify.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifyService: NotifyService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send notification via SMS or WhatsApp' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(@Body() dto: NotifyDto) {
    // Use the first channel for simplicity
    const channel = dto.channels[0];
    if (channel === NotificationChannel.SMS) {
      await this.notifyService.sendTrackingNotification(
        dto.recipient,
        {
          guideNumber: dto.guideNumber,
          type: dto.type,
          senderContactId: dto.senderContactId,
          recipientContactId: dto.recipientContactId,
          carrierId: dto.carrierId,
          labels: dto.labels,
          items: dto.items,
          tenantId: dto.tenantId,
        },
        dto.link,
      );
    } else if (channel === NotificationChannel.WHATSAPP) {
      await this.notifyService.sendWhatsAppTracking(
        dto.recipient,
        {
          guideNumber: dto.guideNumber,
          type: dto.type,
          senderContactId: dto.senderContactId,
          recipientContactId: dto.recipientContactId,
          carrierId: dto.carrierId,
          labels: dto.labels,
          items: dto.items,
          tenantId: dto.tenantId,
        },
        dto.link,
      );
    }
    return { message: 'Notification sent' };
  }
}
