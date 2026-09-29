import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import serverlessExpress from '@vendia/serverless-express';
import { Handler } from 'aws-lambda';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const logger = new Logger('ServerlessBootstrap');

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(cookieParser());

  // ─── Global Validation ────────────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // ─── CORS ─────────────────────────────────────────────────────────────────
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'upstash-signature'],
    credentials: true,
  });

  // ─── Security Headers via helmet ─────────────────────────────────────────
  try {
    const helmetModule = require('helmet');
    const helmetFn = helmetModule.default || helmetModule;
    app.use(helmetFn());
  } catch {
    logger.warn('helmet not installed — security headers not applied.');
  }

  await app.init();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event: any, context: any, callback: any) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};

export default handler;
