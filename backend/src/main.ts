import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import axios from 'axios';

async function bootstrap() {
  // Enable rawBody for Stripe Webhooks
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Security Headers
  app.use(helmet());

  // Enable Validation
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Enable CORS for frontend
  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['X-Total-Count'],
  });

  const dsn = process.env.BACKEND_ERROR_DSN;
  const sendErr = async (payload: Record<string, unknown>) => {
    if (!dsn) return;
    try {
      await axios.post(dsn, payload).catch(() => {});
    } catch {}
  };
  process.on('uncaughtException', (err) => {
    void sendErr({
      level: 'fatal',
      message: err.message,
      stack: err.stack || '',
      ts: Date.now(),
      service: 'backend',
    });
  });
  process.on('unhandledRejection', (reason: unknown) => {
    const r = reason as any;
    void sendErr({
      level: 'error',
      message: r?.message || 'unhandledRejection',
      stack: r?.stack || '',
      ts: Date.now(),
      service: 'backend',
    });
  });

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('SoleTrade B2B API')
    .setDescription('The API description for SoleTrade B2B Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Listen on all network interfaces for Docker compatibility
  try {
    await app.listen(3001, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log('Backend successfully started on port 3001');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}
bootstrap().catch((err) => {
  console.error('Fatal Error during bootstrap:', err);
  process.exit(1);
});
