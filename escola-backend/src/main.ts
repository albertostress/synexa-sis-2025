import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Servir arquivos estáticos (logos, imagens)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://localhost:3001',
      'https://homes-opt-confidential-closest.trycloudflare.com',
      /https:\/\/.*\.trycloudflare\.com$/, // Permite todos os tunnels Cloudflare
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const config = new DocumentBuilder()
    .setTitle('Escola Backend API')
    .setDescription('API para gestão escolar - Sistema Synexa-SIS Angola')
    .setVersion('1.0')
    .addTag('enrollment', 'Gestão de Matrículas')
    .addTag('students', 'Gestão de Estudantes')
    .addTag('auth', 'Autenticação')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('🚀 Escola Backend rodando na porta 3000 - Hot Reload Testado!');
  console.log('📚 Documentação disponível em http://localhost:3000/api');
  console.log('🔥 Hot reload configurado e funcionando!');
}

bootstrap().catch((error) => {
  console.error('Erro ao iniciar aplicação:', error);
  process.exit(1);
});