
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Filter, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const monthlyData = [
  { month: 'Jan', receita: 125000, pagamentos: 98000 },
  { month: 'Fev', receita: 138000, pagamentos: 112000 },
  { month: 'Mar', receita: 142000, pagamentos: 125000 },
  { month: 'Abr', receita: 155000, pagamentos: 134000 },
  { month: 'Mai', receita: 148000, pagamentos: 128000 },
  { month: 'Jun', receita: 162000, pagamentos: 145000 },
];

const paymentMethodData = [
  { method: 'Dinheiro', value: 45, color: '#8884d8' },
  { method: 'Transferência', value: 30, color: '#82ca9d' },
  { method: 'Multicaixa', value: 20, color: '#ffc658' },
  { method: 'Kwik', value: 5, color: '#ff7300' },
];

const defaultersData = [
  { student: 'João Santos', amount: 1350.00, months: 3, lastPayment: '2023-12-15' },
  { student: 'Maria Costa', amount: 900.00, months: 2, lastPayment: '2024-01-10' },
  { student: 'Pedro Silva', amount: 450.00, months: 1, lastPayment: '2024-02-05' },
];

export default function FinancialReports() {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('current-month');

  const exportReport = (type: string) => {
    console.log(`Exporting ${type} report`);
  };

  return (
    <div className="space-y-6">
      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatórios Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Visão Geral</SelectItem>
                <SelectItem value="payments">Pagamentos</SelectItem>
                <SelectItem value="defaulters">Inadimplentes</SelectItem>
                <SelectItem value="methods">Métodos de Pagamento</SelectItem>
                <SelectItem value="exemptions">Isenções</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Mês Atual</SelectItem>
                <SelectItem value="last-month">Mês Passado</SelectItem>
                <SelectItem value="current-year">Ano Atual</SelectItem>
                <SelectItem value="last-year">Ano Passado</SelectItem>
                <SelectItem value="custom">Período Personalizado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => exportReport('excel')}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>

            <Button variant="outline" onClick={() => exportReport('pdf')}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Dashboard */}
      {reportType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="receita" fill="#8884d8" name="Receita Esperada" />
                  <Bar dataKey="pagamentos" fill="#82ca9d" name="Pagamentos Recebidos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, value }) => `${method}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Defaulters Report */}
      {reportType === 'defaulters' && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Inadimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Valor em Atraso</TableHead>
                  <TableHead>Meses em Atraso</TableHead>
                  <TableHead>Último Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaultersData.map((defaulter, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{defaulter.student}</TableCell>
                    <TableCell className="font-mono text-red-600">
                      {formatCurrency(defaulter.amount)}
                    </TableCell>
                    <TableCell>{defaulter.months} meses</TableCell>
                    <TableCell>
                      {new Date(defaulter.lastPayment).toLocaleDateString('pt-AO')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Em Atraso</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Contatar
                        </Button>
                        <Button variant="outline" size="sm">
                          Negociar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
