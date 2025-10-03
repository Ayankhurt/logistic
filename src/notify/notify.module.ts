import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotifyService } from './notify.service';
import { TestNotifyController } from './test-notify.controller';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [ConfigModule],
  controllers: [TestNotifyController, NotificationsController],
  providers: [NotificationsService, NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
