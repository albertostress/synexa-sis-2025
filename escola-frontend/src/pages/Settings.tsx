
import { useState } from 'react';
import { Save, Mail, Shield, Database, Bell, Palette, Globe, Users, School } from 'lucide-react';
import UsersModule from './Users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    // School Settings
    schoolName: 'Escola Secundária Synexa',
    schoolAddress: 'Rua da Educação, 123, Luanda',
    schoolPhone: '+244 222 123 456',
    schoolEmail: 'geral@synexa.ao',
    schoolWebsite: 'www.synexa.ao',
    
    // System Settings
    language: 'pt-AO',
    timezone: 'Africa/Luanda',
    dateFormat: 'dd/mm/yyyy',
    currency: 'AOA',
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyReports: true,
    
    // Security Settings
    twoFactorAuth: false,
    passwordExpiry: 90,
    sessionTimeout: 60,
    loginAttempts: 3,
    
    // Academic Settings
    academicYear: '2024/2025',
    semesterStart: '2024-09-01',
    semesterEnd: '2025-01-31',
    gradingScale: '0-20',
    passGrade: 10,
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
  });

  const { toast } = useToast();

  const handleSave = () => {
    // Simulate saving settings
    toast({
      title: "Configurações guardadas",
      description: "As configurações foram actualizadas com sucesso."
    });
  };

  const handleReset = () => {
    // Reset to default values
    toast({
      title: "Configurações repostas",
      description: "As configurações foram repostas para os valores padrão."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerir configurações do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Repor Padrões
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Alterações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="school" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="school">Escola</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="academic">Académico</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="users">Utilizadores</TabsTrigger>
        </TabsList>

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
                    value={settings.schoolName}
                    onChange={(e) => setSettings({...settings, schoolName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="schoolPhone">Telefone</Label>
                  <Input
                    id="schoolPhone"
                    value={settings.schoolPhone}
                    onChange={(e) => setSettings({...settings, schoolPhone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="schoolAddress">Morada</Label>
                <Textarea
                  id="schoolAddress"
                  value={settings.schoolAddress}
                  onChange={(e) => setSettings({...settings, schoolAddress: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schoolEmail">Email</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    value={settings.schoolEmail}
                    onChange={(e) => setSettings({...settings, schoolEmail: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="schoolWebsite">Website</Label>
                  <Input
                    id="schoolWebsite"
                    value={settings.schoolWebsite}
                    onChange={(e) => setSettings({...settings, schoolWebsite: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                  <Select value={settings.language} onValueChange={(value) => setSettings({...settings, language: value})}>
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
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({...settings, timezone: value})}>
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
                  <Select value={settings.dateFormat} onValueChange={(value) => setSettings({...settings, dateFormat: value})}>
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
                  <Select value={settings.currency} onValueChange={(value) => setSettings({...settings, currency: value})}>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações por email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações por SMS
                  </p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações push no navegador
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Relatórios Semanais</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber relatórios semanais por email
                  </p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => setSettings({...settings, weeklyReports: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar autenticação de dois fatores para maior segurança
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passwordExpiry">Expiração de Senha (dias)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => setSettings({...settings, passwordExpiry: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="loginAttempts">Tentativas de Login</Label>
                <Input
                  id="loginAttempts"
                  type="number"
                  value={settings.loginAttempts}
                  onChange={(e) => setSettings({...settings, loginAttempts: parseInt(e.target.value)})}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Número máximo de tentativas de login antes de bloquear a conta
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                    value={settings.academicYear}
                    onChange={(e) => setSettings({...settings, academicYear: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="gradingScale">Escala de Avaliação</Label>
                  <Select value={settings.gradingScale} onValueChange={(value) => setSettings({...settings, gradingScale: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a escala" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-20">0-20</SelectItem>
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
                    value={settings.semesterStart}
                    onChange={(e) => setSettings({...settings, semesterStart: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="semesterEnd">Fim do Semestre</Label>
                  <Input
                    id="semesterEnd"
                    type="date"
                    value={settings.semesterEnd}
                    onChange={(e) => setSettings({...settings, semesterEnd: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="passGrade">Nota de Aprovação</Label>
                <Input
                  id="passGrade"
                  type="number"
                  value={settings.passGrade}
                  onChange={(e) => setSettings({...settings, passGrade: parseInt(e.target.value)})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Backup e Restauro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar backup automático dos dados
                  </p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backupFrequency">Frequência do Backup</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => setSettings({...settings, backupFrequency: value})}>
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
                    value={settings.backupRetention}
                    onChange={(e) => setSettings({...settings, backupRetention: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  Fazer Backup Agora
                </Button>
                <Button variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  Restaurar Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Gestão de Utilizadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UsersModule />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
