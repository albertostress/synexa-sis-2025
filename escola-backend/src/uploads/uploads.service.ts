/**
 * Uploads Service - Serviço de upload de arquivos
 * Lógica de negócio para upload, download e gestão de arquivos
 */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterUploadsDto, FileListResponse } from './dto/filter-uploads.dto';
import { UploadFileDto, FileValidationResult, UploadResponse } from './dto/upload-file.dto';
import { FileType } from './entities/uploaded-file.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Type for Multer file
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadsService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ];
  private readonly ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];

  constructor(private readonly prisma: PrismaService) {}

  private getStoragePath(entityType: 'students' | 'teachers'): string {
    return path.join(process.cwd(), 'storage', entityType);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  private validateFile(file: MulterFile): FileValidationResult {
    // Validar tamanho
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'Arquivo muito grande. Tamanho máximo: 10MB',
      };
    }

    // Validar tipo MIME
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Tipo de arquivo não permitido. Tipos aceitos: PDF, JPG, PNG, DOCX',
      };
    }

    // Validar extensão
    const extension = this.getFileExtension(file.originalname);
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: 'Extensão de arquivo não permitida. Extensões aceitas: .pdf, .jpg, .jpeg, .png, .docx',
      };
    }

    return {
      isValid: true,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  private async saveFile(
    file: MulterFile,
    entityType: 'students' | 'teachers',
  ): Promise<{ storedName: string; path: string }> {
    const extension = this.getFileExtension(file.originalname);
    const storedName = `${uuidv4()}${extension}`;
    const storagePath = this.getStoragePath(entityType);
    
    this.ensureDirectoryExists(storagePath);
    
    const filePath = path.join(storagePath, storedName);
    
    // Salvar arquivo no disco
    await fs.promises.writeFile(filePath, file.buffer);
    
    return {
      storedName,
      path: filePath,
    };
  }

  private async deleteFileFromDisk(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
    }
  }

  async uploadStudentFile(
    studentId: string,
    file: MulterFile,
    uploadData: UploadFileDto,
    uploaderId: string,
  ): Promise<UploadResponse> {
    // Validar arquivo
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Salvar arquivo
    const { storedName, path: filePath } = await this.saveFile(file, 'students');

    // Salvar no banco de dados
    const uploadedFile = await this.prisma.uploadedFile.create({
      data: {
        originalName: file.originalname,
        storedName,
        path: filePath,
        mimeType: file.mimetype,
        size: file.size,
        type: uploadData.type,
        studentId,
        uploaderId,
      },
    });

    return {
      id: uploadedFile.id,
      originalName: uploadedFile.originalName,
      type: uploadedFile.type as FileType,
      size: uploadedFile.size,
      createdAt: uploadedFile.createdAt,
      message: 'Arquivo enviado com sucesso',
    };
  }

  async uploadTeacherFile(
    teacherId: string,
    file: MulterFile,
    uploadData: UploadFileDto,
    uploaderId: string,
  ): Promise<UploadResponse> {
    // Validar arquivo
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    // Verificar se o professor existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    // Salvar arquivo
    const { storedName, path: filePath } = await this.saveFile(file, 'teachers');

    // Salvar no banco de dados
    const uploadedFile = await this.prisma.uploadedFile.create({
      data: {
        originalName: file.originalname,
        storedName,
        path: filePath,
        mimeType: file.mimetype,
        size: file.size,
        type: uploadData.type,
        teacherId,
        uploaderId,
      },
    });

    return {
      id: uploadedFile.id,
      originalName: uploadedFile.originalName,
      type: uploadedFile.type as FileType,
      size: uploadedFile.size,
      createdAt: uploadedFile.createdAt,
      message: 'Arquivo enviado com sucesso',
    };
  }

  async listFiles(
    entityType: 'student' | 'teacher',
    entityId: string,
    filters: FilterUploadsDto,
  ): Promise<FileListResponse> {
    const { page = 1, limit = 10, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (entityType === 'student') {
      whereConditions.studentId = entityId;
    } else {
      whereConditions.teacherId = entityId;
    }

    if (restFilters.type) {
      whereConditions.type = restFilters.type;
    }

    if (restFilters.search) {
      whereConditions.originalName = {
        contains: restFilters.search,
        mode: 'insensitive',
      };
    }

    if (restFilters.startDate || restFilters.endDate) {
      whereConditions.createdAt = {};
      if (restFilters.startDate) {
        whereConditions.createdAt.gte = new Date(restFilters.startDate);
      }
      if (restFilters.endDate) {
        whereConditions.createdAt.lte = new Date(restFilters.endDate);
      }
    }

    const [files, total] = await Promise.all([
      this.prisma.uploadedFile.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
          teacher: {
            select: { id: true, user: { select: { name: true, email: true } } },
          },
          uploader: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.uploadedFile.count({
        where: whereConditions,
      }),
    ]);

    return {
      files,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFileForDownload(fileId: string): Promise<{
    file: Buffer;
    originalName: string;
    mimeType: string;
  }> {
    const uploadedFile = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!uploadedFile) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    if (!fs.existsSync(uploadedFile.path)) {
      throw new NotFoundException('Arquivo não encontrado no servidor');
    }

    const file = await fs.promises.readFile(uploadedFile.path);

    return {
      file,
      originalName: uploadedFile.originalName,
      mimeType: uploadedFile.mimeType,
    };
  }

  async deleteFile(fileId: string): Promise<{ message: string }> {
    const uploadedFile = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!uploadedFile) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    // Deletar arquivo do disco
    await this.deleteFileFromDisk(uploadedFile.path);

    // Deletar registro do banco
    await this.prisma.uploadedFile.delete({
      where: { id: fileId },
    });

    return {
      message: 'Arquivo deletado com sucesso',
    };
  }

  async getFileById(fileId: string) {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        teacher: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    return file;
  }

  // Método preparado para futura migração para S3/MinIO
  async migrateToCloudStorage(fileId: string): Promise<void> {
    // TODO: Implementar migração para cloud storage
    throw new Error('Migração para cloud storage não implementada');
  }
}