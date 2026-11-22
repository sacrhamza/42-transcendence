import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { UseGuards, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

// implemnet function that fetch secret in vault ...

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  // Parse incoming cookies
  app.use(cookieParser());
  // use enabelcors
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', // just this url enable to reed my respons
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // fetch env and secret here and set it in the global object !
  await app.listen(process.env.NESTJS_PORT ?? 3000);
}
void bootstrap();
