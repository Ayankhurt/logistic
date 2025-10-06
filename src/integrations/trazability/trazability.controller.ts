import { Controller, Post, Body } from '@nestjs/common';
import { TrazabilityService } from './trazability.service';

interface CreateEventDto {
  action: string;
  entity: string;
  entityId: string;
  tenantId: string;
  userId: string;
  data: Record<string, unknown>;
}

// Hide this controller from Swagger documentation
@Controller('trazability')
export class TrazabilityController {
  constructor(private readonly trazabilityService: TrazabilityService) {}

  @Post('create')
  create(@Body() payload: CreateEventDto) {
    return this.trazabilityService.createEvent(payload);
  }
}
