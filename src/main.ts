import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  const corsOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Enable CORS
  app.enableCors({
    // If CORS_ORIGINS is not provided, allow requests from any origin.
    // To restrict origins, set CORS_ORIGINS="https://a.com,https://b.com"
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
  });

  // Increase payload size limits for image uploads (large base64 images)
  // TODO: Replace with proper file upload to Firebase Storage or S3
  app.use(require('express').json({ limit: '200mb' }));
  app.use(require('express').urlencoded({ limit: '200mb', extended: true }));
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();
