import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Returns the health status of the application and its dependencies'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 123.456 },
        database: { type: 'string', example: 'connected' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Service is unhealthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 123.456 },
        database: { type: 'string', example: 'disconnected' },
        version: { type: 'string', example: '1.0.0' },
        error: { type: 'string', example: 'Database connection failed' }
      }
    }
  })
  async check() {
    const startTime = Date.now();
    let databaseStatus = 'disconnected';
    let error: string | undefined;

    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (err) {
      databaseStatus = 'disconnected';
      error = err instanceof Error ? err.message : 'Unknown database error';
    }

    const response = {
      status: databaseStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: databaseStatus,
      version: process.env.npm_package_version || '1.0.0',
      ...(error && { error }),
    };

    return response;
  }

  @Get('ready')
  @ApiOperation({ 
    summary: 'Readiness check endpoint',
    description: 'Returns whether the service is ready to accept traffic'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is ready',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ready' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Service is not ready'
  })
  async ready() {
    try {
      // Check if database is accessible
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      throw new Error('Service not ready: Database connection failed');
    }
  }

  @Get('live')
  @ApiOperation({ 
    summary: 'Liveness check endpoint',
    description: 'Returns whether the service is alive (basic process check)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'alive' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 123.456 }
      }
    }
  })
  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
