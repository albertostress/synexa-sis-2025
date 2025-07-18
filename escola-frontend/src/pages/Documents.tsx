import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Search, 
  Filter, 
  Award,
  ScrollText,
  BookOpen,
  GraduationCap,
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { documentsAPI, studentsAPI } from '@/lib/api';

const documentGenerationSchema = z.object({
  studentId: z.string().min(1, 'Selecione um aluno'),
  documentType: z.enum(['certificate', 'declaration', 'transcript', 'reportCard'], {
    required_error: 'Selecione o tipo de documento'
  }),
  year: z.number().min(2020).max(2030, 'Ano deve estar entre 2020 e 2030'),
  purpose: z.string().optional(),
  startYear: z.number().optional(),
  endYear: z.number().optional(),
});

type DocumentGenerationForm = z.infer<typeof documentGenerationSchema>;

const documentTypes = [
  { value: 'certificate', label: 'Certificado de Conclusão', icon: Award, description: 'Para alunos aprovados' },
  { value: 'declaration', label: 'Declaração de Matrícula', icon: ScrollText, description: 'Confirmação de matrícula ativa' },
  { value: 'transcript', label: 'Histórico Escolar', icon: BookOpen, description: 'Histórico completo do aluno' },
  { value: 'reportCard', label: 'Boletim Escolar', icon: GraduationCap, description: 'Boletim angolano oficial' },
];

export default function Documents() {
  const { user, hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DocumentGenerationForm>({
    resolver: zodResolver(documentGenerationSchema),
    defaultValues: {
      studentId: '',
      documentType: 'certificate',
      year: new Date().getFullYear(),
      purpose: '',
    },
  });

  // Buscar alunos para seleção
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: studentsAPI.getAll,
  });

  // Buscar status do sistema de PDF
  const { data: pdfHealth, refetch: refetchPdfHealth } = useQuery({
    queryKey: ['pdf-health'],
    queryFn: documentsAPI.getPdfHealth,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Filtrar alunos por busca
  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutation para gerar certificado
  const generateCertificateMutation = useMutation({
    mutationFn: async (data: { studentId: string; year: number; format: 'json' | 'pdf' | 'both' }) => {
      setIsGenerating(true);
      try {
        if (data.format === 'json') {
          return await documentsAPI.generateCertificate(data.studentId, data.year);
        } else if (data.format === 'pdf') {
          const blob = await documentsAPI.generateCertificatePdf(data.studentId, data.year);
          const filename = `certificado_${data.studentId}_${data.year}.pdf`;
          documentsAPI.downloadFile(blob, filename);
          return { success: true, filename };
        } else {
          return await documentsAPI.generateCertificateWithPdf(data.studentId, data.year);
        }
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data, variables) => {
      const student = students.find(s => s.id === variables.studentId);
      toast({
        title: 'Certificado Gerado!',
        description: `Certificado de ${student?.firstName} ${student?.lastName} gerado com sucesso.`,
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Gerar Certificado',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Mutation para gerar declaração
  const generateDeclarationMutation = useMutation({
    mutationFn: async (data: { studentId: string; year: number; purpose: string; format: 'json' | 'pdf' | 'both' }) => {
      setIsGenerating(true);
      try {
        if (data.format === 'json') {
          return await documentsAPI.generateDeclaration(data.studentId, data.year, data.purpose);
        } else if (data.format === 'pdf') {
          const blob = await documentsAPI.generateDeclarationPdf(data.studentId, data.year, data.purpose);
          const filename = `declaracao_${data.studentId}_${data.year}.pdf`;
          documentsAPI.downloadFile(blob, filename);
          return { success: true, filename };
        } else {
          return await documentsAPI.generateDeclarationWithPdf(data.studentId, data.year, data.purpose);
        }
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data, variables) => {
      const student = students.find(s => s.id === variables.studentId);
      toast({
        title: 'Declaração Gerada!',
        description: `Declaração de ${student?.firstName} ${student?.lastName} gerada com sucesso.`,
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Gerar Declaração',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Mutation para gerar histórico
  const generateTranscriptMutation = useMutation({
    mutationFn: async (data: { studentId: string; startYear?: number; endYear?: number; format: 'json' | 'pdf' | 'both' }) => {
      setIsGenerating(true);
      try {
        if (data.format === 'json') {
          return await documentsAPI.generateTranscript(data.studentId, data.startYear, data.endYear);
        } else if (data.format === 'pdf') {
          const blob = await documentsAPI.generateTranscriptPdf(data.studentId, data.startYear, data.endYear);
          const filename = `historico_${data.studentId}.pdf`;
          documentsAPI.downloadFile(blob, filename);
          return { success: true, filename };
        } else {
          return await documentsAPI.generateTranscriptWithPdf(data.studentId, data.startYear, data.endYear);
        }
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data, variables) => {
      const student = students.find(s => s.id === variables.studentId);
      toast({
        title: 'Histórico Gerado!',
        description: `Histórico de ${student?.firstName} ${student?.lastName} gerado com sucesso.`,
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Gerar Histórico',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Mutation para gerar boletim
  const generateReportCardMutation = useMutation({
    mutationFn: async (data: { studentId: string; year: number; term?: number }) => {
      setIsGenerating(true);
      try {
        const blob = await documentsAPI.generateReportCardPdf(data.studentId, data.year, data.term);
        const filename = `boletim_${data.studentId}_${data.year}${data.term ? `_${data.term}T` : ''}.pdf`;
        documentsAPI.downloadFile(blob, filename);
        return { success: true, filename };
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data, variables) => {
      const student = students.find(s => s.id === variables.studentId);
      toast({
        title: 'Boletim Gerado!',
        description: `Boletim de ${student?.firstName} ${student?.lastName} gerado com sucesso.`,
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Gerar Boletim',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Mutation para limpar cache
  const clearCacheMutation = useMutation({
    mutationFn: documentsAPI.clearPdfCache,
    onSuccess: () => {
      toast({
        title: 'Cache Limpo!',
        description: 'Cache de PDFs limpo com sucesso.',
      });
      refetchPdfHealth();
    },
  });

  const onSubmit = (data: DocumentGenerationForm) => {
    const { studentId, documentType, year, purpose, startYear, endYear } = data;

    switch (documentType) {
      case 'certificate':
        generateCertificateMutation.mutate({ studentId, year, format: 'pdf' });
        break;
      case 'declaration':
        if (!purpose) {
          toast({
            title: 'Finalidade Obrigatória',
            description: 'Para declarações, a finalidade é obrigatória.',
            variant: 'destructive',
          });
          return;
        }
        generateDeclarationMutation.mutate({ studentId, year, purpose, format: 'pdf' });
        break;
      case 'transcript':
        generateTranscriptMutation.mutate({ studentId, startYear, endYear, format: 'pdf' });
        break;
      case 'reportCard':
        generateReportCardMutation.mutate({ studentId, year });
        break;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const currentYear = new Date().getFullYear();
  const isAdmin = hasRole('ADMIN');
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
        
        <div className="flex space-x-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => clearCacheMutation.mutate()}
              disabled={clearCacheMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpar Cache
            </Button>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Gerar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Gerar Documento Oficial</DialogTitle>
                <DialogDescription>
                  Selecione o aluno e tipo de documento para gerar o documento oficial angolano.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Seleção de Aluno */}
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aluno</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                              <Input
                                placeholder="Buscar aluno por nome ou número..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o aluno" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredStudents.map((student) => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.firstName} {student.lastName} - {student.studentNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tipo de Documento */}
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {documentTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center space-x-2">
                                      <Icon className="w-4 h-4" />
                                      <div>
                                        <div className="font-medium">{type.label}</div>
                                        <div className="text-xs text-muted-foreground">{type.description}</div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ano Letivo */}
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano Letivo</FormLabel>
                        <FormControl>
                          <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o ano" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Finalidade (apenas para declarações) */}
                  {form.watch('documentType') === 'declaration' && (
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Finalidade da Declaração</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ex: Para fins de bolsa de estudos, transferência escolar, etc."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Período (apenas para históricos) */}
                  {form.watch('documentType') === 'transcript' && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano de Início (Opcional)</FormLabel>
                            <FormControl>
                              <Select onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Ano inicial" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 11 }, (_, i) => currentYear - 10 + i).map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano de Fim (Opcional)</FormLabel>
                            <FormControl>
                              <Select onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Ano final" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isGenerating}>
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Printer className="w-4 h-4 mr-2" />
                          Gerar PDF
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status do Sistema de PDF */}
      {pdfHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon(pdfHealth.status)}
              <span>Status do Sistema de Geração de PDF</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-2xl font-bold capitalize">{pdfHealth.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Browser</p>
                <p className="text-2xl font-bold">{pdfHealth.browser ? 'Online' : 'Offline'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Cache</p>
                <p className="text-2xl font-bold">{pdfHealth.cache?.size || 0}/{pdfHealth.cache?.maxSize || 100}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Modo</p>
                <p className="text-2xl font-bold capitalize">{pdfHealth.mode}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tipos de Documentos Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {documentTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.value} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{type.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Informações sobre Documentos Angolanos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Escolares Oficiais de Angola</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Características dos Documentos:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Formatação conforme padrões do Ministério da Educação</li>
                <li>• Cabeçalho oficial "República de Angola"</li>
                <li>• Sistema de avaliação angolano (0-20 valores)</li>
                <li>• Assinaturas do Director e Secretário</li>
                <li>• Selo oficial da instituição</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Escalas de Classificação:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="text-green-600 font-medium">17-20:</span> Excelente</li>
                <li>• <span className="text-teal-600 font-medium">14-16:</span> Muito Bom</li>
                <li>• <span className="text-blue-600 font-medium">12-13:</span> Bom</li>
                <li>• <span className="text-orange-600 font-medium">10-11:</span> Satisfatório</li>
                <li>• <span className="text-red-600 font-medium">0-9:</span> Não Satisfatório</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}