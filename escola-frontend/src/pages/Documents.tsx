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
  Calendar,
  Users,
  User,
  ChevronRight,
  ArrowLeft,
  Eye,
  Info,
  Clock,
  MessageCircle,
  Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { documentsAPI, studentsAPI, reportsAPI, classesAPI } from '@/lib/api';

// Tipos de documento disponíveis - otimizado para contexto educacional angolano
const documentTypes = [
  { 
    id: 'certificado', 
    title: 'Certificado de Conclusão', 
    description: 'Documento oficial que comprova a conclusão do curso escolar pelo estudante',
    icon: Award,
    color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300',
    context: 'Ideal para: Ingresso no ensino superior, processos de emprego, validação académica'
  },
  { 
    id: 'declaracao', 
    title: 'Declaração de Matrícula', 
    description: 'Comprovativo oficial de que o estudante está matriculado e frequenta as aulas',
    icon: ScrollText,
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300',
    context: 'Ideal para: Bolsas de estudo, descontos em transporte, processos oficiais'
  },
  { 
    id: 'historico', 
    title: 'Histórico Escolar', 
    description: 'Registo completo das notas e aprovações do estudante durante todo o percurso escolar',
    icon: BookOpen,
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300',
    context: 'Ideal para: Transferências escolares, candidaturas ao ensino superior, arquivo pessoal'
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho Profissional Desktop-First */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  Documentos Oficiais
                </h1>
                <p className="text-slate-600 font-medium">
                  Ministério da Educação | República de Angola
                </p>
              </div>
            </div>
            
            <p className="text-slate-700 leading-relaxed max-w-3xl mb-4">
              Sistema oficial para emissão de documentos escolares em conformidade com as normas 
              do Ministério da Educação de Angola. Todos os documentos possuem validade legal e 
              podem ser utilizados em processos oficiais.
            </p>
            
            {/* Indicadores de Status Profissionais */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-700 bg-green-100 px-3 py-1 rounded-md">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Sistema Certificado</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-700 bg-blue-100 px-3 py-1 rounded-md">
                <Server className="w-4 h-4" />
                <span className="text-sm font-medium">Conexão Segura</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-700 bg-purple-100 px-3 py-1 rounded-md">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">Padrão ME-Angola</span>
              </div>
            </div>
          </div>
          
          {selectedDocument && (
            <Button 
              variant="outline" 
              onClick={handleBackToSelection}
              className="flex items-center space-x-2 px-4 py-2 border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Seleção</span>
            </Button>
          )}
        </div>
      </div>


      {/* Seleção de Documento ou Formulário de Geração */}
      {!selectedDocument ? (
        <div className="space-y-6">
          {/* Instruções Profissionais para Desktop */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900">
                  Processo de Emissão de Documentos Oficiais
                </h3>
                <p className="text-blue-700 mt-1">
                  Siga os passos abaixo para emitir documentos com validade legal
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 bg-white/70 rounded-lg p-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <p className="font-medium text-slate-900">Selecionar Documento</p>
                  <p className="text-sm text-slate-600">Escolha o tipo necessário</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/70 rounded-lg p-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <p className="font-medium text-slate-900">Definir Critérios</p>
                  <p className="text-sm text-slate-600">Ano letivo e turma</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/70 rounded-lg p-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <p className="font-medium text-slate-900">Escolher Estudante</p>
                  <p className="text-sm text-slate-600">Selecionar beneficiário</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white/70 rounded-lg p-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div>
                  <p className="font-medium text-slate-900">Gerar PDF</p>
                  <p className="text-sm text-slate-600">Download imediato</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Grid de Documentos Otimizado para Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {documentTypes.map((docType) => {
              const Icon = docType.icon;
              return (
                <Card 
                  key={docType.id} 
                  className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-xl hover:scale-105 min-h-[280px] ${docType.color}`}
                  onClick={() => handleDocumentSelect(docType.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="p-4 rounded-xl bg-white/80 shadow-sm">
                        <Icon className="w-12 h-12" />
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-2">
                          Oficial
                        </Badge>
                        <div className="text-sm text-slate-600">
                          ME-Angola
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    <CardTitle className="text-xl leading-tight">
                      {docType.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {docType.description}
                    </CardDescription>
                    
                    <div className="bg-white/60 rounded-lg p-3 border border-white/80">
                      <p className="text-sm text-slate-700 font-medium mb-1">Casos de Uso:</p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {docType.context}
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-4">
                    <Button 
                      className="w-full h-12 text-base font-medium bg-white/80 hover:bg-white text-slate-800 border border-white/80 hover:shadow-md"
                      variant="outline"
                    >
                      <span>Selecionar Este Documento</span>
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* Formulário de Geração - Layout Desktop Otimizado */
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white rounded-xl shadow-lg border border-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-xl pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  {(() => {
                    const docType = documentTypes.find(d => d.id === selectedDocument);
                    const Icon = docType?.icon || FileText;
                    return (
                      <>
                        <div className="p-3 bg-blue-600 rounded-lg">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{docType?.title}</h2>
                          <p className="text-slate-600 font-normal mt-1">
                            Documento oficial com validade legal
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </CardTitle>
                
                <Badge variant="secondary" className="px-3 py-1">
                  ME-Angola Certificado
                </Badge>
              </div>
              
              <CardDescription className="text-base text-slate-700 mt-4 leading-relaxed">
                {documentTypes.find(d => d.id === selectedDocument)?.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
              {/* Formulário em Layout Desktop - 2 Colunas */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Dados para Geração do Documento</span>
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Ano Letivo */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center space-x-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Ano Lectivo</span>
                    </label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-11 text-base border-slate-300 focus:border-blue-500">
                        <SelectValue placeholder="Seleccione o ano lectivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            Ano Lectivo {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Turma */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center space-x-2 text-slate-700">
                      <Users className="w-4 h-4 text-green-600" />
                      <span>Turma</span>
                    </label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="h-11 text-base border-slate-300 focus:border-blue-500">
                        <SelectValue placeholder="Seleccione a turma" />
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

                  {/* Estudante */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center space-x-2 text-slate-700">
                      <User className="w-4 h-4 text-purple-600" />
                      <span>Estudante</span>
                    </label>
                    <Select 
                      value={selectedStudent} 
                      onValueChange={setSelectedStudent}
                      disabled={!selectedClass}
                    >
                      <SelectTrigger className="h-11 text-base border-slate-300 focus:border-blue-500">
                        <SelectValue 
                          placeholder={
                            !selectedClass 
                              ? "Primeiro seleccione uma turma" 
                              : loadingStudents 
                                ? "A carregar estudantes..." 
                                : "Seleccione o estudante"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} - Nº {student.studentNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Finalidade (apenas para declarações) */}
              {selectedDocument === 'declaracao' && (
                <div className="space-y-3 bg-slate-50 rounded-lg p-6">
                  <label className="text-sm font-semibold flex items-center space-x-2 text-slate-700">
                    <ScrollText className="w-4 h-4 text-amber-600" />
                    <span>Finalidade da Declaração</span>
                  </label>
                  <Textarea
                    placeholder="Especifique o motivo da solicitação da declaração (ex: Para fins de bolsa de estudos, transferência escolar, processo de visto, etc.)"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={4}
                    className="text-base border-slate-300 focus:border-blue-500"
                  />
                  <p className="text-sm text-slate-600">
                    Esta informação será incluída no documento oficial
                  </p>
                </div>
              )}

              {/* Informações Adicionais */}
              {selectedStudent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Info className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Informações do Documento</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-800">
                        <strong>Estudante:</strong> {students.find(s => s.id === selectedStudent)?.name}
                      </p>
                      <p className="text-blue-800">
                        <strong>Número:</strong> {students.find(s => s.id === selectedStudent)?.studentNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-800">
                        <strong>Ano Lectivo:</strong> {selectedYear}
                      </p>
                      <p className="text-blue-800">
                        <strong>Turma:</strong> {classes.find((c: any) => c.id === selectedClass)?.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Alertas de Validação */}
              {selectedDocument === 'declaracao' && !purpose.trim() && selectedStudent && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Atenção:</strong> É obrigatório especificar a finalidade da declaração antes de gerar o documento.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="bg-slate-50 rounded-b-xl p-8">
              <div className="flex w-full justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={handleBackToSelection}
                  className="px-6 py-3 h-12 text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar à Seleção
                </Button>
                
                <div className="flex gap-4">
                  <Button 
                    variant="secondary"
                    onClick={handlePreviewDocument}
                    disabled={!canGenerateDocument() || isPreviewing}
                    className="px-6 py-3 h-12 text-base"
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
                    className="px-8 py-3 h-12 text-base bg-blue-600 hover:bg-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Gerar Documento PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Modal de Pré-visualização - Otimizado para Desktop */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => {
        setIsPreviewOpen(open);
        if (!open && previewPdf) {
          URL.revokeObjectURL(previewPdf);
          setPreviewPdf(null);
        }
      }}>
        <DialogContent className="max-w-6xl h-[95vh] p-0 bg-slate-50">
          <DialogHeader className="bg-gradient-to-r from-slate-100 to-blue-100 px-8 pt-6 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    Pré-visualização do Documento
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 mt-1">
                    Revise o documento antes da geração oficial. Este é apenas um rascunho para verificação.
                  </DialogDescription>
                </div>
              </div>
              
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                Modo Pré-visualização
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="flex-1 p-8 overflow-hidden">
            {previewPdf ? (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden h-full">
                <iframe 
                  src={previewPdf}
                  className="w-full h-full"
                  style={{ minHeight: '700px' }}
                  title="Pré-visualização do PDF"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-white rounded-xl border border-slate-200">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-700">Preparando pré-visualização...</p>
                  <p className="text-slate-500 mt-2">Por favor, aguarde alguns segundos</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white border-t border-slate-200 px-8 py-6 flex justify-between items-center">
            <div className="text-sm text-slate-600">
              ⚠️ Esta é apenas uma pré-visualização. O documento oficial será gerado ao confirmar.
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setIsPreviewOpen(false)}
                className="px-6 py-3 h-12 text-base"
              >
                Fechar Pré-visualização
              </Button>
              <Button 
                onClick={handleDownloadFromPreview}
                disabled={isGenerating}
                className="px-8 py-3 h-12 text-base bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PDF Oficial...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Confirmar e Baixar PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}