import { Module } from '@nestjs/common';
import { CheckController } from './check.controller';
import { CheckService } from './check.service';
import { SocketsModule } from '../sockets/sockets.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SocketsModule, AuditModule],
  controllers: [CheckController],
  providers: [CheckService, PrismaService],
})
export class CheckModule {}
