import { Controller, Post, Param, Body, Patch } from '@nestjs/common';
import { CheckService } from './check.service';
import { VerifyItemsDto } from '../logistic/dto/verify-items.dto';

@Controller('check')
export class CheckController {
  constructor(private readonly checkService: CheckService) {}

  @Patch('verify/:recordId')
  async verifyItems(
    @Param('recordId') recordId: string,
    @Body() dto: VerifyItemsDto,
  ) {
    return this.checkService.verifyItems(recordId, dto);
  }

  @Post('finalize/:recordId')
  async finalizeCheck(
    @Param('recordId') recordId: string,
    @Body('userId') userId: string,
  ) {
    return this.checkService.finalizeCheck(recordId, userId);
  }
}
