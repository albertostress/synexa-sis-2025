// Settings Types for Synexa-SIS
export interface Setting {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  category: string;
  description?: string;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingDto {
  key: string;
  value: string;
  type?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  category: string;
  description?: string;
  isPublic?: boolean;
  isActive?: boolean;
}

export interface UpdateSettingDto {
  value?: string;
  type?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  category?: string;
  description?: string;
  isPublic?: boolean;
  isActive?: boolean;
}

export interface SmtpConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSmtpConfigDto {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface TestSmtpDto {
  email: string;
  subject?: string;
  message?: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive?: boolean;
}

export interface SystemInfo {
  version: string;
  environment: string;
  uptime: string;
  memory: number;
  database: string;
  cache: string;
  lastBackup?: string;
  nextBackup?: string;
  totalUsers?: number;
  totalStudents?: number;
  totalTeachers?: number;
  diskSpace?: {
    total: number;
    used: number;
    free: number;
  };
}

export interface BackupInfo {
  filename: string;
  size: number;
  createdAt: string;
  checksum?: string;
  description?: string;
}

export interface CreateBackupDto {
  description?: string;
  includeFiles?: boolean;
  includeLogs?: boolean;
}

export interface RestoreBackupDto {
  filename: string;
  confirm: boolean;
}

// Predefined setting categories
export enum SettingCategory {
  SCHOOL = 'school',
  SYSTEM = 'system',
  ACADEMIC = 'academic',
  SECURITY = 'security',
  NOTIFICATIONS = 'notifications',
  BACKUP = 'backup',
  SMTP = 'smtp',
  FINANCIAL = 'financial',
  TRANSPORT = 'transport',
  LIBRARY = 'library',
}

// Common setting keys
export const SETTING_KEYS = {
  // School settings
  SCHOOL_NAME: 'school.name',
  SCHOOL_ADDRESS: 'school.address',
  SCHOOL_PHONE: 'school.phone',
  SCHOOL_EMAIL: 'school.email',
  SCHOOL_WEBSITE: 'school.website',
  SCHOOL_LOGO: 'school.logo',
  
  // System settings
  SYSTEM_LANGUAGE: 'system.language',
  SYSTEM_TIMEZONE: 'system.timezone',
  SYSTEM_DATE_FORMAT: 'system.dateFormat',
  SYSTEM_CURRENCY: 'system.currency',
  SYSTEM_THEME: 'system.theme',
  SYSTEM_FONT_SIZE: 'system.fontSize',
  
  // Academic settings
  ACADEMIC_YEAR: 'academic.year',
  ACADEMIC_SEMESTER_START: 'academic.semester_start',
  ACADEMIC_SEMESTER_END: 'academic.semester_end',
  ACADEMIC_GRADING_SCALE: 'academic.grading_scale',
  ACADEMIC_PASS_GRADE: 'academic.pass_grade',
  ACADEMIC_MAX_ABSENCES: 'academic.max_absences',
  
  // Security settings
  SECURITY_TWO_FACTOR: 'security.two_factor',
  SECURITY_PASSWORD_EXPIRY: 'security.password_expiry',
  SECURITY_SESSION_TIMEOUT: 'security.session_timeout',
  SECURITY_MAX_LOGIN_ATTEMPTS: 'security.max_login_attempts',
  SECURITY_PASSWORD_MIN_LENGTH: 'security.password_min_length',
  
  // Notification settings
  NOTIFICATIONS_EMAIL: 'notifications.email',
  NOTIFICATIONS_SMS: 'notifications.sms',
  NOTIFICATIONS_PUSH: 'notifications.push',
  NOTIFICATIONS_WEEKLY_REPORTS: 'notifications.weekly_reports',
  NOTIFICATIONS_PAYMENT_REMINDERS: 'notifications.payment_reminders',
  
  // Backup settings
  BACKUP_AUTO_ENABLED: 'backup.auto_enabled',
  BACKUP_FREQUENCY: 'backup.frequency',
  BACKUP_RETENTION_DAYS: 'backup.retention_days',
  BACKUP_INCLUDE_FILES: 'backup.include_files',
  BACKUP_INCLUDE_LOGS: 'backup.include_logs',
  
  // Financial settings
  FINANCIAL_CURRENCY_SYMBOL: 'financial.currency_symbol',
  FINANCIAL_TAX_RATE: 'financial.tax_rate',
  FINANCIAL_LATE_FEE: 'financial.late_fee',
  FINANCIAL_PAYMENT_DEADLINE: 'financial.payment_deadline',
} as const;

// Default values for settings
export const DEFAULT_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.SCHOOL_NAME]: 'Escola Secundária Synexa',
  [SETTING_KEYS.SCHOOL_ADDRESS]: 'Rua da Educação, 123, Luanda, Angola',
  [SETTING_KEYS.SCHOOL_PHONE]: '+244 222 123 456',
  [SETTING_KEYS.SCHOOL_EMAIL]: 'geral@synexa.ao',
  [SETTING_KEYS.SCHOOL_WEBSITE]: 'www.synexa.ao',
  
  [SETTING_KEYS.SYSTEM_LANGUAGE]: 'pt-AO',
  [SETTING_KEYS.SYSTEM_TIMEZONE]: 'Africa/Luanda',
  [SETTING_KEYS.SYSTEM_DATE_FORMAT]: 'dd/MM/yyyy',
  [SETTING_KEYS.SYSTEM_CURRENCY]: 'AOA',
  [SETTING_KEYS.SYSTEM_THEME]: 'light',
  [SETTING_KEYS.SYSTEM_FONT_SIZE]: 'default',
  
  [SETTING_KEYS.ACADEMIC_YEAR]: '2024/2025',
  [SETTING_KEYS.ACADEMIC_SEMESTER_START]: '2024-09-01',
  [SETTING_KEYS.ACADEMIC_SEMESTER_END]: '2025-01-31',
  [SETTING_KEYS.ACADEMIC_GRADING_SCALE]: '0-20',
  [SETTING_KEYS.ACADEMIC_PASS_GRADE]: '10',
  [SETTING_KEYS.ACADEMIC_MAX_ABSENCES]: '15',
  
  [SETTING_KEYS.SECURITY_TWO_FACTOR]: 'false',
  [SETTING_KEYS.SECURITY_PASSWORD_EXPIRY]: '90',
  [SETTING_KEYS.SECURITY_SESSION_TIMEOUT]: '60',
  [SETTING_KEYS.SECURITY_MAX_LOGIN_ATTEMPTS]: '3',
  [SETTING_KEYS.SECURITY_PASSWORD_MIN_LENGTH]: '8',
  
  [SETTING_KEYS.NOTIFICATIONS_EMAIL]: 'true',
  [SETTING_KEYS.NOTIFICATIONS_SMS]: 'false',
  [SETTING_KEYS.NOTIFICATIONS_PUSH]: 'true',
  [SETTING_KEYS.NOTIFICATIONS_WEEKLY_REPORTS]: 'true',
  [SETTING_KEYS.NOTIFICATIONS_PAYMENT_REMINDERS]: 'true',
  
  [SETTING_KEYS.BACKUP_AUTO_ENABLED]: 'true',
  [SETTING_KEYS.BACKUP_FREQUENCY]: 'daily',
  [SETTING_KEYS.BACKUP_RETENTION_DAYS]: '30',
  [SETTING_KEYS.BACKUP_INCLUDE_FILES]: 'true',
  [SETTING_KEYS.BACKUP_INCLUDE_LOGS]: 'false',
  
  [SETTING_KEYS.FINANCIAL_CURRENCY_SYMBOL]: 'Kz',
  [SETTING_KEYS.FINANCIAL_TAX_RATE]: '14',
  [SETTING_KEYS.FINANCIAL_LATE_FEE]: '500',
  [SETTING_KEYS.FINANCIAL_PAYMENT_DEADLINE]: '15',
};

// Settings validation schemas
export const SETTING_VALIDATION = {
  [SETTING_KEYS.SCHOOL_EMAIL]: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email inválido'
  },
  [SETTING_KEYS.SCHOOL_PHONE]: {
    pattern: /^\+?[1-9]\d{1,14}$/,
    message: 'Telefone inválido'
  },
  [SETTING_KEYS.ACADEMIC_PASS_GRADE]: {
    min: 0,
    max: 20,
    message: 'Nota deve estar entre 0 e 20'
  },
  [SETTING_KEYS.SECURITY_SESSION_TIMEOUT]: {
    min: 5,
    max: 480,
    message: 'Timeout deve estar entre 5 e 480 minutos'
  },
  [SETTING_KEYS.BACKUP_RETENTION_DAYS]: {
    min: 1,
    max: 365,
    message: 'Retenção deve estar entre 1 e 365 dias'
  },
} as const;

// Helper functions
export const validateSetting = (key: string, value: string): { isValid: boolean; message?: string } => {
  const validation = SETTING_VALIDATION[key as keyof typeof SETTING_VALIDATION];
  
  if (!validation) {
    return { isValid: true };
  }
  
  if ('pattern' in validation) {
    const isValid = validation.pattern.test(value);
    return { isValid, message: isValid ? undefined : validation.message };
  }
  
  if ('min' in validation && 'max' in validation) {
    const numValue = parseFloat(value);
    const isValid = !isNaN(numValue) && numValue >= validation.min && numValue <= validation.max;
    return { isValid, message: isValid ? undefined : validation.message };
  }
  
  return { isValid: true };
};

export const getSettingDisplayName = (key: string): string => {
  const displayNames: Record<string, string> = {
    [SETTING_KEYS.SCHOOL_NAME]: 'Nome da Escola',
    [SETTING_KEYS.SCHOOL_ADDRESS]: 'Endereço',
    [SETTING_KEYS.SCHOOL_PHONE]: 'Telefone',
    [SETTING_KEYS.SCHOOL_EMAIL]: 'Email',
    [SETTING_KEYS.SCHOOL_WEBSITE]: 'Website',
    
    [SETTING_KEYS.SYSTEM_LANGUAGE]: 'Idioma',
    [SETTING_KEYS.SYSTEM_TIMEZONE]: 'Fuso Horário',
    [SETTING_KEYS.SYSTEM_DATE_FORMAT]: 'Formato de Data',
    [SETTING_KEYS.SYSTEM_CURRENCY]: 'Moeda',
    
    [SETTING_KEYS.ACADEMIC_YEAR]: 'Ano Letivo',
    [SETTING_KEYS.ACADEMIC_SEMESTER_START]: 'Início do Semestre',
    [SETTING_KEYS.ACADEMIC_SEMESTER_END]: 'Fim do Semestre',
    [SETTING_KEYS.ACADEMIC_GRADING_SCALE]: 'Escala de Notas',
    [SETTING_KEYS.ACADEMIC_PASS_GRADE]: 'Nota de Aprovação',
    
    [SETTING_KEYS.SECURITY_TWO_FACTOR]: 'Autenticação de Dois Fatores',
    [SETTING_KEYS.SECURITY_PASSWORD_EXPIRY]: 'Expiração de Senha (dias)',
    [SETTING_KEYS.SECURITY_SESSION_TIMEOUT]: 'Timeout de Sessão (min)',
    [SETTING_KEYS.SECURITY_MAX_LOGIN_ATTEMPTS]: 'Máx. Tentativas de Login',
    
    [SETTING_KEYS.NOTIFICATIONS_EMAIL]: 'Notificações por Email',
    [SETTING_KEYS.NOTIFICATIONS_SMS]: 'Notificações por SMS',
    [SETTING_KEYS.NOTIFICATIONS_WEEKLY_REPORTS]: 'Relatórios Semanais',
    
    [SETTING_KEYS.BACKUP_AUTO_ENABLED]: 'Backup Automático',
    [SETTING_KEYS.BACKUP_FREQUENCY]: 'Frequência do Backup',
    [SETTING_KEYS.BACKUP_RETENTION_DAYS]: 'Retenção (dias)',
  };
  
  return displayNames[key] || key;
};