import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { BackupService } from './services/backup.service';
import { CreateSettingDto, UpdateSettingDto, FilterSettingsDto } from './dto/create-setting.dto';
import { CreateSmtpConfigDto, UpdateSmtpConfigDto, TestSmtpDto } from './dto/smtp-config.dto';
import { CreateWebhookDto, UpdateWebhookDto, FilterWebhooksDto, TestWebhookDto } from './dto/webhook.dto';
import { CreateBackupDto, RestoreBackupDto } from './dto/backup.dto';
import { Setting } from './entities/setting.entity';
import { SmtpConfig } from './entities/smtp-config.entity';
import { Webhook } from './entities/webhook.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly backupService: BackupService,
  ) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar nova configuração global' })
  @ApiResponse({
    status: 201,
    description: 'Configuração criada com sucesso',
    type: Setting,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 409, description: 'Configuração com essa chave já existe' })
  async createSetting(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.createSetting(createSettingDto);
  }

  @Get()
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ summary: 'Listar configurações globais' })
  @ApiResponse({
    status: 200,
    description: 'Lista de configurações',
    type: [Setting],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async findAllSettings(@Query() filters: FilterSettingsDto) {
    return this.settingsService.findAllSettings(filters);
  }

  @Get('key/:key')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ summary: 'Buscar configuração por chave' })
  @ApiResponse({
    status: 200,
    description: 'Configuração encontrada',
    type: Setting,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Configuração não encontrada' })
  async findSettingByKey(@Param('key') key: string) {
    return this.settingsService.findSettingByKey(key);
  }

  @Get(':id')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ summary: 'Buscar configuração por ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuração encontrada',
    type: Setting,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Configuração não encontrada' })
  async findSettingById(@Param('id') id: string) {
    return this.settingsService.findSettingById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar configuração' })
  @ApiResponse({
    status: 200,
    description: 'Configuração atualizada com sucesso',
    type: Setting,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Configuração não encontrada' })
  async updateSetting(
    @Param('id') id: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.updateSetting(id, updateSettingDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar configuração' })
  @ApiResponse({
    status: 200,
    description: 'Configuração eliminada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Configuração não encontrada' })
  async deleteSetting(@Param('id') id: string) {
    return this.settingsService.deleteSetting(id);
  }

  @Post('smtp')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Configurar servidor SMTP' })
  @ApiResponse({
    status: 201,
    description: 'Configuração SMTP criada com sucesso',
    type: SmtpConfig,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 409, description: 'Já existe uma configuração SMTP ativa' })
  async createSmtpConfig(@Body() createSmtpConfigDto: CreateSmtpConfigDto) {
    return this.settingsService.createSmtpConfig(createSmtpConfigDto);
  }

  @Get('smtp/config')
  @Roles('ADMIN', 'DIRETOR')
  @ApiOperation({ summary: 'Ver configuração SMTP atual' })
  @ApiResponse({
    status: 200,
    description: 'Configuração SMTP atual',
    type: SmtpConfig,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async findSmtpConfig() {
    return this.settingsService.findSmtpConfig();
  }

  @Patch('smtp/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar configuração SMTP' })
  @ApiResponse({
    status: 200,
    description: 'Configuração SMTP atualizada com sucesso',
    type: SmtpConfig,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Configuração SMTP não encontrada' })
  async updateSmtpConfig(
    @Param('id') id: string,
    @Body() updateSmtpConfigDto: UpdateSmtpConfigDto,
  ) {
    return this.settingsService.updateSmtpConfig(id, updateSmtpConfigDto);
  }

  @Post('smtp/test')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Testar configuração SMTP' })
  @ApiResponse({
    status: 200,
    description: 'Email de teste enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Erro ao enviar email de teste' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Configuração SMTP não encontrada' })
  async testSmtpConfig(@Body() testSmtpDto: TestSmtpDto) {
    return this.settingsService.testSmtpConfig(testSmtpDto);
  }

  @Post('webhooks')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar webhook' })
  @ApiResponse({
    status: 201,
    description: 'Webhook criado com sucesso',
    type: Webhook,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async createWebhook(@Body() createWebhookDto: CreateWebhookDto) {
    return this.settingsService.createWebhook(createWebhookDto);
  }

  @Get('webhooks')
  @Roles('ADMIN', 'DIRETOR')
  @ApiOperation({ summary: 'Listar webhooks' })
  @ApiResponse({
    status: 200,
    description: 'Lista de webhooks',
    type: [Webhook],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async findAllWebhooks(@Query() filters: FilterWebhooksDto) {
    return this.settingsService.findAllWebhooks(filters);
  }

  @Get('webhooks/:id')
  @Roles('ADMIN', 'DIRETOR')
  @ApiOperation({ summary: 'Ver detalhes do webhook' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do webhook',
    type: Webhook,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado' })
  async findWebhookById(@Param('id') id: string) {
    return this.settingsService.findWebhookById(id);
  }

  @Patch('webhooks/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook atualizado com sucesso',
    type: Webhook,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado' })
  async updateWebhook(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    return this.settingsService.updateWebhook(id, updateWebhookDto);
  }

  @Delete('webhooks/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook eliminado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado' })
  async deleteWebhook(@Param('id') id: string) {
    return this.settingsService.deleteWebhook(id);
  }

  @Post('webhooks/:id/test')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Testar webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook testado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        status: { type: 'number' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Erro ao testar webhook' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado' })
  async testWebhook(
    @Param('id') id: string,
    @Body() testWebhookDto: TestWebhookDto,
  ) {
    return this.settingsService.testWebhook(id, testWebhookDto);
  }

  @Post('backup')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar backup do sistema' })
  @ApiResponse({
    status: 201,
    description: 'Backup criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        size: { type: 'number' },
        path: { type: 'string' },
        checksum: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 500, description: 'Erro ao criar backup' })
  async createBackup(@Body() createBackupDto: CreateBackupDto) {
    return this.backupService.createBackup(createBackupDto);
  }

  @Get('backup/list')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar backups disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de backups',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          size: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          checksum: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Post('backup/restore')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Restaurar backup' })
  @ApiResponse({
    status: 200,
    description: 'Backup restaurado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        restoredAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou confirmação necessária' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 500, description: 'Erro ao restaurar backup' })
  async restoreBackup(@Body() restoreBackupDto: RestoreBackupDto) {
    return this.backupService.restoreBackup(restoreBackupDto);
  }

  @Delete('backup/:filename')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar backup' })
  @ApiResponse({
    status: 200,
    description: 'Backup eliminado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivo de backup não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async deleteBackup(@Param('filename') filename: string) {
    return this.backupService.deleteBackup(filename);
  }
}