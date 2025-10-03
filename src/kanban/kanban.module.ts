import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KanbanService } from './kanban.service';
import { KanbanController } from './kanban.controller';

@Module({
  imports: [PrismaModule],
  providers: [KanbanService],
  controllers: [KanbanController],
  exports: [KanbanService],
})
export class KanbanModule {}
