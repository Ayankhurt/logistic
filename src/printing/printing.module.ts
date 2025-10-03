import { Module } from '@nestjs/common';
import { PrintingService } from './printing.service';
import { PrintingController } from './printing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../integrations/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [PrintingService],
  controllers: [PrintingController],
  exports: [PrintingService],
})
export class PrintingModule {}
