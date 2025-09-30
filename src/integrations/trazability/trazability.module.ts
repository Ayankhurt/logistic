import { Module } from '@nestjs/common';
import { TrazabilityService } from './trazability.service';

@Module({
  providers: [TrazabilityService],
  exports: [TrazabilityService],
})
export class TrazabilityModule {}
