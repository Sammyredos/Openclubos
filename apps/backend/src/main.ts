import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Security — use strict CSP in production
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
  } else {
    app.use(helmet({ contentSecurityPolicy: false }));
  }

  // Increase JSON payload limit to handle Base64 image uploads safely
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL environment variable is required in production.');
  }

  // CORS — strict frontend URL in production, localhosts in development
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL as string]
    : process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN'],
    credentials: true,
  });

  app.use(cookieParser());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger — only in development
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Openclub API')
      .setDescription('The Openclub Golf Tournament API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const preferredPort = Number(process.env.BACKEND_PORT ?? 3001);
  const port = await listenWithFallback(app, preferredPort);
  console.log(`Application is running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  }
}
bootstrap();

async function listenWithFallback(
  app: INestApplication,
  preferredPort: number,
) {
  const maxAttempts = 20;
  const startPort = Number.isFinite(preferredPort) ? preferredPort : 3001;

  for (let port = startPort; port < startPort + maxAttempts; port++) {
    try {
      await app.listen(port);
      return port;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err?.code !== 'EADDRINUSE') throw error;
    }
  }

  throw new Error(
    `No available port found in range ${startPort}-${startPort + maxAttempts - 1}`,
  );
}
