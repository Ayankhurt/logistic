import { Controller, Post, Body } from '@nestjs/common';
import { NotifyService } from './notify.service';

@Controller('api/v1/test-notify')
export class TestNotifyController {
  constructor(private readonly notifyService: NotifyService) {}

  @Post('sms')
  async testSms(
    @Body() body: { to: string; guideNumber: string; link: string },
  ) {
    await this.notifyService.sendTrackingNotification(
      body.to,
      body.guideNumber,
      body.link,
    );
    return { message: 'SMS test sent' };
  }

  @Post('whatsapp')
  async testWhatsApp(
    @Body() body: { to: string; guideNumber: string; link: string },
  ) {
    await this.notifyService.sendWhatsAppTracking(
      body.to,
      body.guideNumber,
      body.link,
    );
    return { message: 'WhatsApp test sent' };
  }
}
