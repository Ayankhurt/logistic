import { Controller, Post, Body } from '@nestjs/common';
import { TrazabilityService } from './trazability.service';

// Hide this controller from Swagger documentation
@Controller('trazability')
export class TrazabilityController {
  constructor(private readonly trazabilityService: TrazabilityService) {}

  @Post('create')
  create(@Body() payload: Record<string, unknown>) {
    return this.trazabilityService.createEvent(payload);
  }
}
