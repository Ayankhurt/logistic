// src/sockets/sockets.module.ts
import { Module } from '@nestjs/common';
import { SocketsService } from './sockets.gateway';

@Module({
  providers: [SocketsService],
  exports: [SocketsService],
})
export class SocketsModule {}
