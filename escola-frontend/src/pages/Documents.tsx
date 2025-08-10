import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download,
  RefreshCw,
  AlertCircle,
  Calendar,
  Users,
  User,
  ScrollText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { documentsAPI, enrollmentAPI, classesAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

// Tipos de documento disponíveis
const documentTypes = [
  { 
    id: 'declaracao', 
    title: 'Declaração de Matrícula',
    description: 'Comprovativo oficial de matrícula'
  },
  { 
    id: 'historico', 
    title: 'Histórico Escolar',
    description: 'Registo completo de notas'
  },
  { 
    id: 'certificado', 
    title: 'Certificado de Conclusão',
    description: 'Documento de conclusão do curso'
  },
];

export default function Documents() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados do formulário
  const [documentType, setDocumentType] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Verificar permissões e redirecionar se necessário
  useEffect(() => {
    if (user?.role === 'PROFESSOR') {
      navigate('/grades');
    }
  }, [user, navigate]);

  // Buscar anos letivos disponíveis
  const { data: availableYears = [] } = useQuery({
    queryKey: ['enrollment-years'],
    queryFn: async () => {
      const years = await enrollmentAPI.getAvailableYears();
      return years || [];
    },
  });

  // Definir ano atual quando anos estiverem disponíveis
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Buscar turmas do ano selecionado
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', selectedYear],
    queryFn: async () => {
      if (!selectedYear) return [];
      const response = await classesAPI.getAll();
      // Filtrar turmas pelo ano selecionado
      const yearNumber = parseInt(selectedYear.split('/')[0]);
      return response.filter((c: any) => c.year === yearNumber) || [];
    },
    enabled: !!selectedYear,
  });

  // Buscar alunos da turma selecionada
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const yearNumber = parseInt(selectedYear.split('/')[0]);
      // Usar o endpoint existente de report cards para buscar alunos
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/report-cards/class/${selectedClass}/students?year=${yearNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar alunos');
      const data = await response.json();
      return data || [];
    },
    enabled: !!selectedClass && !!selectedYear,
  });

  // Mutation para gerar PDF
  const generatePdfMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      try {
        let blob: Blob;
        let filename: string;
        const yearNumber = parseInt(selectedYear.split('/')[0]);
        
        switch (documentType) {
          case 'certificado':
            blob = await documentsAPI.generateCertificatePdf(selectedStudent, yearNumber);
            filename = `certificado_${selectedStudent}_${yearNumber}.pdf`;
            break;
            
          case 'declaracao':
            if (!purpose.trim()) throw new Error('Finalidade é obrigatória para declarações');
            blob = await documentsAPI.generateDeclarationPdf(selectedStudent, yearNumber, purpose);
            filename = `declaracao_${selectedStudent}_${yearNumber}.pdf`;
            break;
            
          case 'historico':
            blob = await documentsAPI.generateTranscriptPdf(selectedStudent);
            filename = `historico_${selectedStudent}.pdf`;
            break;
            
          default:
            throw new Error('Tipo de documento não reconhecido');
        }
        
        // Download do arquivo
        documentsAPI.downloadFile(blob, filename);
        
        return { success: true, filename };
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: () => {
      const student = students.find((s: any) => s.id === selectedStudent);
      const docType = documentTypes.find(d => d.id === documentType);
      
      toast({
        title: 'Documento Gerado!',
        description: `${docType?.title} de ${student?.name || student?.firstName + ' ' + student?.lastName} gerado com sucesso.`,
      });
      
      // Limpar formulário
      setDocumentType('');
      setSelectedClass('');
      setSelectedStudent('');
      setPurpose('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Gerar Documento',
        description: error.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Verificar permissões
  const canGenerate = hasRole('ADMIN') || hasRole('SECRETARIA') || hasRole('DIRETOR');

  if (!canGenerate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar o módulo de documentos.
          </p>
        </div>
      </div>
    );
  }

  const canGenerateDocument = () => {
    if (!documentType || !selectedStudent || !selectedYear) return false;
    if (documentType === 'declaracao' && !purpose.trim()) return false;
    return true;
  };

  const handleGenerateDocument = () => {
    generatePdfMutation.mutate();
  };

  // Resetar campos dependentes quando mudar seleções superiores
  useEffect(() => {
    setSelectedClass('');
    setSelectedStudent('');
  }, [selectedYear]);

  useEffect(() => {
    setSelectedStudent('');
  }, [selectedClass]);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-6 h-6" />
            Documentos Oficiais
          </CardTitle>
          <p className="text-muted-foreground mt-1">
            Gerar documentos oficiais da escola em formato PDF
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label htmlFor="documentType" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tipo de Documento
            </Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="documentType">
                <SelectValue placeholder="Selecione o tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div>
                      <div className="font-medium">{type.title}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ano Letivo */}
          <div className="space-y-2">
            <Label htmlFor="year" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Ano Letivo
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Selecione o ano letivo" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year: string) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Turma */}
          <div className="space-y-2">
            <Label htmlFor="class" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Turma
            </Label>
            <Select 
              value={selectedClass} 
              onValueChange={setSelectedClass}
              disabled={!selectedYear}
            >
              <SelectTrigger id="class">
                <SelectValue 
                  placeholder={
                    !selectedYear 
                      ? "Primeiro selecione um ano letivo" 
                      : "Selecione a turma"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {classes.map((schoolClass: any) => (
                  <SelectItem key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aluno */}
          <div className="space-y-2">
            <Label htmlFor="student" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Aluno
            </Label>
            <Select 
              value={selectedStudent} 
              onValueChange={setSelectedStudent}
              disabled={!selectedClass || loadingStudents}
            >
              <SelectTrigger id="student">
                <SelectValue 
                  placeholder={
                    !selectedClass 
                      ? "Primeiro selecione uma turma" 
                      : loadingStudents 
                        ? "Carregando alunos..." 
                        : "Selecione o aluno"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name || `${student.firstName} ${student.lastName}`} 
                    {student.studentNumber && ` - Nº ${student.studentNumber}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Finalidade (apenas para declarações) */}
          {documentType === 'declaracao' && (
            <div className="space-y-2">
              <Label htmlFor="purpose" className="flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                Finalidade da Declaração
              </Label>
              <Textarea
                id="purpose"
                placeholder="Ex: Para fins de bolsa de estudos, transferência escolar, processo de visto..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Alertas de validação */}
          {documentType === 'declaracao' && selectedStudent && !purpose.trim() && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                É obrigatório especificar a finalidade da declaração.
              </AlertDescription>
            </Alert>
          )}

          {/* Botão de Gerar */}
          <Button 
            onClick={handleGenerateDocument}
            disabled={!canGenerateDocument() || isGenerating}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Gerando Documento PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Gerar Documento PDF
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}