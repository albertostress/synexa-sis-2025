/**
 * Documents Module - Módulo de documentos oficiais escolares
 * Referência: context7 mcp - NestJS Modules Pattern
 */
import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [PrismaModule, PdfModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}