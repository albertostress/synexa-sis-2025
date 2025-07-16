import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBackupDto, RestoreBackupDto, BackupType, BackupFormat } from '../dto/backup.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(private prisma: PrismaService) {
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(createBackupDto: CreateBackupDto): Promise<{
    filename: string;
    size: number;
    path: string;
    checksum: string;
    createdAt: Date;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = createBackupDto.name || `backup_${timestamp}`;
    const extension = createBackupDto.format.toLowerCase();
    const fullFilename = `${filename}.${extension}`;
    const backupPath = path.join(this.backupDir, fullFilename);

    try {
      this.logger.log(`Iniciando backup: ${fullFilename}`);

      switch (createBackupDto.format) {
        case BackupFormat.SQL:
          await this.createSqlBackup(backupPath, createBackupDto);
          break;
        case BackupFormat.JSON:
          await this.createJsonBackup(backupPath, createBackupDto);
          break;
        case BackupFormat.CSV:
          await this.createCsvBackup(backupPath, createBackupDto);
          break;
      }

      if (createBackupDto.compress) {
        await this.compressBackup(backupPath);
      }

      const stats = fs.statSync(backupPath);
      const checksum = await this.calculateChecksum(backupPath);

      this.logger.log(`Backup criado com sucesso: ${fullFilename}`);

      return {
        filename: fullFilename,
        size: stats.size,
        path: backupPath,
        checksum,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Erro ao criar backup: ${error.message}`);
      throw new InternalServerErrorException('Erro ao criar backup');
    }
  }

  private async createSqlBackup(backupPath: string, dto: CreateBackupDto): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada');
    }

    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1);
    const host = url.hostname;
    const port = url.port;
    const username = url.username;
    const password = url.password;

    let command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName}`;

    if (dto.tables && dto.tables.length > 0) {
      const tableParams = dto.tables.map(table => `-t ${table}`).join(' ');
      command += ` ${tableParams}`;
    }

    if (!dto.includeSensitiveData) {
      command += ' --exclude-table-data=users --exclude-table-data=parents';
    }

    command += ` > ${backupPath}`;

    process.env.PGPASSWORD = password;
    await execAsync(command);
    delete process.env.PGPASSWORD;
  }

  private async createJsonBackup(backupPath: string, dto: CreateBackupDto): Promise<void> {
    const data: any = {};

    if (!dto.tables || dto.tables.length === 0) {
      data.students = await this.prisma.student.findMany({
        include: {
          schoolClass: true,
          enrollments: true,
          grades: true,
        },
      });
      data.teachers = await this.prisma.teacher.findMany({
        include: {
          user: dto.includeSensitiveData ? true : { select: { name: true, email: true, role: true } },
          subjects: true,
        },
      });
      data.subjects = await this.prisma.subject.findMany();
      data.schoolClasses = await this.prisma.schoolClass.findMany();
      data.grades = await this.prisma.grade.findMany();
      data.enrollments = await this.prisma.enrollment.findMany();
    } else {
      for (const table of dto.tables) {
        if ((this.prisma as any)[table]) {
          data[table] = await (this.prisma as any)[table].findMany();
        }
      }
    }

    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  }

  private async createCsvBackup(backupPath: string, dto: CreateBackupDto): Promise<void> {
    const tables = dto.tables || ['students', 'teachers', 'subjects', 'schoolClasses', 'grades'];
    const csvData: string[] = [];

    for (const table of tables) {
      if ((this.prisma as any)[table]) {
        const data = await (this.prisma as any)[table].findMany();
        if (data.length > 0) {
          csvData.push(`\n--- ${table.toUpperCase()} ---`);
          const headers = Object.keys(data[0]);
          csvData.push(headers.join(','));
          
          data.forEach((row: any) => {
            const values = headers.map(header => {
              const value = row[header];
              return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvData.push(values.join(','));
          });
        }
      }
    }

    fs.writeFileSync(backupPath, csvData.join('\n'));
  }

  private async compressBackup(backupPath: string): Promise<void> {
    const compressedPath = `${backupPath}.gz`;
    await execAsync(`gzip -c ${backupPath} > ${compressedPath}`);
    fs.unlinkSync(backupPath);
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async restoreBackup(restoreBackupDto: RestoreBackupDto): Promise<{
    message: string;
    restoredAt: Date;
  }> {
    const backupPath = path.join(this.backupDir, restoreBackupDto.filename);

    if (!fs.existsSync(backupPath)) {
      throw new BadRequestException('Arquivo de backup não encontrado');
    }

    if (!restoreBackupDto.confirmReplace) {
      throw new BadRequestException('Confirmação de substituição necessária');
    }

    try {
      this.logger.log(`Iniciando restauração: ${restoreBackupDto.filename}`);

      const extension = path.extname(restoreBackupDto.filename).toLowerCase();
      
      switch (extension) {
        case '.sql':
          await this.restoreSqlBackup(backupPath, restoreBackupDto);
          break;
        case '.json':
          await this.restoreJsonBackup(backupPath, restoreBackupDto);
          break;
        case '.csv':
          throw new BadRequestException('Restauração de CSV não suportada');
        default:
          throw new BadRequestException('Formato de backup não suportado');
      }

      this.logger.log(`Restauração concluída: ${restoreBackupDto.filename}`);

      return {
        message: 'Backup restaurado com sucesso',
        restoredAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Erro ao restaurar backup: ${error.message}`);
      throw new InternalServerErrorException('Erro ao restaurar backup');
    }
  }

  private async restoreSqlBackup(backupPath: string, dto: RestoreBackupDto): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada');
    }

    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1);
    const host = url.hostname;
    const port = url.port;
    const username = url.username;
    const password = url.password;

    const command = `psql -h ${host} -p ${port} -U ${username} -d ${dbName} -f ${backupPath}`;

    process.env.PGPASSWORD = password;
    await execAsync(command);
    delete process.env.PGPASSWORD;
  }

  private async restoreJsonBackup(backupPath: string, dto: RestoreBackupDto): Promise<void> {
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    for (const [table, records] of Object.entries(data)) {
      if ((this.prisma as any)[table] && Array.isArray(records)) {
        if (!dto.tables || dto.tables.includes(table)) {
          await (this.prisma as any)[table].deleteMany({});
          for (const record of records as any[]) {
            await (this.prisma as any)[table].create({ data: record });
          }
        }
      }
    }
  }

  async listBackups(): Promise<{
    filename: string;
    size: number;
    createdAt: Date;
    checksum: string;
  }[]> {
    const files = fs.readdirSync(this.backupDir);
    const backups = [];

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      const checksum = await this.calculateChecksum(filePath);

      backups.push({
        filename: file,
        size: stats.size,
        createdAt: stats.birthtime,
        checksum,
      });
    }

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteBackup(filename: string): Promise<{ message: string }> {
    const backupPath = path.join(this.backupDir, filename);

    if (!fs.existsSync(backupPath)) {
      throw new BadRequestException('Arquivo de backup não encontrado');
    }

    fs.unlinkSync(backupPath);

    return { message: 'Backup eliminado com sucesso' };
  }
}