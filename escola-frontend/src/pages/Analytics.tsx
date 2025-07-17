
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Users, BookOpen, DollarSign, Calendar } from 'lucide-react';

const enrollmentData = [
  { month: 'Jan', students: 120 },
  { month: 'Fev', students: 135 },
  { month: 'Mar', students: 145 },
  { month: 'Abr', students: 140 },
  { month: 'Mai', students: 155 },
  { month: 'Jun', students: 160 },
];

const gradeDistribution = [
  { grade: '10-12', count: 25, fill: '#8884d8' },
  { grade: '13-15', count: 45, fill: '#82ca9d' },
  { grade: '16-18', count: 35, fill: '#ffc658' },
  { grade: '19-20', count: 15, fill: '#ff7c7c' },
];

const attendanceData = [
  { subject: 'Matemática', attendance: 92 },
  { subject: 'Português', attendance: 89 },
  { subject: 'História', attendance: 87 },
  { subject: 'Inglês', attendance: 94 },
  { subject: 'Ciências', attendance: 88 },
];

const financialData = [
  { month: 'Jan', income: 45000, expenses: 38000 },
  { month: 'Fev', income: 48000, expenses: 35000 },
  { month: 'Mar', income: 52000, expenses: 42000 },
  { month: 'Abr', income: 47000, expenses: 39000 },
  { month: 'Mai', income: 55000, expenses: 41000 },
  { month: 'Jun', income: 58000, expenses: 43000 },
];

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('semester');
  const [selectedReport, setSelectedReport] = useState('overview');

  const generateReport = () => {
    // Simulation of report generation
    console.log('Generating report for:', selectedReport, selectedPeriod);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Análises</h1>
          <p className="text-muted-foreground">Análise de dados e relatórios detalhados</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="semester">Semestral</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="academic">Desempenho Académico</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="attendance">Assiduidade</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% desde o último mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89.2%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.1% desde o último semestre
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€58,000</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +5.4% desde o último mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Assiduidade</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.5%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -0.8% desde o último mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Matrículas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ grade, count }) => `${grade}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Assiduidade por Disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendance" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#8884d8" name="Receita" />
                <Bar dataKey="expenses" fill="#82ca9d" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Relatório de Desempenho</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Análise detalhada do desempenho académico dos alunos
              </p>
              <Button variant="outline" size="sm" onClick={generateReport}>
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Relatório Financeiro</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Análise de receitas, despesas e fluxo de caixa
              </p>
              <Button variant="outline" size="sm" onClick={generateReport}>
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Relatório de Assiduidade</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Análise da frequência e assiduidade dos alunos
              </p>
              <Button variant="outline" size="sm" onClick={generateReport}>
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
