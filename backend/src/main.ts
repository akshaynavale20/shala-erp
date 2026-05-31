import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Guard: DB_SYNCHRONIZE=true in production can silently drop columns
  if (process.env.DB_SYNCHRONIZE === 'true' && process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: DB_SYNCHRONIZE must not be true in production. Set DB_SYNCHRONIZE=false and run migrations instead.',
    );
  }

  const app = await NestFactory.create(AppModule);

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe — class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — frontend dev server
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Swagger — API docs
  const config = new DocumentBuilder()
    .setTitle('शिक्षण संस्था व्यवस्थापन प्रणाली API')
    .setDescription('Marathi School Management System — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`SMS API running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
