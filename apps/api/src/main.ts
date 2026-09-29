import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(cookieParser());

  // ─── Global Prefix ────────────────────────────────────────────────────────
  // Vercel routes /api to this service, so we must expect /api in the path.
  app.setGlobalPrefix('api');

  // ─── Global Validation ────────────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Reject requests with extra properties
    transform: true,           // Auto-transform query params and bodies
  }));

  // ─── CORS ─────────────────────────────────────────────────────────────────
  // Restrict to configured frontend origin; never allow '*' in production.
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ─── Security Headers via helmet ─────────────────────────────────────────
  // helmet is installed; load dynamically to tolerate startup if not present
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const helmetModule = require('helmet');
    const helmetFn = helmetModule.default || helmetModule;
    app.use(helmetFn());
  } catch {
    logger.warn('helmet not installed — security headers not applied. Run: npm install helmet');
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`Application running on port ${port}. CORS origin: ${allowedOrigin}`);
}
void bootstrap();
