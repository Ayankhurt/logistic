import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LogisticService } from './logistic.service';
import { LogisticRecord } from './interfaces/logistic.interface';
import { CreateLogisticRecordDto } from './dto/create-logistic-record.dto';
import { UpdateLogisticRecordDto } from './dto/update-logistic-record.dto';
import { ChangeStateDto } from './dto/change-state.dto';
import { QueryLogisticRecordsDto } from './dto/query-logistic-records.dto';
import { AssignMessengerDto } from './dto/assign-messenger.dto';
import { CheckItemsDto } from './dto/check-items.dto';
import { FinalizeCheckDto } from './dto/finalize-check.dto';
import { DuplicateDto } from './dto/duplicate.dto';
import { SplitLogisticRecordDto } from './dto/split-records.dto';
import { UpdateLabelsDto } from './dto/update-labels.dto';
import { DemoDto } from './dto/demo.dto';
import { PrintDto } from './dto/print.dto';
import { NotifyDto } from './dto/notify.dto';
import { AssignTagsDto } from './dto/assign-tags.dto';
import { CreateLogisticItemDto } from './dto/create-logistic-item.dto';

@ApiTags('Logistic Records')
@Controller('records')
export class LogisticController {
  constructor(private readonly logisticService: LogisticService) {}

  @Get()
  async list(
    @Query() query: QueryLogisticRecordsDto,
  ): Promise<{ success: boolean; data: LogisticRecord[] }> {
    const records = await this.logisticService.listRecords(query);
    return { success: true, data: records };
  }

  @Post()
  async create(@Body() dto: CreateLogisticRecordDto): Promise<{ success: boolean; data: LogisticRecord }> {
    const record = await this.logisticService.createRecord(dto);
    return { success: true, data: record };
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ): Promise<{ success: boolean; data: LogisticRecord }> {
    const record = await this.logisticService.getRecord(id, tenantId);
    return { success: true, data: record };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLogisticRecordDto,
  ): Promise<{ success: boolean; data: LogisticRecord }> {
    const record = await this.logisticService.updateRecord(id, dto);
    return { success: true, data: record };
  }

  @Patch(':id/state')
  async changeState(
    @Param('id') id: string,
    @Body() dto: ChangeStateDto,
  ): Promise<{ success: boolean; data: LogisticRecord }> {
    const record = await this.logisticService.changeState(id, dto);
    return { success: true, data: record };
  }

  @Post(':id/assign')
  async assignMessenger(
    @Param('id') id: string,
    @Body() dto: AssignMessengerDto & { userId: string },
  ): Promise<{ success: boolean; data: LogisticRecord }> {
    const record = await this.logisticService.assignMessenger(
      id,
      dto.messengerId,
      dto.userId,
    );
    return { success: true, data: record };
  }

  @Get(':id/assignment')
  async getAssignment(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: any }> {
    const assignment = await this.logisticService.getAssignment(id);
    return { success: true, data: assignment };
  }

  @Post(':id/events')
  async addEvent(
    @Param('id') id: string,
    @Body() eventDto: any,
  ): Promise<{ success: boolean; data: any }> {
    const event = await this.logisticService.addEvent(id, eventDto);
    return { success: true, data: event };
  }

  @Get(':id/events')
  async listEvents(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: any[] }> {
    const events = await this.logisticService.listEvents(id);
    return { success: true, data: events };
  }

  @Post(':id/items')
  async addItem(
    @Param('id') id: string,
    @Body() dto: CreateLogisticItemDto,
  ): Promise<{ success: boolean; data: any }> {
    const item = await this.logisticService.addItem(id, dto);
    return { success: true, data: item };
  }

  @Patch(':id/items/:itemId')
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: any,
  ): Promise<{ success: boolean; data: any }> {
    const item = await this.logisticService.updateItem(id, itemId, dto);
    return { success: true, data: item };
  }

  @Delete(':id/items/:itemId')
  async deleteItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.logisticService.deleteItem(id, itemId);
    return { success: true, message: 'Item deleted successfully' };
  }

  @Post(':id/check/finalize')
  async finalizeCheck(
    @Param('id') id: string,
    @Body() dto: FinalizeCheckDto,
  ): Promise<{ success: boolean; data: LogisticRecord }> {
    const record = await this.logisticService.finalizeCheck(id, dto);
    return { success: true, data: record };
  }

  @Patch(':id/tags')
  async updateTags(
    @Param('id') id: string,
    @Body() dto: UpdateLabelsDto,
  ): Promise<{ success: boolean; data: LogisticRecord }> {
    const record = await this.logisticService.updateLabels(id, dto);
    return { success: true, data: record };
  }

  @Patch(':id/labels')
  async updateLabels(
    @Param('id') id: string,
    @Body() dto: UpdateLabelsDto,
  ): Promise<{ success: boolean; data: LogisticRecord }> {
    const record = await this.logisticService.updateRecord(id, {
      labels: dto.labels,
      userId: dto.userId,
    });
    return { success: true, data: record };
  }

  @Delete(':id')
  async deleteRecord(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.logisticService.deleteRecord(id, userId);
    return { success: true, message: 'Record deleted successfully' };
  }
}
