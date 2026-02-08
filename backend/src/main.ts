import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Validation
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Enable CORS for frontend
  app.enableCors();

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('SoleTrade B2B API')
    .setDescription('The API description for SoleTrade B2B Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Listen on port 3001 to avoid conflict with Next.js (3000)
  await app.listen(3001);
}
bootstrap();
