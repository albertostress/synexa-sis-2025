
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileCheck, Download, FileText, User, GraduationCap } from 'lucide-react';

interface ReportCard {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  term: '1' | '2' | '3' | 'FINAL';
  academicYear: string;
  subjects: {
    id: string;
    name: string;
    mac: number;  // Média das Avaliações Contínuas
    npp: number;  // Nota da Prova do Professor
    npt: number;  // Nota da Prova Trimestral
    mt: number;   // Média Trimestral
    fal: number;  // Faltas
    observations?: string;
  }[];
  overallAverage: number;
  overallAttendance: number;
  status: 'APROVADO' | 'REPROVADO' | 'PENDENTE';
  generatedDate: string;
  school: string;
  province: string;
  municipality: string;
}

const mockReports: ReportCard[] = [
  {
    id: '1',
    studentId: 'ST001',
    studentName: 'Ana Silva',
    classId: 'C001',
    className: '10ª Classe',
    term: '1',
    academicYear: '2024/2025',
    school: 'Complexo Escolar Privado Casa Inglesa',
    province: 'Luanda',
    municipality: 'Belas',
    subjects: [
      {
        id: 'SUB001',
        name: 'Língua Portuguesa',
        mac: 16,
        npp: 15,
        npt: 17,
        mt: 16,
        fal: 2,
        observations: 'Excelente desempenho na expressão escrita',
      },
      {
        id: 'SUB002',
        name: 'Matemática',
        mac: 14,
        npp: 13,
        npt: 15,
        mt: 14,
        fal: 1,
      },
      {
        id: 'SUB003',
        name: 'História',
        mac: 12,
        npp: 13,
        npt: 14,
        mt: 13,
        fal: 0,
      },
    ],
    overallAverage: 14.3,
    overallAttendance: 95,
    status: 'APROVADO',
    generatedDate: '2024-01-15',
  },
];

const mockStudents = [
  { id: 'ST001', name: 'Ana Silva', class: '10ª Classe' },
  { id: 'ST002', name: 'João Santos', class: '11ª Classe' },
  { id: 'ST003', name: 'Maria Costa', class: '12ª Classe' },
];

export default function Reports() {
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('1');

  const { data: reports = [] } = useQuery({
    queryKey: ['reports', selectedStudent, selectedTerm],
    queryFn: () => {
      console.log('Fetching reports for:', { selectedStudent, selectedTerm });
      return Promise.resolve(
        mockReports.filter(report => 
          (selectedStudent === 'all' || report.studentId === selectedStudent) &&
          report.term === selectedTerm
        )
      );
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      APROVADO: 'default',
      REPROVADO: 'destructive',
      PENDENTE: 'outline',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status}
      </Badge>
    );
  };

  const getGradeClassification = (grade: number) => {
    if (grade >= 17) return { label: 'Excelente', color: 'text-green-700' };
    if (grade >= 14) return { label: 'Muito Bom', color: 'text-green-600' };
    if (grade >= 12) return { label: 'Bom', color: 'text-blue-600' };
    if (grade >= 10) return { label: 'Satisfatório', color: 'text-yellow-600' };
    return { label: 'Não Satisfatório', color: 'text-red-600' };
  };

  const handleDownloadReport = (reportId: string) => {
    console.log('Downloading report:', reportId);
    const report = reports.find(r => r.id === reportId);
    if (report) {
      // Simular download do boletim
      const content = `BOLETIM ESCOLAR - REPÚBLICA DE ANGOLA
      
Escola: ${report.school}
Província: ${report.province}
Município: ${report.municipality}

Aluno: ${report.studentName}
Classe: ${report.className}
Ano Lectivo: ${report.academicYear}
${report.term}º Trimestre

DISCIPLINAS CURRICULARES:
${report.subjects.map(subject => 
  `${subject.name}: MAC=${subject.mac} NPP=${subject.npp} NPT=${subject.npt} MT=${subject.mt} FAL=${subject.fal}`
).join('\n')}

Média Geral: ${report.overallAverage}
Estado: ${report.status}`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boletim_${report.studentName.replace(' ', '_')}_${report.term}trimestre.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Boletins Escolares</h1>
          <p className="text-muted-foreground">Sistema de boletins conforme padrão do MINED</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Aluno</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os alunos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os alunos</SelectItem>
                  {mockStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - {student.class}
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
        {reports.map((report) => (
          <Card key={report.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 p-1.5 bg-primary text-primary-foreground rounded-full" />
                  <div>
                    <CardTitle className="text-xl">REPÚBLICA DE ANGOLA</CardTitle>
                    <p className="text-sm font-medium">{report.school}</p>
                    <p className="text-muted-foreground text-sm">
                      {report.province} • {report.municipality}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(report.status)}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadReport(report.id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descarregar
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
                    <p>{report.studentName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Classe:</span>
                    <p>{report.className}</p>
                  </div>
                  <div>
                    <span className="font-medium">Ano Lectivo:</span>
                    <p>{report.academicYear}</p>
                  </div>
                  <div>
                    <span className="font-medium">Trimestre:</span>
                    <p>{report.term === 'FINAL' ? 'Final' : `${report.term}º`}</p>
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
                      </tr>
                    </thead>
                    <tbody>
                      {report.subjects.map((subject) => {
                        const classification = getGradeClassification(subject.mt);
                        return (
                          <tr key={subject.id} className="border-b">
                            <td className="p-2 font-medium">{subject.name}</td>
                            <td className="text-center p-2">{subject.mac}</td>
                            <td className="text-center p-2">{subject.npp}</td>
                            <td className="text-center p-2">{subject.npt}</td>
                            <td className={`text-center p-2 font-bold ${classification.color}`}>
                              {subject.mt}
                            </td>
                            <td className="text-center p-2">{subject.fal}</td>
                            <td className={`text-center p-2 text-xs ${classification.color}`}>
                              {classification.label}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Observações e Legendas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Observações</h4>
                  <div className="space-y-2 text-sm">
                    {report.subjects.filter(s => s.observations).map((subject) => (
                      <p key={subject.id}>
                        <strong>{subject.name}:</strong> {subject.observations}
                      </p>
                    ))}
                    {report.subjects.filter(s => s.observations).length === 0 && (
                      <p className="text-muted-foreground italic">Sem observações específicas</p>
                    )}
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
                <p>Boletim gerado em: {new Date(report.generatedDate).toLocaleDateString('pt-AO')}</p>
                <p>Média Geral: <span className="font-bold">{report.overallAverage} valores</span></p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {reports.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum boletim encontrado</h3>
              <p className="text-muted-foreground">
                Seleccione um aluno e trimestre para visualizar os boletins disponíveis.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
