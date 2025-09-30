import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ContactsService {
  private base = process.env.CONTACTS_BASE_URL!;
  async validateContacts(tenantId: string, ids: string[]) {
    const url = `${this.base}/contacts/v1/list`;
    const { data } = await axios.post(url, { tenantId, ids });
    const found = new Set((data?.items ?? []).map((c: any) => c.id));
    const missing = ids.filter(id => !found.has(id));
    if (missing.length) throw new BadRequestException(`Invalid contact(s): ${missing.join(', ')}`);
    return data.items;
  }
}