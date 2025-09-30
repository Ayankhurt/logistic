import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContactsModule } from '../integrations/contacts/contacts.module';
import { CustomFieldsModule } from '../integrations/custom-fields/custom-fields.module';
import { SocketsModule } from '../sockets/sockets.module';
import { TrazabilityModule } from '../integrations/trazability/trazability.module';
import { StorageModule } from '../integrations/storage/storage.module';
import { LogisticService } from './logistic.service';
import { LogisticController } from './logistic.controller';

@Module({
  imports: [PrismaModule, ContactsModule, CustomFieldsModule, SocketsModule, TrazabilityModule, StorageModule],
  providers: [LogisticService],
  controllers: [LogisticController],
})
export class LogisticModule {}
