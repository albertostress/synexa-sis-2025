/**
 * Parents Portal Module - Módulo do portal dos pais
 * Referência: context7 mcp - NestJS Modules Pattern
 */
import { Module } from '@nestjs/common';
import { ParentsPortalController } from './parents-portal.controller';
import { ParentsPortalService } from './parents-portal.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParentsPortalController],
  providers: [ParentsPortalService],
  exports: [ParentsPortalService],
})
export class ParentsPortalModule {}