import { Controller, Post, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PrintingService } from './printing.service';

@ApiTags('Printing')
@Controller('integrations/printing')
export class PrintingController {
  constructor(private readonly printingService: PrintingService) {}

  @Post('generate/:recordId')
  @ApiOperation({ summary: 'Generate PDF for a logistic record' })
  @ApiParam({ name: 'recordId', description: 'The ID of the logistic record' })
  @ApiBody({
    description: 'Optional tenant ID',
    schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string', description: 'Tenant ID' },
      },
      required: [],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
    schema: {
      type: 'object',
      properties: { status: { type: 'string' }, fileUrl: { type: 'string' } },
    },
  })
  async generate(
    @Param('recordId') recordId: string,
    @Body() body?: { tenantId?: string },
  ) {
    const fileUrl = await this.printingService.generatePDF(
      recordId,
      body?.tenantId,
    );
    return { status: 'success', fileUrl };
  }

  @Post('print-files')
  @ApiOperation({ summary: 'Generate PDF for selected files' })
  @ApiBody({
    description: 'File IDs to include in the PDF',
    schema: {
      type: 'object',
      properties: {
        fileIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file IDs to print',
        },
        tenantId: { type: 'string', description: 'Tenant ID' },
      },
      required: ['fileIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
    schema: {
      type: 'object',
      properties: { status: { type: 'string' }, fileUrl: { type: 'string' } },
    },
  })
  async printFiles(@Body() body: { fileIds: string[]; tenantId?: string }) {
    const fileUrl = await this.printingService.printSelectedFiles(
      body.fileIds,
      body.tenantId,
    );
    return { status: 'success', fileUrl };
  }
}
