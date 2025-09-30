import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LogisticService } from './logistic.service';
import { BearerAuthGuard } from '../common/auth/bearer.guard';
import { CreateLogisticRecordDto } from './dto/create-logistic-record.dto';
import { UpdateLogisticRecordDto } from './dto/update-logistic-record.dto';
import { VerifyItemsDto } from './dto/verify-items.dto';
import { ChangeStateDto } from './dto/change-state.dto';
import { UpdateLabelsDto } from './dto/update-labels.dto';
import { AssignMessengerDto } from './dto/assign-messenger.dto';
import { NotifyDto } from './dto/notify.dto';
import { DuplicateDto } from './dto/duplicate.dto';
import { SplitRecordsDto } from './dto/split.dto';
import { QueryLogisticRecordsDto } from './dto/query-logistic-records.dto';
import { LogisticRecordResponseDto } from './dto/logistic-record-response.dto';
import type { LogisticType } from './interfaces/logistic.interface';

@ApiTags('Logistic Records')
@ApiBearerAuth()
@UseGuards(BearerAuthGuard)
@Controller({ path: 'logistic/records', version: '1' })
export class LogisticController {
  constructor(private readonly service: LogisticService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new logistic record',
    description: 'Creates a new tracking or picking record with validation of contacts and custom fields'
  })
  @ApiQuery({ name: 'type', enum: ['TRACKING', 'PICKING'], description: 'Type of logistic record' })
  @ApiQuery({ name: 'originType', required: false, description: 'Type of origin document' })
  @ApiQuery({ name: 'originId', required: false, description: 'ID of origin document' })
  @ApiResponse({ 
    status: 201, 
    description: 'Logistic record created successfully',
    type: LogisticRecordResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateLogisticRecordDto, 
    @Query('type') type: LogisticType = 'TRACKING', 
    @Query('originType') originType?: string, 
    @Query('originId') originId?: string
  ) {
    return this.service.create(dto, type, { originType, originId });
  }

  @Get()
  @ApiOperation({ 
    summary: 'List logistic records',
    description: 'Retrieves a list of logistic records with optional filtering'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of logistic records retrieved successfully',
    type: [LogisticRecordResponseDto]
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Query() q: QueryLogisticRecordsDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get logistic record by ID',
    description: 'Retrieves a specific logistic record with all its details'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logistic record retrieved successfully',
    type: LogisticRecordResponseDto
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update logistic record',
    description: 'Updates a logistic record with new data (only allowed fields)'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logistic record updated successfully',
    type: LogisticRecordResponseDto
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Param('id') id: string, @Body() dto: UpdateLogisticRecordDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete logistic record',
    description: 'Deletes a logistic record and all its associated data'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ status: 200, description: 'Logistic record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // HU-L-003 Verify items
  @Post(':id/check/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify items in logistic record',
    description: 'Select/deselect items and update verified quantities during check process'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ status: 200, description: 'Items verified successfully' })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyItems(@Param('id') id: string, @Body() dto: VerifyItemsDto) {
    return this.service.verifyItems(id, dto.items);
  }

  // HU-L-004 Finalize check
  @Post(':id/check/finalize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Finalize item check',
    description: 'Finalizes the check process after at least one item has been verified'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Check finalized successfully',
    type: LogisticRecordResponseDto
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 400, description: 'Bad request - no items verified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async finalizeCheck(@Param('id') id: string) {
    return this.service.finalizeCheck(id);
  }

  // HU-L-005 Kanban move
  @Post(':id/state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Change logistic record state',
    description: 'Updates the state of a logistic record for Kanban board management'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'State changed successfully',
    type: LogisticRecordResponseDto
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid state' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changeState(@Param('id') id: string, @Body() dto: ChangeStateDto) {
    return this.service.changeState(id, dto.state);
  }

  // HU-L-006 Labels
  @Patch(':id/labels')
  @ApiOperation({ 
    summary: 'Update logistic record labels',
    description: 'Updates the labels for a logistic record (validated against custom fields)'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Labels updated successfully',
    type: LogisticRecordResponseDto
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid labels' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateLabels(@Param('id') id: string, @Body() dto: UpdateLabelsDto) {
    return this.service.updateLabels(id, dto.labels);
  }

  // HU-L-007 Assign messenger
  @Post(':id/messenger/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Assign messenger to logistic record',
    description: 'Assigns a messenger to handle the logistic record'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Messenger assigned successfully',
    type: LogisticRecordResponseDto
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async assignMessenger(@Param('id') id: string, @Body() dto: AssignMessengerDto) {
    return this.service.assignMessenger(id, dto.messengerId);
  }

  // HU-L-008 Print
  @Post(':id/print')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Print logistic record guide',
    description: 'Generates and uploads a PDF guide for the logistic record'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Guide printed successfully',
    type: LogisticRecordResponseDto
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async print(@Param('id') id: string) {
    return this.service.printGuide(id);
  }

  // HU-L-009 Notify
  @Post(':id/notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send tracking notification',
    description: 'Sends tracking link notification via specified channels'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        link: { type: 'string', description: 'Tracking link' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async notify(@Param('id') id: string, @Body() dto: NotifyDto) {
    return this.service.notify(id, dto.channels);
  }

  // HU-L-011 Duplicate
  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Duplicate logistic record',
    description: 'Creates a new logistic record based on an existing one'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID to duplicate' })
  @ApiResponse({ 
    status: 201, 
    description: 'Logistic record duplicated successfully',
    type: LogisticRecordResponseDto
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async duplicate(@Param('id') id: string, @Body() dto: DuplicateDto) {
    return this.service.duplicate(id, dto.copyExtra);
  }

  // HU-L-012 Split
  @Post(':id/split')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Split logistic record',
    description: 'Splits a logistic record into multiple smaller records'
  })
  @ApiParam({ name: 'id', description: 'Logistic record ID to split' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logistic record split successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        children: { 
          type: 'array',
          items: { $ref: '#/components/schemas/LogisticRecordResponseDto' }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Logistic record not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async split(@Param('id') id: string, @Body() dto: SplitRecordsDto) {
    return this.service.split(id, dto.splits);
  }
}