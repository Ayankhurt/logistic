import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async trackPackage(guideNumber: string) {
    const record = await this.prisma.logisticRecord.findFirst({
      where: { guideNumber },
      include: {
        items: true,
        audit: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Package not found');
    }

    return {
      guideNumber: record.guideNumber,
      state: record.state,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items: record.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        qtyExpected: item.qtyExpected,
        qtyVerified: item.qtyVerified,
      })),
      recentEvents: record.audit.map((audit) => ({
        action: audit.action,
        createdAt: audit.createdAt,
        createdBy: audit.createdBy,
      })),
    };
  }
}
