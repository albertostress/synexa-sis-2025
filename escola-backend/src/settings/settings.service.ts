import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettingDto, UpdateSettingDto, FilterSettingsDto, SettingType } from './dto/create-setting.dto';
import { CreateSmtpConfigDto, UpdateSmtpConfigDto, TestSmtpDto } from './dto/smtp-config.dto';
import { CreateWebhookDto, UpdateWebhookDto, FilterWebhooksDto, TestWebhookDto } from './dto/webhook.dto';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

  constructor(private prisma: PrismaService) {}

  async createSetting(createSettingDto: CreateSettingDto) {
    const existingSetting = await this.prisma.setting.findUnique({
      where: { key: createSettingDto.key },
    });

    if (existingSetting) {
      throw new ConflictException('Configuração com essa chave já existe');
    }

    let processedValue = createSettingDto.value;

    if (createSettingDto.type === SettingType.JSON) {
      try {
        JSON.parse(processedValue);
      } catch {
        throw new BadRequestException('Valor inválido para tipo JSON');
      }
    } else if (createSettingDto.type === SettingType.NUMBER) {
      if (isNaN(Number(processedValue))) {
        throw new BadRequestException('Valor inválido para tipo NUMBER');
      }
    } else if (createSettingDto.type === SettingType.BOOLEAN) {
      if (!['true', 'false'].includes(processedValue.toLowerCase())) {
        throw new BadRequestException('Valor inválido para tipo BOOLEAN');
      }
    }

    return this.prisma.setting.create({
      data: createSettingDto,
    });
  }

  async findAllSettings(filters: FilterSettingsDto = {}) {
    const where: any = {};

    if (filters.key) {
      where.key = { contains: filters.key, mode: 'insensitive' };
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    const settings = await this.prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  async findSettingByKey(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException('Configuração não encontrada');
    }

    return setting;
  }

  async findSettingById(id: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException('Configuração não encontrada');
    }

    return setting;
  }

  async updateSetting(id: string, updateSettingDto: UpdateSettingDto) {
    const setting = await this.findSettingById(id);

    if (updateSettingDto.value && updateSettingDto.type) {
      if (updateSettingDto.type === SettingType.JSON) {
        try {
          JSON.parse(updateSettingDto.value);
        } catch {
          throw new BadRequestException('Valor inválido para tipo JSON');
        }
      } else if (updateSettingDto.type === SettingType.NUMBER) {
        if (isNaN(Number(updateSettingDto.value))) {
          throw new BadRequestException('Valor inválido para tipo NUMBER');
        }
      } else if (updateSettingDto.type === SettingType.BOOLEAN) {
        if (!['true', 'false'].includes(updateSettingDto.value.toLowerCase())) {
          throw new BadRequestException('Valor inválido para tipo BOOLEAN');
        }
      }
    }

    return this.prisma.setting.update({
      where: { id },
      data: updateSettingDto,
    });
  }

  async deleteSetting(id: string) {
    await this.findSettingById(id);

    await this.prisma.setting.delete({
      where: { id },
    });

    return { message: 'Configuração eliminada com sucesso' };
  }

  async createSmtpConfig(createSmtpConfigDto: CreateSmtpConfigDto) {
    const existingConfig = await this.prisma.smtpConfig.findFirst({
      where: { isActive: true },
    });

    if (existingConfig) {
      throw new ConflictException('Já existe uma configuração SMTP ativa');
    }

    const encryptedPassword = this.encrypt(createSmtpConfigDto.password);

    return this.prisma.smtpConfig.create({
      data: {
        ...createSmtpConfigDto,
        password: encryptedPassword,
      },
    });
  }

  async findSmtpConfig() {
    const config = await this.prisma.smtpConfig.findFirst({
      where: { isActive: true },
    });

    if (config) {
      return {
        ...config,
        password: '[HIDDEN]',
      };
    }

    return null;
  }

  async updateSmtpConfig(id: string, updateSmtpConfigDto: UpdateSmtpConfigDto) {
    const config = await this.prisma.smtpConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Configuração SMTP não encontrada');
    }

    const updateData = { ...updateSmtpConfigDto };

    if (updateSmtpConfigDto.password) {
      updateData.password = this.encrypt(updateSmtpConfigDto.password);
    }

    return this.prisma.smtpConfig.update({
      where: { id },
      data: updateData,
    });
  }

  async testSmtpConfig(testSmtpDto: TestSmtpDto) {
    const config = await this.prisma.smtpConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      throw new NotFoundException('Configuração SMTP não encontrada');
    }

    const decryptedPassword = this.decrypt(config.password);

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: decryptedPassword,
      },
    });

    try {
      await transporter.sendMail({
        from: `${config.fromName} <${config.user}>`,
        to: testSmtpDto.toEmail,
        subject: testSmtpDto.subject || 'Teste de configuração SMTP',
        text: testSmtpDto.body || 'Este é um email de teste para verificar a configuração SMTP.',
      });

      return { message: 'Email de teste enviado com sucesso' };
    } catch (error) {
      this.logger.error(`Erro ao enviar email de teste: ${error.message}`);
      throw new BadRequestException('Erro ao enviar email de teste');
    }
  }

  async createWebhook(createWebhookDto: CreateWebhookDto) {
    return this.prisma.webhook.create({
      data: createWebhookDto,
    });
  }

  async findAllWebhooks(filters: FilterWebhooksDto = {}) {
    const where: any = {};

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.method) {
      where.method = filters.method;
    }

    if (filters.event) {
      where.events = { has: filters.event };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.webhook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWebhookById(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook não encontrado');
    }

    return webhook;
  }

  async updateWebhook(id: string, updateWebhookDto: UpdateWebhookDto) {
    await this.findWebhookById(id);

    return this.prisma.webhook.update({
      where: { id },
      data: updateWebhookDto,
    });
  }

  async deleteWebhook(id: string) {
    await this.findWebhookById(id);

    await this.prisma.webhook.delete({
      where: { id },
    });

    return { message: 'Webhook eliminado com sucesso' };
  }

  async testWebhook(id: string, testWebhookDto: TestWebhookDto) {
    const webhook = await this.findWebhookById(id);

    if (!webhook.isActive) {
      throw new BadRequestException('Webhook não está ativo');
    }

    const payload = testWebhookDto.testData || {
      event: 'TEST_EVENT',
      message: 'Este é um teste de webhook',
      timestamp: new Date(),
      webhook_id: webhook.id,
    };

    try {
      const response = await axios({
        method: webhook.method.toLowerCase() as any,
        url: webhook.url,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.headers as Record<string, string> || {}),
        },
        timeout: 10000,
      });

      this.logger.log(`Webhook testado com sucesso: ${webhook.name}`);

      return {
        message: 'Webhook testado com sucesso',
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Erro ao testar webhook: ${error.message}`);
      throw new BadRequestException('Erro ao testar webhook');
    }
  }

  async triggerWebhook(event: string, data: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: event },
      },
    });

    const results = [];

    for (const webhook of webhooks) {
      try {
        const response = await axios({
          method: webhook.method.toLowerCase() as any,
          url: webhook.url,
          data: {
            event,
            data,
            timestamp: new Date(),
            webhook_id: webhook.id,
          },
          headers: {
            'Content-Type': 'application/json',
            ...(webhook.headers as Record<string, string> || {}),
          },
          timeout: 10000,
        });

        results.push({
          webhookId: webhook.id,
          status: 'success',
          response: response.status,
        });
      } catch (error) {
        results.push({
          webhookId: webhook.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.encryptionKey).digest(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const [ivHex, encrypted] = parts;
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.encryptionKey).digest(), iv);
    const decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    return decrypted;
  }
}