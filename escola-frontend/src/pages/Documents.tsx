import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Award,
  ScrollText,
  BookOpen,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  User,
  ChevronRight,
  ArrowLeft,
  Server,
  Activity,
  HardDrive,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { documentsAPI, studentsAPI, reportsAPI, classesAPI } from '@/lib/api';

// Tipos de documento disponíveis
const documentTypes = [
  { 
    id: 'certificado', 
    title: 'Certificado de Conclusão', 
    description: 'Certificado oficial para alunos aprovados',
    icon: Award,
    color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
  },
  { 
    id: 'declaracao', 
    title: 'Declaração de Matrícula', 
    description: 'Confirmação de matrícula ativa do aluno',
    icon: ScrollText,
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
  },
  { 
    id: 'historico', 
    title: 'Histórico Escolar', 
    description: 'Histórico completo de notas e aprovações',
    icon: BookOpen,
    color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
  },
];

export default function Documents() {
  const { user, hasRole } = useAuth();
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const { toast } = useToast();

  // Inicializar ano atual
  useEffect(() => {
    setSelectedYear(new Date().getFullYear().toString());
  }, []);

  // Cleanup do preview URL quando componente desmontar
  useEffect(() => {
    return () => {
      if (previewPdf) {
        URL.revokeObjectURL(previewPdf);
      }
    };
  }, [previewPdf]);

  // Buscar turmas
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await classesAPI.getAll();
      return response || [];
    },
  });

  // Buscar alunos da turma selecionada
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['class-students', selectedClass, selectedYear],
    queryFn: async () => {
      if (!selectedClass || !selectedYear) return [];
      const response = await reportsAPI.getStudentsByClass(selectedClass, parseInt(selectedYear));
      return response || [];
    },
    enabled: !!selectedClass && !!selectedYear,
  });

  // Buscar status do sistema PDF
  const { data: pdfHealth, refetch: refetchPdfHealth } = useQuery({
    queryKey: ['pdf-health'],
    queryFn: documentsAPI.getPdfHealth,
    refetchInterval: 30000,
  });

  // Mutation para gerar PDFs
  const generatePdfMutation = useMutation({
    mutationFn: async (params: {
      type: string;
      studentId: string;
      year: string;
      term?: string;
      purpose?: string;
    }) => {
      setIsGenerating(true);
      
      try {
        let blob: Blob;
        let filename: string;
        
        switch (params.type) {
          case 'certificado':
            blob = await documentsAPI.generateCertificatePdf(params.studentId, parseInt(params.year));
            filename = `certificado_${params.studentId}_${params.year}.pdf`;
            break;
            
          case 'declaracao':
            if (!params.purpose) throw new Error('Finalidade é obrigatória para declarações');
            blob = await documentsAPI.generateDeclarationPdf(params.studentId, parseInt(params.year), params.purpose);
            filename = `declaracao_${params.studentId}_${params.year}.pdf`;
            break;
            
          case 'historico':
            blob = await documentsAPI.generateTranscriptPdf(params.studentId);
            filename = `historico_${params.studentId}.pdf`;
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
    onSuccess: (data, variables) => {
      const student = students.find(s => s.id === variables.studentId);
      const docType = documentTypes.find(d => d.id === variables.type);
      
      toast({
        title: 'Documento Gerado!',
        description: `${docType?.title} de ${student?.firstName} ${student?.lastName} gerado com sucesso.`,
      });
      
      // Reset form
      setSelectedDocument(null);
      setSelectedStudent('');
      setPurpose('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Gerar Documento',
        description: error.message || error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Mutation para pré-visualizar PDFs
  const previewPdfMutation = useMutation({
    mutationFn: async (params: {
      type: string;
      studentId: string;
      year: string;
      purpose?: string;
    }) => {
      setIsPreviewing(true);
      
      try {
        let response;
        
        switch (params.type) {
          case 'certificado':
            response = await documentsAPI.generateCertificateWithPdf(params.studentId, parseInt(params.year));
            break;
            
          case 'declaracao':
            if (!params.purpose) throw new Error('Finalidade é obrigatória para declarações');
            response = await documentsAPI.generateDeclarationWithPdf(params.studentId, parseInt(params.year), params.purpose);
            break;
            
          case 'historico':
            response = await documentsAPI.generateTranscriptWithPdf(params.studentId);
            break;
            
          default:
            throw new Error('Tipo de documento não reconhecido');
        }
        
        // Se a resposta tem um PDF em base64, converter para blob URL
        if (response.pdf) {
          const base64 = response.pdf.replace(/^data:application\/pdf;base64,/, '');
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          return url;
        }
        
        throw new Error('PDF não encontrado na resposta');
      } finally {
        setIsPreviewing(false);
      }
    },
    onSuccess: (pdfUrl) => {
      setPreviewPdf(pdfUrl);
      setIsPreviewOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Pré-visualizar',
        description: error.message || 'Erro ao gerar pré-visualização do documento',
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

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocument(docId);
    // Reset dependent fields
    setSelectedClass('');
    setSelectedStudent('');
    setPurpose('');
  };

  const handleBackToSelection = () => {
    setSelectedDocument(null);
    setSelectedClass('');
    setSelectedStudent('');
    setPurpose('');
  };

  const canGenerateDocument = () => {
    if (!selectedStudent || !selectedYear) return false;
    if (selectedDocument === 'declaracao' && !purpose.trim()) return false;
    return true;
  };

  const handleGenerateDocument = () => {
    generatePdfMutation.mutate({
      type: selectedDocument!,
      studentId: selectedStudent,
      year: selectedYear,
      purpose: purpose,
    });
  };

  const handlePreviewDocument = () => {
    previewPdfMutation.mutate({
      type: selectedDocument!,
      studentId: selectedStudent,
      year: selectedYear,
      purpose: purpose,
    });
  };

  const handleDownloadFromPreview = () => {
    handleGenerateDocument();
    setIsPreviewOpen(false);
    if (previewPdf) {
      URL.revokeObjectURL(previewPdf);
      setPreviewPdf(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documentos Oficiais</h1>
          <p className="text-muted-foreground">
            Sistema de geração de documentos escolares para o mercado angolano
          </p>
        </div>
        
        {selectedDocument && (
          <Button variant="outline" onClick={handleBackToSelection}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        )}
      </div>

      {/* Status do Sistema PDF */}
      {pdfHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {pdfHealth.status === 'ok' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span>Status do Sistema de Geração de PDF</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchPdfHealth()}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={pdfHealth.status === 'ok' ? 'default' : 'destructive'}>
                    {pdfHealth.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Browser</p>
                  <Badge variant={pdfHealth.browser ? 'default' : 'secondary'}>
                    {pdfHealth.browser ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Cache</p>
                  <p className="text-sm text-muted-foreground">
                    {pdfHealth.cache?.size || 0}/{pdfHealth.cache?.maxSize || 100}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Modo</p>
                  <Badge variant="outline">
                    {pdfHealth.mode || 'Development'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seleção de Documento ou Formulário de Geração */}
      {!selectedDocument ? (
        /* Grid de Cartões de Documentos */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {documentTypes.map((docType) => {
            const Icon = docType.icon;
            return (
              <Card 
                key={docType.id} 
                className={`cursor-pointer transition-all duration-200 border-2 ${docType.color}`}
                onClick={() => handleDocumentSelect(docType.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-lg bg-white/50">
                      <Icon className="w-8 h-8" />
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-50" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardTitle className="text-lg mb-2">{docType.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {docType.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-4">
                  <div className="flex items-center justify-between w-full text-sm font-medium">
                    <span>Selecionar</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Formulário de Geração de Documento */
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white rounded-xl shadow-md p-6">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center space-x-2">
              {(() => {
                const docType = documentTypes.find(d => d.id === selectedDocument);
                const Icon = docType?.icon || FileText;
                return (
                  <>
                    <Icon className="w-6 h-6" />
                    <span>{docType?.title}</span>
                  </>
                );
              })()}
            </CardTitle>
            <CardDescription>
              {documentTypes.find(d => d.id === selectedDocument)?.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Filtros Dinâmicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ano Letivo */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Ano Letivo</span>
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Turma */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Turma</span>
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((schoolClass: any) => (
                      <SelectItem key={schoolClass.id} value={schoolClass.id}>
                        {schoolClass.name} - {schoolClass.academicYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aluno */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Aluno</span>
                </label>
                <Select 
                  value={selectedStudent} 
                  onValueChange={setSelectedStudent}
                  disabled={!selectedClass}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !selectedClass 
                          ? "Selecione uma turma primeiro" 
                          : loadingStudents 
                            ? "Carregando alunos..." 
                            : "Selecione o aluno"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} - {student.studentNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>


            {/* Finalidade (apenas para declarações) */}
            {selectedDocument === 'declaracao' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Finalidade da Declaração</label>
                <Textarea
                  placeholder="Ex: Para fins de bolsa de estudos, transferência escolar, etc."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Alertas de Validação */}
            {selectedDocument === 'declaracao' && !purpose.trim() && selectedStudent && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Informe a finalidade da declaração antes de gerar o documento.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="pt-6">
            <div className="flex w-full justify-between">
              <Button variant="outline" onClick={handleBackToSelection}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar à Seleção
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="secondary"
                  onClick={handlePreviewDocument}
                  disabled={!canGenerateDocument() || isPreviewing}
                >
                  {isPreviewing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Pré-visualizar
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleGenerateDocument}
                  disabled={!canGenerateDocument() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Gerar PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
        </div>
      )}

      {/* Modal de Pré-visualização */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => {
        setIsPreviewOpen(open);
        if (!open && previewPdf) {
          URL.revokeObjectURL(previewPdf);
          setPreviewPdf(null);
        }
      }}>
        <DialogContent className="max-w-4xl h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Pré-visualização do Documento</DialogTitle>
            <DialogDescription>
              Este é um rascunho. O PDF oficial será gerado ao confirmar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 px-6 pb-6 overflow-hidden">
            {previewPdf ? (
              <iframe 
                src={previewPdf}
                className="w-full h-full rounded-lg border"
                style={{ minHeight: '600px' }}
                title="Pré-visualização do PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="px-6 pb-6 flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewOpen(false)}
            >
              Fechar
            </Button>
            <Button 
              onClick={handleDownloadFromPreview}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}