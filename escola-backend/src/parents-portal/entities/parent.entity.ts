/**
 * Parent Entities - Entidades para documentação Swagger do portal dos pais
 * Referência: context7 mcp - NestJS Entities Pattern
 */
import { ApiProperty } from '@nestjs/swagger';

export class StudentBasicEntity {
  @ApiProperty({
    description: 'ID único do aluno',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do aluno',
    example: 'João Silva Santos',
  })
  name: string;

  @ApiProperty({
    description: 'Email do aluno',
    example: 'joao.santos@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Data de nascimento',
    example: '2010-05-15',
  })
  birthDate: string;

  @ApiProperty({
    description: 'Informações da turma (se matriculado)',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: '3° Ano A' },
      shift: { type: 'string', example: 'MORNING' },
    },
    required: false,
  })
  schoolClass?: {
    id: string;
    name: string;
    shift: string;
  };
}

export class ParentEntity {
  @ApiProperty({
    description: 'ID único do responsável',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do responsável',
    example: 'Maria Silva Santos',
  })
  name: string;

  @ApiProperty({
    description: 'Email do responsável',
    example: 'maria.silva@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Telefone de contato',
    example: '+351 91 234 5678',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Lista de filhos associados',
    type: [StudentBasicEntity],
  })
  students: StudentBasicEntity[];

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-07-15T10:00:00.000Z',
  })
  createdAt: string;
}

export class GradeEntity {
  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'Matemática',
  })
  subjectName: string;

  @ApiProperty({
    description: 'Nota obtida',
    example: 8.5,
  })
  grade: number;

  @ApiProperty({
    description: 'Nome do professor',
    example: 'Prof. Carlos Silva',
  })
  teacherName: string;

  @ApiProperty({
    description: 'Data da avaliação',
    example: '2024-08-15',
  })
  createdAt: string;
}

export class StudentGradesEntity {
  @ApiProperty({
    description: 'Informações básicas do aluno',
    type: StudentBasicEntity,
  })
  student: StudentBasicEntity;

  @ApiProperty({
    description: 'Ano letivo das notas',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Lista de notas do aluno',
    type: [GradeEntity],
  })
  grades: GradeEntity[];

  @ApiProperty({
    description: 'Média geral do aluno',
    example: 8.2,
  })
  averageGrade: number;

  @ApiProperty({
    description: 'Status acadêmico atual',
    example: 'APROVADO',
    enum: ['APROVADO', 'REPROVADO', 'EM_RECUPERACAO'],
  })
  status: string;
}

export class PaymentEntity {
  @ApiProperty({
    description: 'ID da fatura',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Descrição da fatura',
    example: 'Mensalidade - Agosto 2024',
  })
  description: string;

  @ApiProperty({
    description: 'Valor total da fatura',
    example: 85.50,
  })
  amount: number;

  @ApiProperty({
    description: 'Data de vencimento',
    example: '2024-08-15',
  })
  dueDate: string;

  @ApiProperty({
    description: 'Status da fatura',
    example: 'PENDENTE',
    enum: ['PENDENTE', 'PAGA', 'VENCIDA', 'CANCELADA'],
  })
  status: string;

  @ApiProperty({
    description: 'Total pago até o momento',
    example: 42.75,
  })
  totalPaid: number;

  @ApiProperty({
    description: 'Saldo restante',
    example: 42.75,
  })
  remainingBalance: number;

  @ApiProperty({
    description: 'Mês/Ano de referência',
    example: '8/2024',
  })
  period: string;
}

export class StudentPaymentsEntity {
  @ApiProperty({
    description: 'Informações básicas do aluno',
    type: StudentBasicEntity,
  })
  student: StudentBasicEntity;

  @ApiProperty({
    description: 'Lista de faturas do aluno',
    type: [PaymentEntity],
  })
  payments: PaymentEntity[];

  @ApiProperty({
    description: 'Resumo financeiro',
    type: 'object',
    properties: {
      totalAmount: { type: 'number', example: 855.00 },
      totalPaid: { type: 'number', example: 427.50 },
      totalPending: { type: 'number', example: 427.50 },
      overdueCount: { type: 'number', example: 2 },
    },
  })
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    overdueCount: number;
  };
}

export class DocumentEntity {
  @ApiProperty({
    description: 'Tipo do documento',
    example: 'CERTIFICADO',
    enum: ['CERTIFICADO', 'DECLARACAO', 'HISTORICO', 'FATURA'],
  })
  type: string;

  @ApiProperty({
    description: 'Nome do arquivo',
    example: 'certificado_joao_2024.pdf',
  })
  filename: string;

  @ApiProperty({
    description: 'Descrição do documento',
    example: 'Certificado de conclusão - 2024',
  })
  description: string;

  @ApiProperty({
    description: 'Data de geração',
    example: '2024-08-15T14:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'URL para download do PDF',
    example: '/parents-portal/student/123/docs/certificado/download',
  })
  downloadUrl: string;
}

export class MessageEntity {
  @ApiProperty({
    description: 'ID único da mensagem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Título da mensagem',
    example: 'Reunião de Pais - Setembro 2024',
  })
  title: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    example: 'Informamos que haverá reunião de pais no dia 15 de setembro...',
  })
  content: string;

  @ApiProperty({
    description: 'Tipo da mensagem',
    example: 'EVENTO',
    enum: ['GERAL', 'ACADEMICO', 'FINANCEIRO', 'EVENTO', 'URGENTE'],
  })
  type: string;

  @ApiProperty({
    description: 'Prioridade da mensagem',
    example: 'NORMAL',
    enum: ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'],
  })
  priority: string;

  @ApiProperty({
    description: 'Autor da mensagem',
    example: 'Direção Escolar',
  })
  author: string;

  @ApiProperty({
    description: 'Data de publicação',
    example: '2024-08-15T09:00:00.000Z',
  })
  publishedAt: string;

  @ApiProperty({
    description: 'Data de expiração (opcional)',
    example: '2024-09-15T23:59:59.000Z',
    required: false,
  })
  expiresAt?: string;
}