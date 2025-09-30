import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as yaml from 'yaml';
import { writeFileSync } from 'fs';
import { register as promRegister } from 'prom-client';

async function bootstrap() {``
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.setGlobalPrefix('api');
  // URL base: /api/v1/logistic/...
  app.enableVersioning();

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Logistics Microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document);
  const yamlDoc = yaml.stringify(document as any);
  writeFileSync('./openapi/openapi.yaml', yamlDoc);

  // Simple /metrics
  app.getHttpAdapter().get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', promRegister.contentType);
    res.send(await promRegister.metrics());
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();