import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TrazabilityService } from './trazability.service';
import { TrazabilityController } from './trazability.controller';

@Module({
  imports: [HttpModule],
  controllers: [TrazabilityController],
  providers: [TrazabilityService],
  exports: [TrazabilityService],
})
export class TrazabilityModule {}
