import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { KafkaProducer } from '../../common/kafka/kafka.producer';

export interface CustomField {
  code: string;
  name: string;
  type: string;
}

export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
}

@Injectable()
export class CustomFieldsService {
  private readonly logger = new Logger(CustomFieldsService.name);
  private readonly baseUrl = 'https://apis.gestoru.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  /**
   * Fetch extra fields for a given tenant and record type
   */
  async getExtraFields(
    tenantId: string,
    recordType: 'TRACKING' | 'PICKING',
  ): Promise<CustomField[]> {
    try {
      const url = `${this.baseUrl}/custom-fields/v1/list`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'tenant-id': tenantId,
          },
          params: {
            recordType,
          },
        }),
      );

      const fields = response.data as CustomField[];
      this.logger.log(
        `Fetched ${fields.length} custom fields for tenant ${tenantId} and type ${recordType}`,
      );
      return fields;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching custom fields: ${message}`);
      throw new HttpException('Failed to fetch custom fields', 500);
    }
  }

  /**
   * Fetch Kanban columns for a given tenant
   */
  async getKanbanColumns(tenantId: string): Promise<KanbanColumn[]> {
    try {
      const url = `${this.baseUrl}/custom-fields/v1/kanban-columns`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'tenant-id': tenantId,
          },
        }),
      );

      const columns = response.data as KanbanColumn[];
      this.logger.log(
        `Fetched ${columns.length} kanban columns for tenant ${tenantId}`,
      );
      return columns;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching kanban columns: ${message}`);
      throw new HttpException('Failed to fetch kanban columns', 500);
    }
  }

  /**
   * Validate and parse custom fields
   */
  async validateExtraFields(
    fields: Record<string, unknown>,
    tenantId: string,
  ): Promise<boolean> {
    try {
      // For validation, we can call a validation endpoint or validate locally
      // For now, assume validation passes if fields are provided
      this.logger.log(`Validating extra fields for tenant ${tenantId}`);
      // TODO: Implement real validation logic, perhaps call /custom-fields/v1/validate
      return Object.keys(fields).length > 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error validating custom fields: ${message}`);
      return false;
    }
  }

  /**
   * Send Kafka message for label updates
   */
  async notifyLabelUpdate(tenantId: string, recordId: string, labels: any) {
    try {
      await this.kafkaProducer.send({
        topic: 'logistic.labels.updated',
        messages: [
          {
            key: recordId,
            value: JSON.stringify({
              tenantId,
              recordId,
              labels,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      this.logger.log(`Kafka message sent for label update: ${recordId}`);
    } catch (error) {
      this.logger.error(`Error sending Kafka message: ${error.message}`);
    }
  }
}
