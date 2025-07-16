import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { BackupService } from './services/backup.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, BackupService, PrismaService],
  exports: [SettingsService, BackupService],
})
export class SettingsModule {}