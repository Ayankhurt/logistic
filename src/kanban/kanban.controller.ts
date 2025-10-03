import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KanbanService } from './kanban.service';
import { UpdateKanbanColumnDto } from './dto/update-kanban-columns.dto';
import { UpdateKanbanTagsDto } from './dto/update-kanban-tags.dto';

@ApiTags('Kanban')
@Controller('kanban')
export class KanbanController {
  constructor(private kanbanService: KanbanService) {}

  @Get('columns')
  getKanbanColumns(@Query('tenantId') tenantId?: string) {
    return this.kanbanService.getKanbanBoards(tenantId);
  }

  @Patch('column')
  updateColumn(@Body() dto: UpdateKanbanColumnDto) {
    return this.kanbanService.updateColumn(dto);
  }
}
