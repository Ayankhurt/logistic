import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('track/:guideNumber')
  async trackPackage(@Param('guideNumber') guideNumber: string) {
    return this.publicService.trackPackage(guideNumber);
  }
}
