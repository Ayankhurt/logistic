import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MockAuthService {
  private readonly logger = new Logger(MockAuthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async verifyToken(token: string): Promise<boolean> {
    // For local development, always return true
    // In production, this should call the real auth service
    const isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';

    if (isDevelopment) {
      this.logger.log('Mock auth: Token verification bypassed in development');
      return true;
    }

    // In production, use the real auth service
    const authServiceUrl =
      this.configService.get<string>('AUTH_BASE_URL') ||
      'https://apis.gestoru.com';

    try {
      const response = await this.httpService
        .post(
          `${authServiceUrl}/auth/v1/verify-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .toPromise();

      return response?.data?.valid === true;
    } catch (error) {
      this.logger.error(`Mock auth: Error verifying token: ${error.message}`);
      return false;
    }
  }
}
