import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { StorageModule } from '../integrations/storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [FilesService],
  controllers: [FilesController],
})
export class FilesModule {}
