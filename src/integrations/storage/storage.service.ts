import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseUrl = 'https://apis.gestoru.com';
  private readonly uuid = 'f5095a81-cd27-4159-9785-88bda66d5d0f';
  private readonly moduleId = 'rRa1j8pPlZS5T8G7ADXD5sf7mBlQpnyY';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Upload a single file
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);
      formData.append('uuid', this.uuid);
      formData.append('module_id', this.moduleId);

      const url = `${this.baseUrl}/files/create`;
      const response = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            ...(
              formData as { getHeaders: () => Record<string, string> }
            ).getHeaders(),
          },
        }),
      );

      const data = response.data as { url: string };
      this.logger.log(`File uploaded: ${fileName}`);
      return { url: data.url };
    } catch (error) {
      this.logger.error(
        `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new HttpException('Failed to upload file', 500);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; fileName: string }>,
  ): Promise<Array<{ url: string }>> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file.buffer, file.fileName);
      });
      formData.append('uuid', this.uuid);
      formData.append('module_id', this.moduleId);

      const url = `${this.baseUrl}/files/create/multiple`;
      const response = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            ...(
              formData as { getHeaders: () => Record<string, string> }
            ).getHeaders(),
          },
        }),
      );

      const data = response.data as { urls: string[] };
      this.logger.log(`Uploaded ${files.length} files`);
      return data.urls.map((url: string) => ({ url }));
    } catch (error) {
      this.logger.error(
        `Error uploading multiple files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new HttpException('Failed to upload files', 500);
    }
  }

  /**
   * Get list of files
   */
  async getFiles(tenantId?: string): Promise<Array<{ id: string; name: string; url: string; size?: number; createdAt?: string }>> {
    try {
      const url = `${this.baseUrl}/files/list`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'tenant-id': tenantId || '',
          },
        }),
      );

      const files = response.data as Array<{ id: string; name: string; url: string; size?: number; createdAt?: string }>;
      this.logger.log(`Fetched ${files.length} files`);
      return files;
    } catch (error) {
      this.logger.error(
        `Error fetching files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new HttpException('Failed to fetch files', 500);
    }
  }

  /**
   * Get single file by ID
   */
  async getFile(id: string, tenantId?: string): Promise<{ id: string; name: string; url: string; size?: number; createdAt?: string }> {
    try {
      const url = `${this.baseUrl}/files/${id}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'tenant-id': tenantId || '',
          },
        }),
      );

      const file = response.data as { id: string; name: string; url: string; size?: number; createdAt?: string };
      this.logger.log(`Fetched file: ${file.name}`);
      return file;
    } catch (error) {
      this.logger.error(
        `Error fetching file ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new HttpException('Failed to fetch file', 500);
    }
  }
}
