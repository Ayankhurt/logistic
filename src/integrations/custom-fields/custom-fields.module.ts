import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CustomFieldsService } from './custom-fields.service';
import { KafkaProducer } from '../../common/kafka/kafka.producer';

@Module({
  imports: [HttpModule],
  providers: [CustomFieldsService, KafkaProducer],
  exports: [CustomFieldsService],
})
export class CustomFieldsModule {}
