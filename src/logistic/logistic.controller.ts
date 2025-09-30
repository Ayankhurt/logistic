import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Delete } from '@nestjs/common';
import { LogisticService } from './logistic.service';
import { BearerAuthGuard } from '../common/auth/bearer.guard';

@UseGuards(BearerAuthGuard)
@Controller({ path: 'logistic/records', version: '1' })
export class LogisticController {
  constructor(private readonly service: LogisticService) {}

  @Post()
  async create(@Body() dto: any, @Query('type') type: 'TRACKING'|'PICKING' = 'TRACKING', @Query('originType') originType?: string, @Query('originId') originId?: string, ) {
    return this.service.create(dto, type, { originType, originId });
  }

  @Get()
  async list(@Query() q: any) {
    return this.service.list(q);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // HU-L-003 Verify items
  @Post(':id/check/verify')
  async verifyItems(@Param('id') id: string, @Body() dto: { items: { id: string; selected: boolean; qtyVerified?: number }[] }) {
    return this.service.verifyItems(id, dto.items);
  }

  // HU-L-004 Finalize check
  @Post(':id/check/finalize')
  async finalizeCheck(@Param('id') id: string) {
    return this.service.finalizeCheck(id);
  }

  // HU-L-005 Kanban move
  @Post(':id/state')
  async changeState(@Param('id') id: string, @Body() dto: { state: string }) {
    return this.service.changeState(id, dto.state);
  }

  // HU-L-006 Labels
  @Patch(':id/labels')
  async updateLabels(@Param('id') id: string, @Body() dto: { labels: string[] }) {
    return this.service.updateLabels(id, dto.labels);
  }

  // HU-L-007 Assign messenger
  @Post(':id/messenger/assign')
  async assignMessenger(@Param('id') id: string, @Body() dto: { messengerId: string }) {
    return this.service.assignMessenger(id, dto.messengerId);
  }

  // HU-L-008 Print
  @Post(':id/print')
  async print(@Param('id') id: string) {
    return this.service.printGuide(id);
  }

  // HU-L-009 Notify
  @Post(':id/notify')
  async notify(@Param('id') id: string, @Body() dto: { channels: ('EMAIL'|'SMS'|'WHATSAPP')[] }) {
    return this.service.notify(id, dto.channels);
  }

  // HU-L-011 Duplicate
  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @Body() dto: { copyExtra?: boolean }) {
    return this.service.duplicate(id, dto.copyExtra);
  }

  // HU-L-012 Split
  @Post(':id/split')
  async split(@Param('id') id: string, @Body() dto: { splits: { items: { id: string; qty: number }[]; labels?: string[] }[] }) {
    return this.service.split(id, dto.splits);
  }
}