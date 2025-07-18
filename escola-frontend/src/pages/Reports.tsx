import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileCheck, Download, FileText, User, GraduationCap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { reportsAPI, studentsAPI, classesAPI } from '@/lib/api';
import { 
  ReportCard, 
  getStatusBadge, 
  getGradeClassification, 
  formatAcademicYear, 
  formatTerm,
  getGradeTypeName 
} from '@/types/report';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Reports() {
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('1');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedClass, setSelectedClass] = useState<string>('');
  const { toast } = useToast();

  // Carregar turmas para filtro
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    onError: (error: any) => {
      console.error('Erro ao carregar turmas:', error);
    }
  });

  // Carregar alunos baseado na turma selecionada
  const { data: students = [] } = useQuery({
    queryKey: ['students-by-class', selectedClass, selectedYear],
    queryFn: () => {
      if (selectedClass) {
        return reportsAPI.getStudentsByClass(selectedClass, selectedYear);
      }
      return studentsAPI.getAll();
    },
    enabled: !!selectedClass || selectedStudent === 'all',
    onError: (error: any) => {
      console.error('Erro ao carregar alunos:', error);
    }
  });

  // Carregar boletins baseado nos filtros
  const { data: reports = [], isLoading: loadingReports, refetch } = useQuery({
    queryKey: ['reports', selectedStudent, selectedClass, selectedTerm, selectedYear],
    queryFn: async () => {
      console.log('📊 Carregando boletins...');
      
      if (selectedStudent !== 'all') {
        // Boletim de um aluno específico
        const report = await reportsAPI.getReportCard(selectedStudent, {
          year: selectedYear,
          term: selectedTerm === 'FINAL' ? undefined : parseInt(selectedTerm)
        });
        return [report];
      } else if (selectedClass) {
        // Boletins de toda uma turma
        const reports = await reportsAPI.getClassReportCards(selectedClass, {
          year: selectedYear,
          term: selectedTerm === 'FINAL' ? undefined : parseInt(selectedTerm)
        });
        return reports;
      }
      
      return [];
    },
    enabled: selectedStudent !== 'all' || !!selectedClass,
    onSuccess: (data) => {
      console.log('✅ Boletins carregados:', data?.length, 'boletins');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao carregar boletins:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os boletins',
        variant: 'destructive'
      });
    }
  });

  // Mutation para download de PDF
  const downloadMutation = useMutation({
    mutationFn: async (reportData: { studentId: string; year: number; term?: number }) => {
      console.log('📥 Baixando PDF do boletim...', reportData);
      return reportsAPI.downloadReportCardPdfWithFilename(reportData.studentId, {
        year: reportData.year,
        term: reportData.term
      });
    },
    onSuccess: ({ blob, filename }) => {
      console.log('✅ PDF baixado com sucesso:', filename);
      reportsAPI.triggerDownload(blob, filename);
      toast({
        title: 'Sucesso!',
        description: 'Boletim baixado com sucesso!'
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao baixar PDF:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao baixar boletim';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  const handleDownloadReport = (report: ReportCard) => {
    downloadMutation.mutate({
      studentId: report.student.id,
      year: report.year,
      term: report.term
    });
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId === 'ALL' ? '' : classId);
    setSelectedStudent('all'); // Reset student selection when class changes
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Boletins Escolares</h1>
            <p className="text-muted-foreground">Sistema de boletins conforme padrão do MINED Angola</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ano Letivo</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 5}, (_, i) => 2020 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {formatAcademicYear(year)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Turma</label>
                <Select value={selectedClass || 'ALL'} onValueChange={handleClassChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Selecionar turma</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Aluno</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os alunos da turma</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Trimestre</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
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

        <div className="grid gap-6">
          {loadingReports ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
                <h3 className="text-lg font-medium mb-2">Carregando boletins...</h3>
                <p className="text-muted-foreground">
                  Aguarde enquanto geramos os boletins escolares.
                </p>
              </CardContent>
            </Card>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <Card key={`${report.student.id}-${report.year}-${report.term}`} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-8 h-8 p-1.5 bg-primary text-primary-foreground rounded-full" />
                      <div>
                        <CardTitle className="text-xl">REPÚBLICA DE ANGOLA</CardTitle>
                        <p className="text-sm font-medium">{report.school.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {report.school.province} • {report.school.municipality}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadge(report.status) as any}>
                        {report.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadReport(report)}
                        disabled={downloadMutation.isPending}
                      >
                        {downloadMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Descarregar PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Informações do Aluno */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Informações do Aluno</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Nome:</span>
                        <p>{report.student.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Nº Estudante:</span>
                        <p>{report.student.studentNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium">Classe:</span>
                        <p>{report.class.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Período:</span>
                        <p>{formatTerm(report.term)} - {formatAcademicYear(report.year)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />
                  
                  {/* Disciplinas Curriculares */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Disciplinas Curriculares</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Disciplina</th>
                            <th className="text-center p-2">MAC</th>
                            <th className="text-center p-2">NPP</th>
                            <th className="text-center p-2">NPT</th>
                            <th className="text-center p-2">MT</th>
                            <th className="text-center p-2">FAL</th>
                            <th className="text-center p-2">Classificação</th>
                            <th className="text-center p-2">Professor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.subjects.map((subject) => {
                            const macGrade = subject.grades.find(g => g.type === 'MAC');
                            const nppGrade = subject.grades.find(g => g.type === 'NPP');
                            const nptGrade = subject.grades.find(g => g.type === 'NPT');
                            const mtValue = subject.averageGrade || 0;
                            const classification = getGradeClassification(mtValue);
                            
                            return (
                              <tr key={subject.subjectId} className="border-b">
                                <td className="p-2 font-medium">{subject.subjectName}</td>
                                <td className="text-center p-2">{macGrade?.value || '-'}</td>
                                <td className="text-center p-2">{nppGrade?.value || '-'}</td>
                                <td className="text-center p-2">{nptGrade?.value || '-'}</td>
                                <td className={`text-center p-2 font-bold ${classification.color}`}>
                                  {mtValue.toFixed(1)}
                                </td>
                                <td className="text-center p-2">{subject.absences}</td>
                                <td className={`text-center p-2 text-xs ${classification.color}`}>
                                  {classification.label}
                                </td>
                                <td className="text-center p-2 text-xs">
                                  {subject.teacherName.split(' ').slice(0, 2).join(' ')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Resumo e Legenda */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Resumo Académico</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Média Geral:</strong> {report.averageGrade.toFixed(1)} valores</p>
                        <p><strong>Frequência:</strong> {report.attendancePercentage.toFixed(1)}%</p>
                        <p className={
                          report.status === 'APROVADO' ? 'text-green-600 font-bold' :
                          report.status === 'REPROVADO' ? 'text-red-600 font-bold' :
                          'text-yellow-600 font-bold'
                        }>
                          <strong>Estado:</strong> {report.status}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Legenda</h4>
                      <div className="text-xs space-y-1">
                        <p><strong>MAC</strong> = Média das Avaliações Contínuas</p>
                        <p><strong>NPP</strong> = Nota da Prova do Professor</p>
                        <p><strong>NPT</strong> = Nota da Prova Trimestral</p>
                        <p><strong>MT</strong> = Média Trimestral</p>
                        <p><strong>FAL</strong> = Faltas</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <p>Boletim gerado em: {new Date(report.generatedAt).toLocaleDateString('pt-AO')}</p>
                    <p>Sistema: <span className="font-bold">Synexa-SIS {report.year}</span></p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum boletim encontrado</h3>
                <p className="text-muted-foreground">
                  {!selectedClass 
                    ? 'Selecione uma turma para visualizar os boletins disponíveis.' 
                    : 'Nenhum boletim encontrado para os filtros selecionados.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}