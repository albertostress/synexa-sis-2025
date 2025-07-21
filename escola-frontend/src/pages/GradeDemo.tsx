import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getGradeClassification, getGradeBackgroundClass } from '@/types/grade';

// Dados de exemplo para demonstração
const sampleGrades = [
  { value: 18.5, student: 'Maria dos Santos', subject: 'Matemática' },
  { value: 17.0, student: 'João Manuel', subject: 'Português' },
  { value: 15.5, student: 'Ana Pereira', subject: 'História' },
  { value: 13.0, student: 'Carlos Silva', subject: 'Física' },
  { value: 11.5, student: 'Isabel Costa', subject: 'Química' },
  { value: 9.0, student: 'Pedro Rodrigues', subject: 'Geografia' }
];

export default function GradeDemo() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🎯 Demo: Nova Visualização de Notas</h1>
        <p className="text-muted-foreground">
          Sistema de gestão escolar com separação visual entre Nota e Classificação
        </p>
      </div>

      {/* Legenda das classificações */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Sistema de Classificação Angolano (0-20)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { range: '10 – 20', label: 'Aprovado', icon: '✅', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
              { range: '0 – 9.9', label: 'Reprovado', icon: '❌', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
            ].map((item, index) => (
              <div key={index} className={`p-4 border border-l-4 rounded-md ${item.bg}`}>
                <div className="text-xl font-semibold">{item.range}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className={`${item.color} text-lg font-medium`}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>✅ <strong>Nota mínima para aprovação:</strong> 10 valores</p>
            <p>📍 <strong>Sistema:</strong> Escala de 0 a 20 valores (Angola)</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de exemplo */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Exemplo da Nova Tabela de Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Classificação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleGrades.map((grade, index) => {
                const classification = getGradeClassification(grade.value);
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{grade.student}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{grade.subject}</span>
                    </TableCell>
                    <TableCell className={`${getGradeBackgroundClass(grade.value)} border-l-4`}>
                      <div className="px-2 py-1 rounded-md">
                        <span className="font-bold text-lg">
                          {grade.value.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{classification.icon}</span>
                        <span className={classification.color}>
                          {classification.label}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Comparação Antes vs Depois */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">❌ Antes (Comportamento Antigo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded">
                <strong>Coluna "Nota":</strong>
                <div className="mt-2 space-y-1">
                  <div>🟥 9.0 – Reprovado</div>
                  <div>🟢 17.0 – Aprovado</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ Depois (Novo Comportamento)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded">
                <strong>Coluna 1 → "Nota":</strong>
                <div className="mt-2 space-y-1">
                  <div className="bg-red-50 border-red-200 border-l-4 p-2 rounded inline-block">
                    <span className="font-bold text-lg">9.0</span>
                  </div>
                  <div className="bg-green-50 border-green-200 border-l-4 p-2 rounded inline-block">
                    <span className="font-bold text-lg">17.0</span>
                  </div>
                </div>
              </div>
              <div className="p-3 border rounded">
                <strong>Coluna 2 → "Classificação":</strong>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span>❌</span>
                    <span className="text-red-600">Reprovado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span className="text-green-600">Aprovado</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        💡 Acesse <strong>/grades</strong> para ver a implementação completa no sistema
      </div>
    </div>
  );
}