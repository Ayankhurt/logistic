import { Injectable, Logger, HttpException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(private readonly notifications: NotificationsService) {}

  async sendTrackingNotification(
    to: string,
    guideNumber: string,
    link: string,
  ) {
    const message = `Your tracking ${guideNumber} is ready. Track it here: ${link}`;
    try {
      await this.notifications.sendSms(to, message);
      this.logger.log(`Tracking SMS sent to ${to}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error sending tracking notification: ${err.message}`);
      throw new HttpException('Failed to send SMS notification', 500);
    }
  }

  async sendWhatsAppTracking(to: string, guideNumber: string, link: string) {
    const message = `📦 Tracking ${guideNumber}: Follow your package 👉 ${link}`;
    try {
      await this.notifications.sendWhatsApp(to, message);
      this.logger.log(`Tracking WhatsApp sent to ${to}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error sending WhatsApp tracking: ${err.message}`);
      throw new HttpException('Failed to send WhatsApp notification', 500);
    }
  }
}
