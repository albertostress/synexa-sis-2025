import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Bell,
  Calendar,
  CreditCard,
  Wallet,
  ArrowRight,
  Users,
  FileText,
  Mail,
  CheckSquare,
} from 'lucide-react';
import { formatCurrency } from '@/types/finance';

interface FinancialDashboardProps {
  data: {
    currentMonth: {
      totalRevenue: number;
      pendingAmount: number;
      overdueAmount: number;
      totalInvoices: number;
      paidInvoices: number;
      pendingInvoices: number;
      overdueInvoices: number;
    };
    monthlyData: Array<{
      month: string;
      revenue: number;
      pending: number;
      overdue: number;
    }>;
    paymentMethods: Array<{
      method: string;
      amount: number;
      count: number;
      color: string;
    }>;
    monthlyTarget?: number;
  };
  onNotifyOverdue: () => void;
  onMarkOverduePayments: () => void;
}

export function FinancialDashboard({ 
  data, 
  onNotifyOverdue, 
  onMarkOverduePayments 
}: FinancialDashboardProps) {
  // Calcular métricas derivadas
  const metrics = useMemo(() => {
    const { currentMonth, monthlyData } = data;
    
    // Taxa de cobrança atual
    const collectionRate = currentMonth.totalInvoices > 0 
      ? (currentMonth.paidInvoices / currentMonth.totalInvoices) * 100 
      : 0;
    
    // Crescimento mês anterior
    const previousMonth = monthlyData[monthlyData.length - 2];
    const currentRevenue = monthlyData[monthlyData.length - 1]?.revenue || 0;
    const previousRevenue = previousMonth?.revenue || 0;
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    
    // Meta mensal
    const monthlyTarget = data.monthlyTarget || currentMonth.totalRevenue * 1.1;
    const targetProgress = (currentMonth.totalRevenue / monthlyTarget) * 100;
    
    // Dias médios de atraso (simulado - seria calculado no backend)
    const averageDelayDays = 15;
    
    return {
      collectionRate,
      revenueGrowth,
      monthlyTarget,
      targetProgress,
      averageDelayDays,
    };
  }, [data]);

  // Preparar dados para gráficos
  const chartData = data.monthlyData.map(item => ({
    ...item,
    total: item.revenue + item.pending + item.overdue
  }));

  // Cores para gráfico de pizza
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <TrendingUp className={`h-4 w-4 ${metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.currentMonth.totalRevenue)}
            </div>
            <div className="flex items-center space-x-2">
              <p className={`text-xs ${metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}% vs mês anterior
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cobrança</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.collectionRate.toFixed(1)}%
            </div>
            <Progress value={metrics.collectionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {data.currentMonth.paidInvoices}/{data.currentMonth.totalInvoices} faturas pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valores em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.currentMonth.overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.currentMonth.overdueInvoices} faturas • ~{metrics.averageDelayDays} dias médio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Mensal</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.targetProgress.toFixed(0)}%
            </div>
            <Progress value={Math.min(100, metrics.targetProgress)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {formatCurrency(metrics.monthlyTarget)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <span>Cobranças Automáticas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {data.currentMonth.overdueInvoices} faturas em atraso
              </span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                Ação Necessária
              </Badge>
            </div>
            <Button 
              onClick={onNotifyOverdue}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="sm"
            >
              <Mail className="h-4 w-4 mr-2" />
              Notificar Alunos em Atraso
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span>Pagamentos Pendentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {data.currentMonth.pendingInvoices} faturas pendentes
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {formatCurrency(data.currentMonth.pendingAmount)}
              </Badge>
            </div>
            <Button 
              onClick={onMarkOverduePayments}
              variant="outline"
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar Pagamentos Recebidos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Tendência dos Últimos 6 Meses</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} />
                <Area type="monotone" dataKey="overdue" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Métodos de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Métodos de Pagamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {data.paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {data.paymentMethods.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: method.color || COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{formatCurrency(method.amount)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({method.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini Gráfico de Linha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Performance Financeira Detalhada</span>
            </span>
            <Badge variant="outline">Últimos 6 meses</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [formatCurrency(value), '']} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}