import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducer implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService
      .get<string>('KAFKA_BROKERS')
      ?.split(',') || ['localhost:9092'];

    this.kafka = new Kafka({
      clientId: 'logistic-service',
      brokers,
    });

    this.producer = this.kafka.producer();
    this.connect();
  }

  private async connect() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
    }
  }

  async send(message: {
    topic: string;
    messages: Array<{ key?: string; value: string }>;
  }) {
    try {
      await this.producer.send(message);
      this.logger.log(`Message sent to topic: ${message.topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to Kafka: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka producer', error);
    }
  }
}
