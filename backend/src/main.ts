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
  try {
    await app.listen(3001);
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log('Backend successfully started on port 3001');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}
bootstrap().catch(err => {
  console.error('Fatal Error during bootstrap:', err);
  process.exit(1);
});
