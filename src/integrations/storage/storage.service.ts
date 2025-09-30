import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class StorageService {
  base = process.env.STORAGE_BASE_URL!;
  async uploadPdf(tenantId: string, fileName: string, buffer: Buffer) {
    const { data } = await axios.post(`${this.base}/files/create`, buffer, {
      headers: { 'Content-Type': 'application/pdf', 'x-tenant-id': tenantId },
      params: { fileName },
      maxBodyLength: Infinity,
    });
    return data.fileUri as string;
  }
}