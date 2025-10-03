import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

// Controllers
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 📦 Feature modules
import { LogisticModule } from './logistic/logistic.module';
import { PrintingModule } from './printing/printing.module';
import { KanbanModule } from './kanban/kanban.module';
import { NotifyModule } from './notify/notify.module';
import { FilesModule } from './files/files.module';
import { SocketsModule } from './sockets/sockets.module';
import { AuditModule } from './audit/audit.module';
import { CheckModule } from './check/check.module';
import { ContactsModule } from './integrations/contacts/contacts.module';
import { StorageModule } from './integrations/storage/storage.module';
import { PublicModule } from './public/public.module';
import { MetricsModule } from './common/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    LogisticModule,
    PrintingModule,
    KanbanModule,
    NotifyModule,
    FilesModule,
    SocketsModule,
    AuditModule,
    CheckModule,
    ContactsModule,
    StorageModule,
    PublicModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
