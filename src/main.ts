import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';

// Import modules to include in Swagger
import { LogisticModule } from './logistic/logistic.module';
import { FilesModule } from './files/files.module';
import { NotifyModule } from './notify/notify.module';
import { KanbanModule } from './kanban/kanban.module';
import { PublicModule } from './public/public.module';

// Configure Winston logger for structured JSON logging
const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            context,
            ...meta,
          });
        }),
      ),
    }),
  ],
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // 📖 Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Logistic Service API')
    .setDescription(
      'API documentation for Logistic Service (Trackings, Pickings, Kanban, Files, Notifications, etc.)'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [LogisticModule, FilesModule, NotifyModule, KanbanModule, PublicModule],
  });
  SwaggerModule.setup('api/docs', app, document);

  // Also serve OpenAPI spec at /openapi/openapi.yaml
  app.getHttpAdapter().get('/openapi/openapi.yaml', (req, res) => {
    res.setHeader('Content-Type', 'application/yaml');
    res.send(document);
  });

  // ✅ ValidationPipe (DTOs safe)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 🌍 Enable CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
  ];
  app.enableCors({ origin: corsOrigins, credentials: true });

  // 🚀 Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`🚀 Logistic Service running at: http://localhost:${port}`);
  Logger.log(`📖 Swagger docs available at: http://localhost:${port}/api/docs`);
  Logger.log(`📋 OpenAPI spec available at: http://localhost:${port}/openapi/openapi.yaml`);
  Logger.log(`📊 Prometheus metrics available at: http://localhost:${port}/metrics`);
}
bootstrap();
