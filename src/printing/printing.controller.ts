import { Controller, Post, Param, Body } from '@nestjs/common';
import { PrintingService } from './printing.service';

@Controller('integrations/printing')
export class PrintingController {
  constructor(private readonly printingService: PrintingService) {}

  @Post('generate/:recordId')
  async generate(@Param('recordId') recordId: string, @Body() body?: { tenantId?: string }) {
    const fileUrl = await this.printingService.generatePDF(recordId, body?.tenantId);
    return { status: 'success', fileUrl };
  }
}
