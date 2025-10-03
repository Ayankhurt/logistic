import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
  export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private twilioClient: Twilio | null = null;
    private fromNumber: string | null = null;
    private isTwilioConfigured = false;

    constructor(private configService: ConfigService) {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || null;

      if (accountSid && authToken && this.fromNumber &&
          accountSid !== 'your-twilio-account-sid' &&
          authToken !== 'your-twilio-auth-token' &&
          !this.fromNumber.includes('1234567890')) {
        try {
          this.twilioClient = new Twilio(accountSid, authToken);
          this.isTwilioConfigured = true;
          this.logger.log('✅ Twilio client initialized successfully');
        } catch (error) {
          this.logger.error('❌ Failed to initialize Twilio client:', error);
        }
      } else {
        this.logger.warn('⚠️ Twilio credentials not configured. SMS and WhatsApp features will be disabled.');
      }
    }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation - should start with + and contain only digits
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  async sendSms(to: string, body: string): Promise<void> {
    if (!this.isTwilioConfigured || !this.twilioClient) {
      this.logger.warn(`📱 SMS not sent to ${to}: Twilio not configured`);
      return;
    }

    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(to)) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      await this.twilioClient.messages.create({
        body,
        from: this.fromNumber!,
        to,
      });
      this.logger.log(`📩 SMS sent to ${to}`);
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };

      // Handle specific Twilio errors
      if (err.code === 21408) {
        this.logger.error(
          `❌ SMS permission not enabled for region: ${to}. Please enable SMS for this region in your Twilio console.`,
        );
        throw new Error(
          `SMS not enabled for region ${to}. Please check Twilio console settings.`,
        );
      } else if (err.code === 21211) {
        this.logger.error(`❌ Invalid 'To' phone number: ${to}`);
        throw new Error(`Invalid phone number: ${to}`);
      } else if (err.code === 21214) {
        this.logger.error(`❌ Invalid 'From' phone number: ${this.fromNumber}`);
        throw new Error(`Invalid Twilio phone number configuration`);
      }

      this.logger.error(
        `❌ Failed to send SMS to ${to}: ${err.message || 'Unknown error'}`,
      );
      throw error;
    }
  }

  async sendWhatsApp(to: string, body: string): Promise<void> {
    if (!this.isTwilioConfigured || !this.twilioClient) {
      this.logger.warn(`📱 WhatsApp message not sent to ${to}: Twilio not configured`);
      return;
    }

    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(to)) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      await this.twilioClient.messages.create({
        body,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${to}`,
      });
      this.logger.log(`📲 WhatsApp message sent to ${to}`);
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };

      // Handle specific Twilio errors
      if (err.code === 63007) {
        this.logger.error(
          `❌ WhatsApp channel not found for From address: ${this.fromNumber}. Please set up WhatsApp Sandbox in Twilio console.`,
        );
        throw new Error(
          `WhatsApp channel not configured. Please set up WhatsApp Sandbox in Twilio console.`,
        );
      } else if (err.code === 21211) {
        this.logger.error(`❌ Invalid 'To' phone number: ${to}`);
        throw new Error(`Invalid phone number: ${to}`);
      } else if (err.code === 21214) {
        this.logger.error(`❌ Invalid 'From' phone number: ${this.fromNumber}`);
        throw new Error(`Invalid Twilio phone number configuration`);
      }

      this.logger.error(
        `❌ Failed to send WhatsApp to ${to}: ${err.message || 'Unknown error'}`,
      );
      throw error;
    }
  }
}
