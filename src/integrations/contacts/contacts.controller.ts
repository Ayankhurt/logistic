import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContactsService, Contact } from './contacts.service';

// Hide this controller from Swagger documentation
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async listContacts(@Query('tenantId') tenantId: string) {
    return await this.contactsService.listContacts(tenantId);
  }

  @Get('validate/:id')
  async validateContact(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    const valid = await this.contactsService.validateContact(id, tenantId);
    return { valid };
  }
}
