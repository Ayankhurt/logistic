import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../integrations/storage/storage.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly storageService: StorageService) {}

  async uploadFile(file: Express.Multer.File, tenantId?: string) {
    if (!file) {
      throw new Error('File is missing');
    }

    try {
      // Upload file to storage service
      const result = await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
      );

      this.logger.log(`File uploaded successfully: ${file.originalname}`);

      return {
        success: true,
        message: 'File uploaded successfully',
        filename: file.originalname,
        url: result.url,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async getFiles(tenantId?: string) {
    try {
      // Get files from storage service
      const files = await this.storageService.getFiles(tenantId);

      return {
        success: true,
        data: files,
      };
    } catch (error) {
      this.logger.error(`Error fetching files: ${error.message}`);
      throw new Error(`Failed to fetch files: ${error.message}`);
    }
  }

  async getFile(id: string) {
    try {
      // Get file metadata from storage service
      const file = await this.storageService.getFile(id);

      return {
        success: true,
        data: file,
      };
    } catch (error) {
      this.logger.error(`Error fetching file: ${error.message}`);
      throw new Error(`Failed to fetch file: ${error.message}`);
    }
  }
}
