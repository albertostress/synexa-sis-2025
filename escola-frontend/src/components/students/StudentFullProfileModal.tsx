import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  X,
  User,
  GraduationCap,
  FileText,
  UserCheck,
  CreditCard,
  BarChart3,
  Edit,
  Download,
  Eye,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Camera,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Save,
  History,
  Receipt,
  BookOpen,
  Printer,
  Settings
} from 'lucide-react';

// Tipos auxiliares
interface StudentFullProfile {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  gender: 'MASCULINO' | 'FEMININO';
  birthDate: string;
  phone: string;
  biNumber?: string;
  status: 'ATIVO' | 'TRANSFERIDO' | 'DESISTENTE' | 'CONCLUIDO';
  academicYear: string;
  province: string;
  municipality: string;
  country: string;
  
  // URLs de documentos
  profilePhotoUrl?: string;
  idDocumentUrl?: string;
  studentCardUrl?: string;
  
  // Encarregado
  guardianName: string;
  guardianRelationship?: string;
  guardianId?: string;
  guardianPhone: string;
  guardianAddress?: string;
  parentEmail: string;
  parentPhone: string;
  
  // Relacionamentos
  schoolClass?: {
    id: string;
    name: string;
    shift: 'MORNING' | 'AFTERNOON' | 'EVENING';
  };
  
  // Dados fictícios para demonstração (viriam do backend)
  enrollmentStatus?: 'MATRICULADO' | 'NAO_MATRICULADO';
  lastPaymentDate?: string;
  pendingAmount?: number;
  lastGradeReport?: string;
  averageGrade?: number;
  
  // Dados adicionais para as seções expandidas
  timeline?: Array<{
    id: string;
    date: string;
    event: string;
    description: string;
    type: 'academic' | 'administrative' | 'disciplinary';
  }>;
  reportCards?: Array<{
    id: string;
    period: string;
    year: string;
    subjects: Array<{
      name: string;
      grade: number;
      status: 'APPROVED' | 'FAILED' | 'PENDING';
    }>;
    averageGrade: number;
  }>;
  invoices?: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    dueDate: string;
  }>;
}

// Tipos para as views dinâmicas
type ModalView = 'default' | 'edit' | 'declaration' | 'history' | 'boletins' | 'financeiro';

interface StudentFullProfileModalProps {
  student: StudentFullProfile;
  onClose: () => void;
  isOpen: boolean;
  onSave?: (student: StudentFullProfile) => void;
}

// Função para calcular idade
const calcularIdade = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Componente de seção reutilizável
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// Componente para edição de dados
const EditStudentForm: React.FC<{
  student: StudentFullProfile;
  onSave: (student: StudentFullProfile) => void;
  onCancel: () => void;
}> = ({ student, onSave, onCancel }) => {
  const [formData, setFormData] = useState(student);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5 text-blue-600" />
          Editar Dados do Estudante
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Primeiro Nome</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Último Nome</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="biNumber">Número do BI</Label>
              <Input
                id="biNumber"
                value={formData.biNumber || ''}
                onChange={(e) => setFormData({ ...formData, biNumber: e.target.value })}
                placeholder="123456789LA041"
              />
            </div>
            <div>
              <Label htmlFor="guardianPhone">Telefone do Encarregado</Label>
              <Input
                id="guardianPhone"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="province">Província</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="municipality">Município</Label>
              <Input
                id="municipality"
                value={formData.municipality}
                onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Alterações
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Componente para geração de declaração
const DeclarationGenerator: React.FC<{
  student: StudentFullProfile;
}> = ({ student }) => {
  const [declarationType, setDeclarationType] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Gerar Declaração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="declarationType">Tipo de Declaração</Label>
          <Select value={declarationType} onValueChange={setDeclarationType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de declaração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enrollment">Declaração de Matrícula</SelectItem>
              <SelectItem value="attendance">Declaração de Frequência</SelectItem>
              <SelectItem value="conduct">Declaração de Conduta</SelectItem>
              <SelectItem value="academic">Declaração Académica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="purpose">Finalidade</Label>
          <Textarea
            id="purpose"
            placeholder="Descreva a finalidade da declaração..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>
        {declarationType && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-2">Preview da Declaração:</h4>
            <div className="text-sm space-y-2">
              <p><strong>Estudante:</strong> {student.firstName} {student.lastName}</p>
              <p><strong>Número:</strong> {student.studentNumber}</p>
              <p><strong>Classe:</strong> {student.schoolClass?.name || 'Não atribuída'}</p>
              <p><strong>Ano Letivo:</strong> {student.academicYear}</p>
              <p><strong>Finalidade:</strong> {purpose || 'Não especificada'}</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button 
            disabled={!declarationType || !purpose}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Gerar PDF
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Visualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para histórico escolar
const StudentHistory: React.FC<{
  timeline?: StudentFullProfile['timeline'];
}> = ({ timeline = [] }) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600" />
          Histórico Escolar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum evento registado no histórico.
          </p>
        ) : (
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={event.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{event.event}</span>
                    <Badge variant={event.type === 'academic' ? 'default' : event.type === 'administrative' ? 'secondary' : 'destructive'}>
                      {event.type === 'academic' ? 'Académico' : event.type === 'administrative' ? 'Administrativo' : 'Disciplinar'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente para boletins
const StudentReportCards: React.FC<{
  reportCards?: StudentFullProfile['reportCards'];
}> = ({ reportCards = [] }) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Boletins Escolares
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reportCards.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum boletim disponível.
          </p>
        ) : (
          <div className="space-y-4">
            {reportCards.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{report.period} - {report.year}</h4>
                    <p className="text-sm text-muted-foreground">
                      Média: <span className="font-bold text-lg">{report.averageGrade.toFixed(1)}</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {report.subjects.map((subject, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                      <span className="text-sm">{subject.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{subject.grade.toFixed(1)}</span>
                        <Badge 
                          variant={subject.status === 'APPROVED' ? 'default' : subject.status === 'FAILED' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {subject.status === 'APPROVED' ? 'Aprovado' : subject.status === 'FAILED' ? 'Reprovado' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente para situação financeira
const StudentFinancialStatus: React.FC<{
  invoices?: StudentFullProfile['invoices'];
}> = ({ invoices = [] }) => {
  const totalPending = invoices
    .filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-orange-600" />
          Situação Financeira Detalhada
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalPending > 0 && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Total Pendente: <span className="text-lg font-bold">{totalPending.toLocaleString('pt-PT')} AOA</span>
            </p>
          </div>
        )}
        
        {invoices.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma fatura registada.
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{invoice.description}</p>
                  <p className="text-sm text-muted-foreground">
                    Data: {new Date(invoice.date).toLocaleDateString('pt-PT')} |
                    Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{invoice.amount.toLocaleString('pt-PT')} AOA</p>
                  <Badge 
                    variant={invoice.status === 'PAID' ? 'default' : invoice.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {invoice.status === 'PAID' ? 'Pago' : invoice.status === 'OVERDUE' ? 'Em Atraso' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente principal
export const StudentFullProfileModal: React.FC<StudentFullProfileModalProps> = ({
  student,
  onClose,
  isOpen,
  onSave,
}) => {
  const [view, setView] = useState<ModalView>('default');
  const age = calcularIdade(student.birthDate);
  const isEnrolled = student.enrollmentStatus === 'MATRICULADO';
  const hasPendingPayments = student.pendingAmount && student.pendingAmount > 0;

  const handleSaveStudent = (updatedStudent: StudentFullProfile) => {
    onSave?.(updatedStudent);
    setView('default');
  };

  const handleCloseModal = () => {
    setView('default');
    onClose();
  };

  // Dados mock para demonstração (normalmente viriam do backend)
  const mockTimeline = student.timeline || [
    {
      id: '1',
      date: '2024-01-15',
      event: 'Matrícula Realizada',
      description: 'Estudante matriculado para o ano letivo 2024',
      type: 'administrative' as const
    },
    {
      id: '2',
      date: '2024-03-20',
      event: 'Primeira Avaliação',
      description: 'Completou a primeira avaliação trimestral',
      type: 'academic' as const
    }
  ];

  const mockReportCards = student.reportCards || [
    {
      id: '1',
      period: '1º Trimestre',
      year: '2024',
      averageGrade: 14.5,
      subjects: [
        { name: 'Matemática', grade: 15.2, status: 'APPROVED' as const },
        { name: 'Português', grade: 13.8, status: 'APPROVED' as const },
        { name: 'Ciências', grade: 14.5, status: 'APPROVED' as const }
      ]
    }
  ];

  const mockInvoices = student.invoices || [
    {
      id: '1',
      date: '2024-01-15',
      description: 'Propina - Janeiro 2024',
      amount: 25000,
      status: 'PAID' as const,
      dueDate: '2024-01-31'
    },
    {
      id: '2',
      date: '2024-02-15',
      description: 'Propina - Fevereiro 2024',
      amount: 25000,
      status: 'PENDING' as const,
      dueDate: '2024-02-28'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden">
        
        {/* Cabeçalho fixo */}
        <div className="shrink-0 sticky top-0 z-20 bg-white dark:bg-gray-950 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                <AvatarImage src={student.profilePhotoUrl} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
                  {student.firstName[0]}{student.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
                <p className="text-muted-foreground text-sm">
                  Nº {student.studentNumber} · {student.gender} · {age} anos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                {student.status === 'ATIVO' ? '✅ Ativo' : '❌ Inativo'}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCloseModal} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo principal com scroll */}
        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2. Situação Académica */}
              <Section
                icon={<GraduationCap className="w-5 h-5 text-blue-600" />}
                title="Situação Académica"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ano Letivo</label>
                      <p className="font-semibold">{student.academicYear}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Classe</label>
                      <p className="font-semibold">
                        {student.schoolClass?.name || 'Não atribuída'}
                      </p>
                    </div>
                  </div>
                  
                  {student.schoolClass && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Turno</label>
                      <p className="font-semibold">
                        {student.schoolClass.shift === 'MORNING' ? 'Manhã' :
                         student.schoolClass.shift === 'AFTERNOON' ? 'Tarde' : 'Noite'}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                    <p className="font-semibold">
                      {new Date(student.birthDate).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleViewChange('history')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Histórico Académico
                  </Button>
                </div>
              </Section>

              {/* 3. Documentos */}
              <Section
                icon={<FileText className="w-5 h-5 text-green-600" />}
                title="Documentos"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {/* Foto */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Foto do Estudante</p>
                          <p className="text-sm text-muted-foreground">
                            {student.profilePhotoUrl ? 'Disponível' : 'Não enviado'}
                          </p>
                        </div>
                      </div>
                      {student.profilePhotoUrl && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* BI */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IdCard className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Bilhete de Identidade</p>
                          <p className="text-sm text-muted-foreground">
                            {student.idDocumentUrl ? 'Disponível' : 'Não enviado'}
                          </p>
                        </div>
                      </div>
                      {student.idDocumentUrl && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Cartão */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Cartão de Estudante</p>
                          <p className="text-sm text-muted-foreground">
                            {student.studentCardUrl ? 'Disponível' : 'Não enviado'}
                          </p>
                        </div>
                      </div>
                      {student.studentCardUrl && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 4. Encarregado de Educação */}
              <Section
                icon={<UserCheck className="w-5 h-5 text-purple-600" />}
                title="Encarregado de Educação"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p className="font-semibold">{student.guardianName}</p>
                  </div>
                  
                  {student.guardianRelationship && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Parentesco</label>
                      <p className="font-semibold">{student.guardianRelationship}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contacto Principal</label>
                    <p className="font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {student.guardianPhone}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {student.parentEmail}
                    </p>
                  </div>
                  
                  {student.guardianId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">BI do Encarregado</label>
                      <p className="font-semibold">{student.guardianId}</p>
                    </div>
                  )}
                  
                  {student.guardianAddress && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Morada</label>
                      <p className="font-semibold flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        {student.guardianAddress}
                      </p>
                    </div>
                  )}
                </div>
              </Section>

              {/* 5. Situação Financeira */}
              <Section
                icon={<CreditCard className="w-5 h-5 text-orange-600" />}
                title="Situação Financeira"
              >
                <div className="space-y-4">
                  {student.lastPaymentDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Último Pagamento</label>
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(student.lastPaymentDate).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  )}
                  
                  {hasPendingPayments && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valor Pendente</label>
                      <p className="font-bold text-red-600 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        {student.pendingAmount?.toLocaleString('pt-PT')} AOA
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewChange('financeiro')}
                      className={cn(view === 'financeiro' && 'bg-orange-50 border-orange-200 text-orange-700')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Faturas
                    </Button>
                    
                    {hasPendingPayments && (
                      <Button variant="outline" size="sm" className="text-orange-600">
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Lembrete
                      </Button>
                    )}
                  </div>
                </div>
              </Section>
            </div>

            {/* 6. Desempenho Académico */}
            <Section
              icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
              title="Desempenho Académico"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {student.lastGradeReport && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Último Boletim</label>
                      <p className="font-semibold">{student.lastGradeReport}</p>
                    </div>
                  )}
                  
                  {student.averageGrade && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Média Geral</label>
                      <p className="font-bold text-2xl text-green-600">{student.averageGrade.toFixed(1)}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewChange('boletins')}
                    className={cn(view === 'boletins' && 'bg-blue-50 border-blue-200 text-blue-700')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Boletins
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Relatório de Desempenho
                  </Button>
                </div>
              </div>
            </Section>

          {/* SEÇÕES DINÂMICAS */}
          {view === 'edit' && (
            <EditStudentForm
              student={student}
              onSave={handleSaveStudent}
              onCancel={() => setView('default')}
            />
          )}
          
          {view === 'declaration' && (
            <DeclarationGenerator student={student} />
          )}
          
          {view === 'history' && (
            <StudentHistory timeline={mockTimeline} />
          )}
          
          {view === 'boletins' && (
            <StudentReportCards reportCards={mockReportCards} />
          )}
          
          {view === 'financeiro' && (
            <StudentFinancialStatus invoices={mockInvoices} />
          )}

        </div>

        {/* Rodapé fixo com botões */}
        <div className="shrink-0 sticky bottom-0 z-20 bg-white dark:bg-gray-950 px-6 py-3 border-t">
          <div className="flex flex-wrap gap-3">
            <Button 
              variant={view === 'edit' ? 'default' : 'secondary'}
              onClick={() => setView(view === 'edit' ? 'default' : 'edit')}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar Dados
            </Button>
            
            <Button 
              variant={view === 'declaration' ? 'default' : 'secondary'}
              onClick={() => setView(view === 'declaration' ? 'default' : 'declaration')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Gerar Declaração
            </Button>
            
            <Button 
              variant={view === 'history' ? 'default' : 'outline'}
              onClick={() => setView(view === 'history' ? 'default' : 'history')}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Histórico
            </Button>
            
            <Button 
              variant={view === 'boletins' ? 'default' : 'outline'}
              onClick={() => setView(view === 'boletins' ? 'default' : 'boletins')}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Ver Boletins
            </Button>
            
            <Button 
              variant={view === 'financeiro' ? 'default' : 'outline'}
              onClick={() => setView(view === 'financeiro' ? 'default' : 'financeiro')}
              className="flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Ver Faturas
            </Button>
            
            {hasPendingPayments && (
              <Button variant="outline" className="flex items-center gap-2 text-orange-600 border-orange-200">
                <Send className="w-4 h-4" />
                Lembrete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentFullProfileModal;