import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotifyService } from './notify.service';
import { NotificationsController } from './notifications.controller';
import { ContactsModule } from '../integrations/contacts/contacts.module';

@Module({
  imports: [ConfigModule, ContactsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
