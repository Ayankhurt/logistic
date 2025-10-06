import { Module, forwardRef } from '@nestjs/common';
import { LogisticService } from './logistic.service';
import { LogisticController } from './logistic.controller';
import { SocketsModule } from '../sockets/sockets.module';
import { ContactsModule } from '../integrations/contacts/contacts.module';
import { TrazabilityModule } from '../integrations/trazability/trazability.module';
import { NotifyModule } from '../notify/notify.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrintingModule } from '../printing/printing.module';
import { CustomFieldsModule } from '../integrations/custom-fields/custom-fields.module';
import { AuthModule } from '../integrations/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => SocketsModule),
    ContactsModule,
    TrazabilityModule,
    NotifyModule,
    PrismaModule,
    PrintingModule,
    CustomFieldsModule,
    AuthModule,
  ],
  controllers: [LogisticController],
  providers: [LogisticService],
  exports: [LogisticService],
})
export class LogisticModule { }
