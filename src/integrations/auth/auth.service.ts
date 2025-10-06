import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface AuthVerifyResponse {
  valid: boolean;
}

interface AuthValidateResponse {
  valid: boolean | string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly baseUrl = 'https://apis.gestoru.com';

  constructor(private readonly httpService: HttpService) {}

  async verifyToken(token: string): Promise<boolean> {
    try {
      // Check if AUTH_TOKEN is configured (for external auth service)
      if (
        !process.env.AUTH_TOKEN ||
        process.env.AUTH_TOKEN === 'your-gestoru-auth-token-here'
      ) {
        this.logger.warn(
          'AUTH_TOKEN not configured, using mock token verification for development',
        );
        return this.verifyTokenMock(token);
      }

      const url = `${this.baseUrl}/auth/v1/verify-token`;
      const response = await firstValueFrom(
        this.httpService.post<AuthVerifyResponse>(
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
      const message = error?.message || 'Unknown error';
      this.logger.warn(
        `External auth service failed, falling back to mock verification: ${message}`,
      );
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
    this.logger.log(
      `Mock token verification: ${isValidFormat} for token: ${token.substring(0, 20)}...`,
    );
    return isValidFormat;
  }

  /**
   * Validate user existence
   * @param userId User ID to validate
   * @param tenantId Tenant ID (optional for some validations)
   */
  async validateUser(userId: string, tenantId?: string): Promise<boolean> {
    try {
      // Check if AUTH_TOKEN is configured
      if (
        !process.env.AUTH_TOKEN ||
        process.env.AUTH_TOKEN === 'your-gestoru-auth-token-here'
      ) {
        this.logger.warn(
          'AUTH_TOKEN not configured, using mock user validation for development',
        );
        return this.validateUserMock(userId, tenantId);
      }

      const url = `${this.baseUrl}/auth/v1/validate-user/${userId}`;
      const response = await firstValueFrom(
        this.httpService.get<AuthValidateResponse>(url, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            ...(tenantId && { 'tenant-id': tenantId }),
          },
        }),
      );

      const validValue = response.data?.valid as any;
      const isValid = validValue === true || validValue === 'true';
      this.logger.log(`User ${userId} validation result: ${isValid}`);
      return isValid;
    } catch (error) {
      const message = error?.message || 'Unknown error';
      this.logger.warn(
        `External user validation failed, falling back to mock: ${message}`,
      );
      return this.validateUserMock(userId, tenantId);
    }
  }

  /**
   * Mock user validation for development/testing
   */
  private validateUserMock(userId: string, tenantId?: string): boolean {
    // Simple mock: accept any non-empty userId
    const isValid = !!(
      userId &&
      typeof userId === 'string' &&
      userId.length > 0
    );
    this.logger.log(
      `Mock user validation: ${isValid} for userId: ${userId}, tenantId: ${tenantId || 'none'}`,
    );
    return isValid;
  }
}
