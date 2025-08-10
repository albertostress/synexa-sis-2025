import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileCheck, Download, FileText, User, GraduationCap, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesAPI, enrollmentAPI } from '@/lib/api';
import { reportService, AngolaReportCard } from '@/services/reportService';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Reports() {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('1');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [downloadingStudentId, setDownloadingStudentId] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar turmas para filtro
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    onError: (error: any) => {
      console.error('Erro ao carregar turmas:', error);
    }
  });

  // Carregar anos letivos disponíveis dinamicamente
  const { data: availableYears = [], isLoading: loadingYears } = useQuery({
    queryKey: ['enrollment-years'],
    queryFn: () => enrollmentAPI.getAvailableYears(),
    onError: (error: any) => {
      console.error('Erro ao carregar anos letivos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os anos letivos disponíveis',
        variant: 'destructive'
      });
    }
  });

  // Definir o ano mais recente como padrão quando os anos forem carregados
  useEffect(() => {
    if (availableYears.length > 0) {
      // Extrair o primeiro ano da string "2025/2026" -> 2025
      const mostRecentYear = parseInt(availableYears[0].split('/')[0]);
      if (selectedYear !== mostRecentYear) {
        setSelectedYear(mostRecentYear);
      }
    }
  }, [availableYears]);

  // FASE 2: Carregar alunos baseado na turma selecionada para autocomplete
  const { 
    data: students = [], 
    isLoading: loadingStudents,
    error: studentsError 
  } = useQuery({
    queryKey: ['students-by-class', selectedClass, selectedYear],
    queryFn: async () => {
      if (!selectedClass) {
        console.log('❌ Nenhuma turma selecionada');
        return [];
      }
      
      console.log('📚 Carregando alunos da turma:', selectedClass, 'ano:', selectedYear);
      const studentsData = await reportService.getStudentsByClass(selectedClass, selectedYear);
      console.log('✅ Alunos carregados:', studentsData.length);
      return studentsData;
    },
    enabled: !!selectedClass,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    onError: (error: any) => {
      console.error('❌ Erro ao carregar alunos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os alunos da turma',
        variant: 'destructive'
      });
    },
    onSuccess: (data) => {
      console.log('✅ Query alunos bem-sucedida:', data.length, 'alunos encontrados');
    }
  });

  // FASE 2: Filtrar alunos com base na pesquisa (autocomplete)
  const filteredStudents = useMemo(() => {
    return reportService.filterStudentsByName(students, studentSearchTerm);
  }, [students, studentSearchTerm]);

  // FASE 1: Carregar boletim Angola usando o novo endpoint otimizado
  const { data: reportCard, isLoading: loadingReports, refetch } = useQuery({
    queryKey: ['angola-report-card', selectedStudent, selectedTerm, selectedYear],
    queryFn: async (): Promise<AngolaReportCard | null> => {
      if (!selectedStudent) return null;
      
      console.log('📊 Carregando boletim Angola...');
      
      const report = await reportService.getAngolaReportCard(selectedStudent, {
        year: selectedYear,
        term: selectedTerm === 'FINAL' ? undefined : parseInt(selectedTerm)
      });
      
      return report;
    },
    enabled: !!selectedStudent && selectedStudent !== '',
    onSuccess: (data) => {
      console.log('✅ Boletim Angola carregado:', data ? 'sucesso' : 'vazio');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao carregar boletim:', error);
      const errorMessage = error.response?.data?.message || 'Não foi possível carregar o boletim';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // FASE 4: Mutation para gerar PDF do boletim Angola
  const downloadMutation = useMutation({
    mutationFn: async (reportData: { studentId: string; year: number; term?: number }) => {
      console.log('📥 Gerando PDF do boletim Angola...', reportData);
      return reportService.generateReportCardPdfWithFilename(reportData.studentId, {
        year: reportData.year,
        term: reportData.term
      });
    },
    onSuccess: ({ blob, filename }) => {
      console.log('✅ PDF gerado com sucesso:', filename);
      reportService.triggerDownload(blob, filename);
      toast({
        title: 'Sucesso!',
        description: 'Boletim PDF gerado e baixado com sucesso!'
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao gerar PDF:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao gerar boletim PDF';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // FASE 4: Handler para gerar PDF do boletim
  const handleDownloadReport = () => {
    if (!reportCard) return;
    
    setDownloadingStudentId(selectedStudent);
    downloadMutation.mutate({
      studentId: selectedStudent,
      year: selectedYear,
      term: selectedTerm === 'FINAL' ? undefined : parseInt(selectedTerm)
    }, {
      onSettled: () => {
        setDownloadingStudentId(null);
      }
    });
  };

  const handleClassChange = (classId: string) => {
    console.log('🏫 Mudança de turma:', classId);
    const newClassId = classId === 'ALL' ? '' : classId;
    
    setSelectedClass(newClassId);
    setSelectedStudent(''); // Reset student selection when class changes
    setStudentSearchTerm(''); // Reset search term
    
    console.log('🔄 Estado resetado para nova turma');
  };

  // FASE 2: Handler para seleção de aluno no autocomplete
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    const selectedStudentData = students.find(s => s.id === studentId);
    if (selectedStudentData) {
      setStudentSearchTerm(selectedStudentData.name);
    }
  };

  // FASE 3: Helper para formatar ano acadêmico
  const formatAcademicYear = (year: number) => `${year}/${year + 1}`;

  // FASE 3: Helper para formatar trimestre
  const formatTerm = (term: number | null) => {
    if (!term) return 'Boletim Final';
    return `${term}º Trimestre`;
  };

  return (
    <ErrorBoundary>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4 px-1">
          <div>
            <h1 className="text-3xl font-bold">Boletins Escolares</h1>
            <p className="text-muted-foreground">Gerir boletins escolares</p>
          </div>
          {reportCard && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                Boletim carregado
              </Badge>
              {/* FASE 4: Botão Gerar PDF no topo */}
              <Button 
                variant="default"
                onClick={handleDownloadReport}
                disabled={downloadingStudentId !== null}
                className="bg-green-600 hover:bg-green-700"
              >
                {downloadingStudentId ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* FASE 3: Filtros em layout 2x2 limpo e responsivo */}
        <Card className={`${selectedStudent ? 'mb-2' : 'mb-4'} border-2 border-primary/10 transition-all duration-300 flex-shrink-0`}>
          <CardHeader className={`${selectedStudent ? 'pb-2 py-2' : 'pb-4'}`}>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className={`pt-0 ${selectedStudent ? 'pb-2' : ''} transition-all duration-300`}>
            {selectedStudent && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{studentSearchTerm}</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatAcademicYear(selectedYear)} - {formatTerm(parseInt(selectedTerm) || null)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedStudent('');
                    setStudentSearchTerm('');
                  }}
                  className="text-xs"
                >
                  Alterar seleção
                </Button>
              </div>
            )}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${selectedStudent ? 'hidden' : ''}`}>
              {/* Primeira linha: Ano Letivo | Turma */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Ano Letivo
                  {loadingYears && (
                    <Loader2 className="w-3 h-3 ml-2 inline animate-spin" />
                  )}
                </label>
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                  disabled={loadingYears || availableYears.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      loadingYears 
                        ? "Carregando anos letivos..." 
                        : availableYears.length === 0 
                        ? "Nenhum ano letivo disponível"
                        : "Selecione um ano letivo"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(yearRange => {
                      const year = parseInt(yearRange.split('/')[0]);
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {yearRange}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {!loadingYears && availableYears.length === 0 && (
                  <p className="text-xs text-orange-600">Nenhum ano letivo encontrado no sistema</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Turma</label>
                <Select value={selectedClass || ''} onValueChange={handleClassChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Segunda linha: Aluno (autocomplete) | Trimestre */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Aluno
                  {loadingStudents && (
                    <Loader2 className="w-3 h-3 ml-2 inline animate-spin" />
                  )}
                </label>
                {/* FASE 2: Campo com autocomplete inteligente */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      !selectedClass 
                        ? "Selecione uma turma primeiro"
                        : loadingStudents 
                        ? "Carregando alunos..."
                        : "Pesquisar aluno por nome..."
                    }
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    disabled={!selectedClass || loadingStudents}
                    className="pl-10"
                  />
                  
                  {/* Dropdown com resultados filtrados */}
                  {selectedClass && !loadingStudents && studentSearchTerm.length >= 2 && filteredStudents.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredStudents.slice(0, 8).map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleStudentSelect(student.id)}
                          className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm border-b border-border last:border-b-0"
                        >
                          <div className="font-medium">{student.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Mensagem quando não encontra alunos */}
                  {selectedClass && !loadingStudents && studentSearchTerm.length >= 2 && filteredStudents.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-3">
                      <p className="text-sm text-muted-foreground text-center">
                        Nenhum aluno encontrado com "{studentSearchTerm}"
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Mensagens de estado */}
                {!selectedClass ? (
                  <p className="text-xs text-muted-foreground">Selecione uma turma primeiro</p>
                ) : loadingStudents ? (
                  <p className="text-xs text-blue-600">Carregando lista de alunos...</p>
                ) : studentsError ? (
                  <p className="text-xs text-red-600">Erro ao carregar alunos. Tente novamente.</p>
                ) : students.length === 0 ? (
                  <p className="text-xs text-orange-600">Nenhum aluno encontrado nesta turma</p>
                ) : (
                  <p className="text-xs text-green-600">{students.length} alunos disponíveis</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Trimestre</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Trimestre</SelectItem>
                    <SelectItem value="2">2º Trimestre</SelectItem>
                    <SelectItem value="3">3º Trimestre</SelectItem>
                    <SelectItem value="FINAL">Boletim Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="h-full">
            {loadingReports ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
                <h3 className="text-lg font-medium mb-2">Carregando boletim...</h3>
                <p className="text-muted-foreground">
                  Aguarde enquanto carregamos o boletim escolar Angola.
                </p>
              </CardContent>
            </Card>
          ) : reportCard ? (
            // FASE 1 & 4: Mostrar boletim Angola com novo formato
            <Card className="h-full flex flex-col overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-8 h-8 p-1.5 bg-primary text-primary-foreground rounded-full" />
                      <div>
                        <CardTitle className="text-xl">REPÚBLICA DE ANGOLA</CardTitle>
                        <p className="text-sm font-medium">MINISTÉRIO DA EDUCAÇÃO</p>
                        <p className="text-muted-foreground text-sm">
                          Escola Synexa-SIS • Luanda
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={reportCard.finalStatus === 'Aprovado' ? 'default' : 'destructive'}>
                        {reportCard.finalStatus}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-6">
                  {/* Informações do Aluno */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Informações do Aluno</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Nome:</span>
                        <p className="font-medium">{reportCard.student.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Nome do Pai:</span>
                        <p>{reportCard.student.fatherName || 'Não informado'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Classe:</span>
                        <p>{reportCard.student.className}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Período:</span>
                        <p>{formatTerm(reportCard.term)} - {formatAcademicYear(reportCard.year)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />
                  
                  {/* FASE 4: Botão adicional de PDF na área de conteúdo */}
                  <div className="mb-6 flex justify-end">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadReport}
                      disabled={downloadingStudentId !== null}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      {downloadingStudentId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar Boletim PDF
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Disciplinas Curriculares - Formato Angola */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Disciplinas Curriculares (Sistema MINED Angola)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-3 border font-semibold">Disciplina</th>
                            <th className="text-center p-3 border font-semibold">MAC</th>
                            <th className="text-center p-3 border font-semibold">NPP</th>
                            <th className="text-center p-3 border font-semibold">NPT</th>
                            <th className="text-center p-3 border font-semibold bg-primary/10">MT</th>
                            <th className="text-center p-3 border font-semibold">FAL</th>
                            <th className="text-center p-3 border font-semibold">Classificação</th>
                            <th className="text-center p-3 border font-semibold">Professor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportCard.subjects.map((subject, index) => (
                            <tr key={index} className="hover:bg-muted/20">
                              <td className="p-3 border font-medium">{subject.subjectName}</td>
                              <td className="text-center p-3 border">{subject.mac || '-'}</td>
                              <td className="text-center p-3 border">{subject.npp || '-'}</td>
                              <td className="text-center p-3 border">{subject.npt || '-'}</td>
                              <td className="text-center p-3 border font-bold bg-primary/5">
                                {subject.mt ? subject.mt.toFixed(1) : '-'}
                              </td>
                              <td className="text-center p-3 border">{subject.fal}</td>
                              <td className="text-center p-3 border">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  subject.classification === 'Excelente' ? 'bg-green-100 text-green-800' :
                                  subject.classification === 'Muito Bom' ? 'bg-blue-100 text-blue-800' :
                                  subject.classification === 'Bom' ? 'bg-yellow-100 text-yellow-800' :
                                  subject.classification === 'Satisfatório' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {subject.classification}
                                </span>
                              </td>
                              <td className="text-center p-3 border text-xs">
                                {subject.teacherName.split(' ').slice(0, 2).join(' ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Resumo e Legenda */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Resumo Académico</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                          <span className="font-medium">Média Geral:</span>
                          <span className="text-lg font-bold text-primary">
                            {reportCard.averageGrade.toFixed(1)} valores
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                          <span className="font-medium">Frequência:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {reportCard.attendancePercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                          <span className="font-medium">Situação Final:</span>
                          <span className={`text-lg font-bold ${
                            reportCard.finalStatus === 'Aprovado' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {reportCard.finalStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Legenda (Sistema Angola)</h4>
                      <div className="text-xs space-y-1 bg-muted/20 p-4 rounded">
                        <p><strong>MAC</strong> = Média das Avaliações Contínuas</p>
                        <p><strong>NPP</strong> = Nota da Prova do Professor</p>
                        <p><strong>NPT</strong> = Nota da Prova Trimestral</p>
                        <p><strong>MT</strong> = Média Trimestral</p>
                        <p><strong>FAL</strong> = Faltas</p>
                        <Separator className="my-2" />
                        <p className="font-medium">Classificação:</p>
                        <p>18-20: Excelente | 16-17: Muito Bom | 14-15: Bom</p>
                        <p>12-13: Satisfatório | 0-11: Não Satisfatório</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <p>Boletim gerado em: {new Date(reportCard.generatedAt).toLocaleDateString('pt-AO')}</p>
                    <p>Sistema: <span className="font-bold">Synexa-SIS {reportCard.year} | MINED Angola</span></p>
                  </div>
                </CardContent>
              </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="py-12 text-center">
                <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum boletim encontrado</h3>
                <p className="text-muted-foreground">
                  {!selectedClass 
                    ? 'Selecione uma turma e depois pesquise um aluno para visualizar o boletim.' 
                    : !selectedStudent
                    ? 'Pesquise e selecione um aluno para visualizar seu boletim escolar.'
                    : 'Nenhum boletim encontrado para este aluno no período selecionado.'
                  }
                </p>
                {selectedClass && !selectedStudent && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>💡 <strong>Dica:</strong> Digite pelo menos 2 caracteres no campo "Aluno" para pesquisar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}