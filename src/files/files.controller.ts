import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadFile(file);
  }

  @Get()
  getFiles() {
    return this.filesService.getFiles();
  }

  @Get(':id')
  getFile(@Param('id') id: string) {
    return this.filesService.getFile(id);
  }
}
