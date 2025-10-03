import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TrazabilityService {
  private readonly logger = new Logger(TrazabilityService.name);
  private readonly baseUrl = 'https://apis.gestoru.com';

  constructor(private readonly httpService: HttpService) {}

  async createEvent(payload: Record<string, unknown>): Promise<{
    status: string;
    payload: Record<string, unknown>;
  }> {
    try {
      // Check if AUTH_TOKEN is configured
      if (!process.env.AUTH_TOKEN || process.env.AUTH_TOKEN === 'your-gestoru-auth-token-here') {
        this.logger.warn('AUTH_TOKEN not configured, using mock trazability for development');
        return this.createMockEvent(payload);
      }

      const url = `${this.baseUrl}/base-event/create`;
      const response = await firstValueFrom(
        this.httpService.post<Record<string, unknown>>(url, payload, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Trazability event created: ${JSON.stringify(payload)}`);
      return { status: 'success', payload: response.data };
    } catch (error) {
      this.logger.warn(`External trazability service failed, falling back to mock: ${error.message}`);
      return this.createMockEvent(payload);
    }
  }

  /**
   * Create mock trazability event for development/testing
   */
  private createMockEvent(payload: Record<string, unknown>): {
    status: string;
    payload: Record<string, unknown>;
  } {
    this.logger.log(`Mock trazability event created: ${JSON.stringify(payload)}`);

    // Return a mock successful response
    return {
      status: 'success',
      payload: {
        ...payload,
        mockEventId: `mock-event-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'CREATED'
      }
    };
  }
}
