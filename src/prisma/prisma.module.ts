import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // global bana do, taake har module me import karne ki zarurat na pade
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
