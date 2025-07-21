import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Save, 
  Mail, 
  Shield, 
  Database, 
  Bell, 
  Globe, 
  Users, 
  School,
  Settings as SettingsIcon,
  Download,
  Upload,
  RefreshCw,
  Webhook,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  Key,
  Lock,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { settingsAPI } from '@/lib/api';
import { useFontSize, FONT_SIZE_OPTIONS } from '@/hooks/useFontSize';
import { FontSizeDemo } from '@/components/FontSizeControl';

interface Setting {
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

interface SmtpConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  isActive: boolean;
}

interface SystemInfo {
  version: string;
  environment: string;
  uptime: string;
  memory: number;
  database: string;
  cache: string;
  lastBackup?: string;
  nextBackup?: string;
}

export default function SettingsIntegrated() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    currentFontSize, 
    currentConfig, 
    fontSizeOptions, 
    setFontSize, 
    increaseFontSize, 
    decreaseFontSize, 
    resetFontSize,
    canIncrease,
    canDecrease 
  } = useFontSize();
  
  const [activeTab, setActiveTab] = useState('school');
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  // ============= QUERIES =============
  const { 
    data: settings = [], 
    isLoading: settingsLoading, 
    error: settingsError 
  } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.getAllSettings(),
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: smtpConfig, 
    isLoading: smtpLoading 
  } = useQuery({
    queryKey: ['settings', 'smtp'],
    queryFn: () => settingsAPI.getSmtpConfig(),
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: systemInfo,
    isLoading: systemLoading 
  } = useQuery({
    queryKey: ['settings', 'system-info'],
    queryFn: () => settingsAPI.getSystemInfo(),
    staleTime: 2 * 60 * 1000,
  });

  const { 
    data: backups = [],
    isLoading: backupsLoading 
  } = useQuery({
    queryKey: ['settings', 'backups'],
    queryFn: () => settingsAPI.getBackupList(),
    staleTime: 30 * 1000,
  });

  // ============= MUTATIONS =============
  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => 
      settingsAPI.updateSettingByKey(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Configuração atualizada",
        description: "A configuração foi guardada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.response?.data?.message || "Erro inesperado",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (schoolSettings: any) => settingsAPI.updateSchoolSettings(schoolSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Configurações guardadas",
        description: "Todas as configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao guardar",
        description: error.response?.data?.message || "Erro inesperado",
        variant: "destructive",
      });
    },
  });

  const smtpTestMutation = useMutation({
    mutationFn: (email: string) => settingsAPI.testSmtpConfig({ email }),
    onSuccess: () => {
      toast({
        title: "Email de teste enviado",
        description: "Verifique a sua caixa de entrada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no teste SMTP",
        description: error.response?.data?.message || "Falha no envio",
        variant: "destructive",
      });
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: () => settingsAPI.createBackup({ description: 'Backup manual via interface' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'backups'] });
      setBackupProgress(100);
      toast({
        title: "Backup criado",
        description: "O backup foi criado com sucesso.",
      });
      setTimeout(() => setBackupProgress(0), 2000);
    },
    onError: (error: any) => {
      setBackupProgress(0);
      toast({
        title: "Erro no backup",
        description: error.response?.data?.message || "Falha na criação",
        variant: "destructive",
      });
    },
  });

  // ============= HELPER FUNCTIONS =============
  const getSettingValue = (key: string, defaultValue = '') => {
    const setting = settings.find((s: Setting) => s.key === key);
    return setting?.value || defaultValue;
  };

  const updateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const handleBulkSave = () => {
    const schoolSettings = {
      schoolName: getSettingValue('school.name'),
      schoolAddress: getSettingValue('school.address'),
      schoolPhone: getSettingValue('school.phone'),
      schoolEmail: getSettingValue('school.email'),
      schoolWebsite: getSettingValue('school.website'),
      academicYear: getSettingValue('academic.year'),
      language: getSettingValue('system.language'),
      timezone: getSettingValue('system.timezone'),
      currency: getSettingValue('system.currency'),
    };
    bulkUpdateMutation.mutate(schoolSettings);
  };

  const handleTestSmtp = () => {
    const email = getSettingValue('school.email', 'admin@escola.ao');
    setTestingSmtp(true);
    smtpTestMutation.mutate(email);
    setTimeout(() => setTestingSmtp(false), 3000);
  };

  const handleCreateBackup = () => {
    setBackupProgress(10);
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    createBackupMutation.mutate();
  };

  const handleExportSettings = async () => {
    try {
      const blob = await settingsAPI.exportSettings();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuracoes-synexa-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Export concluído",
        description: "As configurações foram exportadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Não foi possível exportar as configurações.",
        variant: "destructive",
      });
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Tem certeza que deseja restaurar todas as configurações para os valores padrão?')) {
      try {
        await settingsAPI.resetToDefaults();
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        toast({
          title: "Configurações restauradas",
          description: "Todas as configurações foram repostas para os valores padrão.",
        });
      } catch (error) {
        toast({
          title: "Erro ao restaurar",
          description: "Não foi possível restaurar as configurações.",
          variant: "destructive",
        });
      }
    }
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar configurações. Tente recarregar a página.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3" />
            Configurações do Sistema
          </h1>
          <p className="text-muted-foreground">
            Controle total do sistema escolar Synexa
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={handleResetDefaults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Repor Padrões
          </Button>
          <Button onClick={handleBulkSave} disabled={bulkUpdateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Alterações
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sistema</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Uptime</p>
                <p className="text-2xl font-bold">{systemInfo?.uptime || '99.9%'}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Último Backup</p>
                <p className="text-2xl font-bold">
                  {systemInfo?.lastBackup ? new Date(systemInfo.lastBackup).toLocaleDateString('pt-AO') : 'N/A'}
                </p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">SMTP Status</p>
                <div className="text-2xl font-bold">
                  {smtpConfig?.isActive ? (
                    <Badge variant="default" className="bg-green-500">Ativo</Badge>
                  ) : (
                    <Badge variant="destructive">Inativo</Badge>
                  )}
                </div>
              </div>
              <Mail className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="school">Escola</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="academic">Académico</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* School Settings */}
        <TabsContent value="school" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <School className="w-5 h-5 mr-2" />
                Informações da Escola
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schoolName">Nome da Escola</Label>
                  <Input
                    id="schoolName"
                    value={getSettingValue('school.name', 'Escola Secundária Synexa')}
                    onChange={(e) => updateSetting('school.name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="schoolPhone">Telefone</Label>
                  <Input
                    id="schoolPhone"
                    value={getSettingValue('school.phone', '+244 222 123 456')}
                    onChange={(e) => updateSetting('school.phone', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="schoolAddress">Morada</Label>
                <Textarea
                  id="schoolAddress"
                  value={getSettingValue('school.address', 'Rua da Educação, 123, Luanda')}
                  onChange={(e) => updateSetting('school.address', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schoolEmail">Email</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    value={getSettingValue('school.email', 'geral@synexa.ao')}
                    onChange={(e) => updateSetting('school.email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="schoolWebsite">Website</Label>
                  <Input
                    id="schoolWebsite"
                    value={getSettingValue('school.website', 'www.synexa.ao')}
                    onChange={(e) => updateSetting('school.website', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={getSettingValue('system.language', 'pt-AO')} 
                    onValueChange={(value) => updateSetting('system.language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-AO">Português (Angola)</SelectItem>
                      <SelectItem value="pt">Português (Portugal)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select 
                    value={getSettingValue('system.timezone', 'Africa/Luanda')} 
                    onValueChange={(value) => updateSetting('system.timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Luanda">Luanda (WAT+1)</SelectItem>
                      <SelectItem value="Europe/Lisbon">Lisboa (GMT+0)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFormat">Formato de Data</Label>
                  <Select 
                    value={getSettingValue('system.dateFormat', 'dd/mm/yyyy')} 
                    onValueChange={(value) => updateSetting('system.dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select 
                    value={getSettingValue('system.currency', 'AOA')} 
                    onValueChange={(value) => updateSetting('system.currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AOA">Kwanza Angolano (Kz)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-medium">Tamanho da Fonte do Sistema</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajuste o tamanho das fontes em todo o sistema. Use Ctrl+/Cmd+ para aumentar, Ctrl+/Cmd- para diminuir.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{currentConfig.label}</p>
                      <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decreaseFontSize}
                        disabled={!canDecrease}
                        title="Diminuir fonte (Ctrl+-)"
                      >
                        <span className="text-lg">A</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetFontSize}
                        size="sm"
                        title="Tamanho padrão (Ctrl+0)"
                      >
                        Padrão
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={increaseFontSize}
                        disabled={!canIncrease}
                        title="Aumentar fonte (Ctrl++)"
                      >
                        <span className="text-xl font-bold">A</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                    {fontSizeOptions.map((option) => (
                      <Button
                        key={option.scale}
                        variant={currentFontSize === option.scale ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFontSize(option.scale)}
                        className="flex flex-col h-auto py-3"
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs opacity-75">{Math.round(option.multiplier * 100)}%</span>
                      </Button>
                    ))}
                  </div>
                  <FontSizeDemo />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Configurações de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações por email para eventos importantes
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('notifications.email', 'true') === 'true'}
                  onCheckedChange={(checked) => updateSetting('notifications.email', checked.toString())}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações por SMS para situações urgentes
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('notifications.sms', 'false') === 'true'}
                  onCheckedChange={(checked) => updateSetting('notifications.sms', checked.toString())}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Relatórios Semanais</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber relatórios automatizados semanalmente
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('notifications.weekly_reports', 'true') === 'true'}
                  onCheckedChange={(checked) => updateSetting('notifications.weekly_reports', checked.toString())}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar 2FA para contas administrativas
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('security.two_factor', 'false') === 'true'}
                  onCheckedChange={(checked) => updateSetting('security.two_factor', checked.toString())}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passwordExpiry">Expiração de Senha (dias)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={getSettingValue('security.password_expiry', '90')}
                    onChange={(e) => updateSetting('security.password_expiry', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={getSettingValue('security.session_timeout', '60')}
                    onChange={(e) => updateSetting('security.session_timeout', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="loginAttempts">Máximo de Tentativas de Login</Label>
                <Input
                  id="loginAttempts"
                  type="number"
                  value={getSettingValue('security.max_login_attempts', '3')}
                  onChange={(e) => updateSetting('security.max_login_attempts', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Settings */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Configurações Académicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academicYear">Ano Letivo</Label>
                  <Input
                    id="academicYear"
                    value={getSettingValue('academic.year', '2024/2025')}
                    onChange={(e) => updateSetting('academic.year', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gradingScale">Escala de Avaliação</Label>
                  <Select 
                    value={getSettingValue('academic.grading_scale', '0-20')} 
                    onValueChange={(value) => updateSetting('academic.grading_scale', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a escala" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-20">0-20 (Angola)</SelectItem>
                      <SelectItem value="0-100">0-100</SelectItem>
                      <SelectItem value="A-F">A-F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="semesterStart">Início do Semestre</Label>
                  <Input
                    id="semesterStart"
                    type="date"
                    value={getSettingValue('academic.semester_start', '2024-09-01')}
                    onChange={(e) => updateSetting('academic.semester_start', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="semesterEnd">Fim do Semestre</Label>
                  <Input
                    id="semesterEnd"
                    type="date"
                    value={getSettingValue('academic.semester_end', '2025-01-31')}
                    onChange={(e) => updateSetting('academic.semester_end', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="passGrade">Nota Mínima de Aprovação</Label>
                <Input
                  id="passGrade"
                  type="number"
                  value={getSettingValue('academic.pass_grade', '10')}
                  onChange={(e) => updateSetting('academic.pass_grade', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Settings */}
        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Configuração SMTP
                {smtpConfig?.isActive && (
                  <Badge variant="default" className="ml-2 bg-green-500">
                    Conectado
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {smtpLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">Servidor SMTP</Label>
                      <Input
                        id="smtpHost"
                        value={smtpConfig?.host || ''}
                        placeholder="smtp.gmail.com"
                        readOnly
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">Porta</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={smtpConfig?.port || ''}
                        placeholder="587"
                        readOnly
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="smtpUsername">Nome de Usuário</Label>
                    <Input
                      id="smtpUsername"
                      value={smtpConfig?.username || ''}
                      placeholder="seu-email@gmail.com"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Conexão Segura (SSL/TLS)</Label>
                      <p className="text-sm text-muted-foreground">
                        Usar encriptação para envio de emails
                      </p>
                    </div>
                    <Switch
                      checked={smtpConfig?.secure || false}
                      disabled
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={handleTestSmtp}
                      disabled={testingSmtp || !smtpConfig?.isActive}
                      variant="outline"
                    >
                      {testingSmtp ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Testar Configuração
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Enviar email de teste para verificar a configuração
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Gestão de Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar backup automático dos dados do sistema
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('backup.auto_enabled', 'true') === 'true'}
                  onCheckedChange={(checked) => updateSetting('backup.auto_enabled', checked.toString())}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backupFrequency">Frequência do Backup</Label>
                  <Select 
                    value={getSettingValue('backup.frequency', 'daily')} 
                    onValueChange={(value) => updateSetting('backup.frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hora em hora</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="backupRetention">Retenção (dias)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={getSettingValue('backup.retention_days', '30')}
                    onChange={(e) => updateSetting('backup.retention_days', e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Criar Backup Manual</Label>
                  <Button 
                    onClick={handleCreateBackup}
                    disabled={createBackupMutation.isPending}
                    variant="outline"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Criar Backup Agora
                  </Button>
                </div>
                {backupProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso do backup</span>
                      <span>{backupProgress}%</span>
                    </div>
                    <Progress value={backupProgress} className="h-2" />
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-3">
                <Label>Backups Recentes</Label>
                {backupsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backups.slice(0, 5).map((backup: any) => (
                      <div key={backup.filename} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{backup.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(backup.createdAt).toLocaleString('pt-AO')} • {(backup.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {backups.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum backup encontrado
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}