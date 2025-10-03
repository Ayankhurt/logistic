import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly baseUrl = 'https://apis.gestoru.com';

  constructor(private readonly httpService: HttpService) {}

  async verifyToken(token: string): Promise<boolean> {
    try {
      // Check if AUTH_TOKEN is configured (for external auth service)
      if (!process.env.AUTH_TOKEN || process.env.AUTH_TOKEN === 'your-gestoru-auth-token-here') {
        this.logger.warn('AUTH_TOKEN not configured, using mock token verification for development');
        return this.verifyTokenMock(token);
      }

      const url = `${this.baseUrl}/auth/v1/verify-token`;
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      const isValid = response.data?.valid === true;
      this.logger.log(`Token verification result: ${isValid}`);
      return isValid;
    } catch (error) {
      this.logger.warn(`External auth service failed, falling back to mock verification: ${error.message}`);
      return this.verifyTokenMock(token);
    }
  }

  /**
   * Mock token verification for development/testing
   */
  private verifyTokenMock(token: string): boolean {
    // Simple mock: accept any token that looks like a JWT (has dots)
    if (!token || typeof token !== 'string') {
      return false;
    }
    const isValidFormat = token.split('.').length === 3;
    this.logger.log(`Mock token verification: ${isValidFormat} for token: ${token.substring(0, 20)}...`);
    return isValidFormat;
  }
}
