import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CustomFieldsService {
  base = process.env.CUSTOM_FIELDS_BASE_URL!;
  async validateLabels(tenantId: string, labels: string[]) {
    if (!labels?.length) return labels;
    const { data } = await axios.get(`${this.base}/labels`, { params: { tenantId }});
    const allowed = new Set((data?.labels ?? []) as string[]);
    const invalid = labels.filter(l => !allowed.has(l));
    if (invalid.length) throw new BadRequestException(`Invalid labels: ${invalid.join(', ')}`);
    return labels;
  }
}