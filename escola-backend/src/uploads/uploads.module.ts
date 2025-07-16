/**
 * Uploads Module - Módulo de upload de arquivos
 * Configuração do módulo de upload e multer
 */
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: undefined, // Use memory storage para controle manual
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1, // Apenas um arquivo por vez
      },
      fileFilter: (req, file, callback) => {
        // Validação básica de tipo MIME
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Tipo de arquivo não permitido'), false);
        }
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}