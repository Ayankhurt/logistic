import { Injectable, Logger, HttpException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ContactsService } from '../integrations/contacts/contacts.service';

export interface NotificationRecordData {
  guideNumber: string;
  type: string;
  senderContactId: string;
  recipientContactId: string;
  carrierId?: string;
  labels?: string[];
  items: Array<{ name: string | null; qtyExpected: number }>;
  tenantId: string;
}

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly contactsService: ContactsService,
  ) {}

  async sendTrackingNotification(
    to: string,
    recordData: NotificationRecordData,
    link: string,
  ) {
    const message = await this.generateNotificationMessage(recordData, link);
    try {
      await this.notifications.sendSms(to, message);
      this.logger.log(
        `Tracking SMS sent to ${to} for ${recordData.guideNumber}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error sending tracking notification: ${err.message}`);
      throw new HttpException('Failed to send SMS notification', 500);
    }
  }

  async sendWhatsAppTracking(
    to: string,
    recordData: NotificationRecordData,
    link: string,
  ) {
    const message = await this.generateWhatsAppMessage(recordData, link);
    try {
      await this.notifications.sendWhatsApp(to, message);
      this.logger.log(
        `Tracking WhatsApp sent to ${to} for ${recordData.guideNumber}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error sending WhatsApp tracking: ${err.message}`);
      throw new HttpException('Failed to send WhatsApp notification', 500);
    }
  }

  private async generateNotificationMessage(
    recordData: NotificationRecordData,
    link: string,
  ): Promise<string> {
    // Fetch sender and recipient names
    const [senderContacts, recipientContacts] = await Promise.all([
      this.contactsService.listContacts(recordData.tenantId),
      this.contactsService.listContacts(recordData.tenantId),
    ]);

    const sender = senderContacts.find(
      (c) => c.id === recordData.senderContactId,
    );
    const recipient = recipientContacts.find(
      (c) => c.id === recordData.recipientContactId,
    );

    const senderName = sender?.name || 'Unknown Sender';
    const recipientName = recipient?.name || 'Unknown Recipient';

    // Calculate items summary
    const validItems = recordData.items.filter((item) => item.name !== null);
    const totalItems = validItems.length;
    const totalQty = validItems.reduce(
      (sum, item) => sum + item.qtyExpected,
      0,
    );
    const itemsSummary =
      totalItems > 0 ? `${totalItems} item(s), qty: ${totalQty}` : 'No items';

    // Build message
    let message = `Tracking ${recordData.guideNumber} (${recordData.type})\n`;
    message += `From: ${senderName}\n`;
    message += `To: ${recipientName}\n`;
    message += `Items: ${itemsSummary}\n`;
    if (recordData.carrierId) message += `Carrier: ${recordData.carrierId}\n`;
    if (recordData.labels && recordData.labels.length > 0) {
      message += `Labels: ${recordData.labels.join(', ')}\n`;
    }
    message += `Track: ${link}`;

    return message;
  }

  private async generateWhatsAppMessage(
    recordData: NotificationRecordData,
    link: string,
  ): Promise<string> {
    // Fetch sender and recipient names
    const [senderContacts, recipientContacts] = await Promise.all([
      this.contactsService.listContacts(recordData.tenantId),
      this.contactsService.listContacts(recordData.tenantId),
    ]);

    const sender = senderContacts.find(
      (c) => c.id === recordData.senderContactId,
    );
    const recipient = recipientContacts.find(
      (c) => c.id === recordData.recipientContactId,
    );

    const senderName = sender?.name || 'Unknown Sender';
    const recipientName = recipient?.name || 'Unknown Recipient';

    // Calculate items summary
    const validItems = recordData.items.filter((item) => item.name !== null);
    const totalItems = validItems.length;
    const totalQty = validItems.reduce(
      (sum, item) => sum + item.qtyExpected,
      0,
    );

    // Build WhatsApp message with emojis
    let message = `📦 *Tracking ${recordData.guideNumber}* (${recordData.type})\n\n`;
    message += `👤 *Sender:* ${senderName}\n`;
    message += `📍 *Recipient:* ${recipientName}\n`;
    message += `📋 *Items:* ${totalItems} item(s), Total Qty: ${totalQty}\n`;
    if (recordData.carrierId)
      message += `🚚 *Carrier:* ${recordData.carrierId}\n`;
    if (recordData.labels && recordData.labels.length > 0) {
      message += `🏷️ *Labels:* ${recordData.labels.join(', ')}\n`;
    }
    message += `\n🔗 *Track your package:* ${link}`;

    return message;
  }
}
