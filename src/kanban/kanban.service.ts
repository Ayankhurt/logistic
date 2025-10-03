import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateKanbanColumnDto } from './dto/update-kanban-columns.dto';
import { UpdateKanbanTagsDto } from './dto/update-kanban-tags.dto';

@Injectable()
export class KanbanService {
  constructor(private prisma: PrismaService) {}

  async updateColumn(dto: UpdateKanbanColumnDto) {
    return await this.prisma.logisticRecord.update({
      where: { id: dto.recordId },
      data: { state: dto.newState },
    });
  }

  async updateTags(dto: UpdateKanbanTagsDto) {
    return await this.prisma.logisticRecord.update({
      where: { id: dto.recordId },
      data: { labels: dto.labels.join(',') },
    });
  }

  async getKanbanBoards(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    const records = await this.prisma.logisticRecord.findMany({
      where,
      include: {
        items: true,
        audit: true,
      },
    });

    // Group records by state for kanban view
    const boards = {
      DRAFT: records.filter((r) => r.state === 'DRAFT'),
      CHECK_PENDING: records.filter((r) => r.state === 'CHECK_PENDING'),
      CHECK_IN_PROGRESS: records.filter((r) => r.state === 'CHECK_IN_PROGRESS'),
      CHECK_FINALIZED: records.filter((r) => r.state === 'CHECK_FINALIZED'),
      READY: records.filter((r) => r.state === 'READY'),
      IN_TRANSIT: records.filter((r) => r.state === 'IN_TRANSIT'),
      DELIVERED: records.filter((r) => r.state === 'DELIVERED'),
      CANCELLED: records.filter((r) => r.state === 'CANCELLED'),
    };

    return boards;
  }
}
