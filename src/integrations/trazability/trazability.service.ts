import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TrazabilityService {
  private base = process.env.TRAZABILITY_BASE_URL!;
  async emitBaseEvent(eventType: string, payload: any) {
    try {
      await axios.post(`${this.base}/base-event/create`, { eventType, payload });
    } catch (e) {
      // log but don't block
      // eslint-disable-next-line no-console
      console.error('trazability error', e?.response?.data ?? e.message);
    }
  }
}