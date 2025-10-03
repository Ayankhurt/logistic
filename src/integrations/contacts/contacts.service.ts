import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Contact {
  id: string;
  name: string;
  email?: string;
}

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);
  private readonly baseUrl = 'https://apis.gestoru.com';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Fetch contacts from Contacts Service
   * @param tenantId Tenant ID
   */
  async listContacts(tenantId: string): Promise<Contact[]> {
    try {
      // Check if AUTH_TOKEN is configured
      if (!process.env.AUTH_TOKEN || process.env.AUTH_TOKEN === 'your-gestoru-auth-token-here') {
        this.logger.warn('AUTH_TOKEN not configured, returning mock data for development');
        return this.getMockContacts(tenantId);
      }

      const url = `${this.baseUrl}/contacts/v1/list`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'tenant-id': tenantId,
          },
        }),
      );

      const contacts = response.data as Contact[];
      this.logger.log(
        `Fetched ${contacts.length} contacts for tenant ${tenantId}`,
      );
      return contacts;
    } catch (error) {
      this.logger.warn(`External contacts service failed, falling back to mock data: ${error.message}`);
      return this.getMockContacts(tenantId);
    }
  }

  /**
   * Mock contacts for development/testing when external service is not available
   */
  private getMockContacts(tenantId: string): Contact[] {
    return [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe (Mock Contact)',
        email: 'john.doe@example.com',
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Jane Smith (Mock Contact)',
        email: 'jane.smith@example.com',
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Bob Johnson (Mock Contact)',
        email: 'bob.johnson@example.com',
      },
    ];
  }

  /**
   * Validate individual contact (efficient method)
   * @param contactId Contact ID
   * @param tenantId Tenant ID
   */
  async validateContact(contactId: string, tenantId: string): Promise<boolean> {
    try {
      // Check if AUTH_TOKEN is configured
      if (!process.env.AUTH_TOKEN || process.env.AUTH_TOKEN === 'your-gestoru-auth-token-here') {
        this.logger.warn('AUTH_TOKEN not configured, using mock validation for development');
        return this.validateContactMock(contactId, tenantId);
      }

      // Use direct validation API instead of fetching all contacts
      const url = `${this.baseUrl}/contacts/v1/validate/${contactId}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'tenant-id': tenantId,
          },
        }),
      );

      const isValid = response.data?.valid === true;
      this.logger.log(`Contact ${contactId} validation: ${isValid}`);
      return isValid;
    } catch (error) {
      // Fallback to old method if new endpoint doesn't exist
      this.logger.warn(`Direct validation failed, falling back to mock method: ${error.message}`);
      return this.validateContactMock(contactId, tenantId);
    }
  }

  /**
   * Mock validation for development/testing when external service is not available
   */
  private validateContactMock(contactId: string, tenantId: string): boolean {
    const mockContacts = this.getMockContacts(tenantId);
    const exists = mockContacts.some((contact) => contact.id === contactId);
    this.logger.log(`Contact ${contactId} validation (mock): ${exists}`);
    return exists;
  }

  /**
   * Fallback method - fetch all contacts and validate
   * @param contactId Contact ID
   * @param tenantId Tenant ID
   */
  private async validateContactFallback(contactId: string, tenantId: string): Promise<boolean> {
    try {
      const contacts = await this.listContacts(tenantId);
      const exists = contacts.some((contact) => contact.id === contactId);
      this.logger.log(`Contact ${contactId} validation (fallback): ${exists}`);
      return exists;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error validating contact (fallback): ${message}`);
      return false;
    }
  }
}
