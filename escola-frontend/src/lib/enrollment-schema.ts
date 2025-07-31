import { z } from 'zod';
import { PROVINCES, GUARDIAN_RELATIONSHIPS, GENDERS } from '../types/enrollment';

// Schema para validação do encarregado
const guardianSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  phone: z
    .string()
    .min(9, 'Telefone deve ter pelo menos 9 dígitos')
    .max(15, 'Telefone muito longo')
    .regex(/^[0-9+\s-]+$/, 'Formato de telefone inválido'),
  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email muito longo'),
  relationship: z
    .string()
    .min(1, 'Relacionamento é obrigatório'),
  address: z
    .string()
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .max(200, 'Endereço muito longo')
});

// Schema para validação do estudante
const studentSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  lastName: z
    .string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Sobrenome deve conter apenas letras'),
  gender: z
    .enum(GENDERS, {
      errorMap: () => ({ message: 'Selecione um género válido' })
    }),
  birthDate: z
    .string()
    .min(1, 'Data de nascimento é obrigatória')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 3 && age <= 25;
    }, 'Idade deve estar entre 3 e 25 anos'),
  biNumber: z
    .string()
    .optional()
    .refine((val) => !val || val.length === 14, 'BI deve ter 14 caracteres')
    .refine((val) => !val || /^[0-9]{9}[A-Z]{2}[0-9]{3}$/.test(val), 'Formato de BI inválido (ex: 123456789LA034)'),
  province: z
    .enum([...PROVINCES] as [string, ...string[]], {
      errorMap: () => ({ message: 'Selecione uma província válida' })
    }),
  municipality: z
    .string()
    .min(2, 'Município deve ter pelo menos 2 caracteres')
    .max(50, 'Município muito longo'),
  observacao: z
    .string()
    .max(500, 'Observação muito longa')
    .optional(),
  guardian: guardianSchema.optional()
});

// Schema principal para matrícula
export const enrollmentSchema = z.object({
  student: studentSchema,
  academicYear: z
    .number()
    .min(2020, 'Ano letivo deve ser maior que 2020')
    .max(2030, 'Ano letivo deve ser menor que 2030'),
  classId: z
    .string()
    .min(1, 'Turma é obrigatória')
    .uuid('ID da turma inválido'),
  status: z
    .enum(['ACTIVE', 'PENDING', 'CANCELLED'])
    .optional()
    .default('ACTIVE')
});

// Schema para validação apenas de estudante (quando usado standalone)
export const studentOnlySchema = studentSchema;

// Schema para validação apenas de encarregado
export const guardianOnlySchema = guardianSchema;

// Tipos inferidos dos schemas
export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
export type GuardianFormData = z.infer<typeof guardianSchema>;

// Valores padrão para o formulário
export const defaultEnrollmentValues: Partial<EnrollmentFormData> = {
  student: {
    firstName: '',
    lastName: '',
    gender: undefined,
    birthDate: '',
    biNumber: '',
    province: undefined,
    municipality: '',
    observacao: '',
    guardian: {
      name: '',
      phone: '',
      email: '',
      relationship: '',
      address: ''
    }
  },
  academicYear: new Date().getFullYear(),
  classId: '',
  status: 'ACTIVE'
};

// Helper para validar apenas o BI
export const validateBI = (bi: string): boolean => {
  return /^[0-9]{9}[A-Z]{2}[0-9]{3}$/.test(bi);
};

// Helper para validar telefone angolano
export const validateAngolanPhone = (phone: string): boolean => {
  // Remove espaços e caracteres especiais
  const cleanPhone = phone.replace(/[\s-+]/g, '');
  // Valida formatos comuns angolanos (9xx xxx xxx ou +244 9xx xxx xxx)
  return /^(\+244)?9[0-9]{8}$/.test(cleanPhone);
};

// Helper para formatar BI enquanto digita
export const formatBI = (value: string): string => {
  // Remove caracteres não numéricos e não alfabéticos
  const clean = value.replace(/[^0-9A-Z]/gi, '').toUpperCase();
  
  // Formata: 123456789LA034
  if (clean.length <= 9) {
    return clean;
  } else if (clean.length <= 11) {
    return clean.slice(0, 9) + clean.slice(9);
  } else {
    return clean.slice(0, 9) + clean.slice(9, 11) + clean.slice(11, 14);
  }
};

// Helper para formatar telefone enquanto digita
export const formatPhone = (value: string): string => {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  // Aplica máscara: 9XX XXX XXX
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`;
  }
};