import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StorageService } from './storage.service';

@Module({
  imports: [HttpModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
