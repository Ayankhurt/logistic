// src/logistic/logistic.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { LogisticService } from './logistic.service';
import { LogisticController } from './logistic.controller';
import { SocketsModule } from '../sockets/sockets.module';
import { ContactsModule } from '../integrations/contacts/contacts.module';
import { TrazabilityModule } from '../integrations/trazability/trazability.module';
import { NotifyModule } from '../notify/notify.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrintingModule } from '../printing/printing.module';

@Module({
  imports: [
    // HttpModule is now global in AppModule - no need to import here
    forwardRef(() => SocketsModule), // For socket events
    ContactsModule,
    TrazabilityModule,
    NotifyModule,
    PrismaModule,
    PrintingModule,
  ],
  controllers: [LogisticController],
  providers: [LogisticService],
  exports: [LogisticService],
})
export class LogisticModule {}
