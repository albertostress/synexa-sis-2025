import { z } from 'zod';

// Schema do DTO baseado no backend real (sem biNumber, com phone e parentPhone)
const CreateStudentDtoSchema = z.object({
  // ✅ OBRIGATÓRIOS - Identificação Pessoal
  firstName: z.string()
    .min(2, 'Primeiro nome deve ter no mínimo 2 caracteres')
    .max(100, 'Primeiro nome deve ter no máximo 100 caracteres')
    .trim(),
  lastName: z.string()
    .min(2, 'Último nome deve ter no mínimo 2 caracteres')
    .max(100, 'Último nome deve ter no máximo 100 caracteres')
    .trim(),
  gender: z.enum(['MASCULINO', 'FEMININO'], {
    required_error: 'Gênero é obrigatório'
  }),
  birthDate: z.string()
    .min(1, 'Data de nascimento é obrigatória'),
  
  // ✅ OBRIGATÓRIOS - Identificação 
  biNumber: z.string()
    .min(8, 'Número do BI deve ter no mínimo 8 caracteres')
    .max(20, 'Número do BI deve ter no máximo 20 caracteres')
    .regex(/^\d{6,9}[A-Z]{2}\d{3}$/, 'Formato inválido do BI (ex: 003456789LA042)'),
  
  // ✅ OBRIGATÓRIOS - Dados Académicos
  classId: z.string()
    .min(1, 'Classe é obrigatória'),
  academicYear: z.string()
    .min(4, 'Ano letivo deve ter no mínimo 4 caracteres'),
  
  // ✅ OBRIGATÓRIOS - Localização
  province: z.string()
    .min(3, 'Província deve ter no mínimo 3 caracteres'),
  municipality: z.string()
    .min(3, 'Município deve ter no mínimo 3 caracteres'),
  country: z.string()
    .default('Angola'),
  
  // ✅ OBRIGATÓRIOS - Dados dos Pais/Encarregado
  guardianName: z.string()
    .min(2, 'Nome do encarregado é obrigatório'),
  guardianPhone: z.string()
    .min(9, 'Telefone do encarregado deve ter no mínimo 9 dígitos'),
  parentEmail: z.string()
    .email('Email dos pais deve ser válido'),
  parentPhone: z.string()
    .min(9, 'Telefone dos pais deve ter no mínimo 9 dígitos'),
  
  // 🟡 OPCIONAIS - Status e metadados
  status: z.enum(['ATIVO', 'TRANSFERIDO', 'DESISTENTE', 'CONCLUIDO'])
    .optional()
    .default('ATIVO'),
  tags: z.array(z.string())
    .optional()
    .default([])
});

// Tipo inferido do schema
export type CreateStudentDto = z.infer<typeof CreateStudentDtoSchema>;

/**
 * Mapeia os dados do formulário de estudante para o DTO esperado pelo backend
 * com validação robusta e filtragem de campos inválidos
 * 
 * @param formData - Dados do formulário com campos flat
 * @returns CreateStudentDto - Objeto validado e formatado para a API
 */
export function mapStudentFormToDto(formData: any): CreateStudentDto {
  // Mapear dados do formulário para o formato esperado pelo backend
  const dto = {
    // ✅ OBRIGATÓRIOS - Identificação Pessoal
    firstName: formData.firstName?.trim() || '',
    lastName: formData.lastName?.trim() || '',
    gender: formData.gender || 'MASCULINO',
    birthDate: formatDateForBackend(formData.birthDate),
    
    // ✅ OBRIGATÓRIOS - Identificação (biNumber conforme backend)
    biNumber: formData.biNumber?.trim() || '',
    
    // ✅ OBRIGATÓRIOS - Dados Académicos  
    classId: formData.classId?.trim() || '',
    academicYear: formData.academicYear?.trim() || '',
    
    // ✅ OBRIGATÓRIOS - Localização
    province: formData.province?.trim() || '',
    municipality: formData.municipality?.trim() || '',
    country: formData.country?.trim() || 'Angola',
    
    // ✅ OBRIGATÓRIOS - Dados dos Pais/Encarregado
    guardianName: formData.guardianName?.trim() || '',
    guardianPhone: formData.guardianPhone?.trim() || '',
    parentEmail: formData.parentEmail?.trim() || formData.guardianEmail?.trim() || '',
    parentPhone: formData.parentPhone?.trim() || formData.guardianPhone?.trim() || '',
    
    // 🟡 OPCIONAIS - Status e metadados
    status: isValidStatus(formData.status) ? formData.status : 'ATIVO',
    tags: sanitizeTags(formData.tags)
  };

  // Validar e retornar DTO
  try {
    const validatedDto = CreateStudentDtoSchema.parse(dto);
    
    // Log para debug (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      console.log('✅ DTO validado com sucesso:', validatedDto);
    }
    
    return validatedDto;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detailedErrors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ');
      
      console.error('❌ Erro de validação DTO:', error.errors);
      throw new Error(`Dados inválidos: ${detailedErrors}`);
    }
    throw error;
  }
}

/**
 * Funções auxiliares para sanitização de dados
 */

// Formatar data para formato ISO (YYYY-MM-DD)
function formatDateForBackend(date: any): string {
  if (!date) return '';
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    // Se já está no formato ISO, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Tentar converter outros formatos
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  return '';
}

// Validar se o status é válido
function isValidStatus(status: any): boolean {
  return ['ATIVO', 'TRANSFERIDO', 'DESISTENTE', 'CONCLUIDO'].includes(status);
}

// Sanitizar array de tags
function sanitizeTags(tags: any): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(tag => tag.trim())
    .slice(0, 10); // Máximo 10 tags
}

// Sanitizar número de telefone
function sanitizePhone(phone: any): string {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^\d+\s\-\(\)]/g, '').trim();
}

// Remover campos undefined, null ou strings vazias
function removeEmptyFields(obj: any): any {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length === 0) {
        // Arrays vazios são mantidos apenas para tags
        if (key === 'tags') cleaned[key] = value;
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * Verifica se os dados mínimos obrigatórios estão preenchidos
 */
export function hasMinimumRequiredFields(formData: any): boolean {
  const requiredFields = [
    'firstName', 'lastName', 'gender', 'biNumber', 'birthDate', 
    'classId', 'academicYear', 'province', 'municipality'
  ];
  return requiredFields.every(field => {
    const value = formData[field];
    return value && (typeof value === 'string' ? value.trim() !== '' : true);
  });
}

/**
 * Retorna lista de campos obrigatórios em falta
 */
export function getMissingRequiredFields(formData: any): string[] {
  const requiredFields = [
    { field: 'firstName', label: 'Primeiro nome' },
    { field: 'lastName', label: 'Último nome' },
    { field: 'gender', label: 'Gênero' },
    { field: 'biNumber', label: 'Número do BI' },
    { field: 'birthDate', label: 'Data de nascimento' },
    { field: 'classId', label: 'Classe' },
    { field: 'academicYear', label: 'Ano letivo' },
    { field: 'province', label: 'Província' },
    { field: 'municipality', label: 'Município' }
  ];
  
  return requiredFields
    .filter(({ field }) => {
      const value = formData[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    })
    .map(({ label }) => label);
}

/**
 * Função auxiliar para extrair apenas os campos permitidos
 * (alternativa mais segura se preferir)
 */
export function mapStudentFormToDtoStrict(formData: any): CreateStudentDto {
  // Extrair apenas os campos permitidos
  const allowedFields = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    gender: formData.gender as 'MASCULINO' | 'FEMININO',
    birthDate: formData.birthDate,
    province: formData.province,
    municipality: formData.municipality,
    status: (formData.status || 'ATIVO') as 'ATIVO' | 'TRANSFERIDO' | 'DESISTENTE' | 'CONCLUIDO',
    tags: Array.isArray(formData.tags) ? formData.tags : [],
    
    guardian: {
      name: formData.guardianName || '',
      phone: formData.guardianPhone || '',
      email: formData.guardianEmail || formData.parentEmail || '',
      relationship: formData.guardianRelationship || '',
      address: formData.guardianAddress || '',
      bi: formData.guardianId || ''
    }
  };

  return CreateStudentDtoSchema.parse(allowedFields);
}

/**
 * Função para debug - mostra quais campos serão removidos
 */
export function getUnusedFormFields(formData: any): string[] {
  const validDtoFields = [
    'firstName', 'lastName', 'gender', 'birthDate', 
    'province', 'municipality', 'status', 'tags'
  ];
  
  const guardianFields = [
    'guardianName', 'guardianPhone', 'guardianEmail',
    'guardianRelationship', 'guardianAddress', 'guardianId'
  ];

  return Object.keys(formData).filter(key => 
    !validDtoFields.includes(key) && !guardianFields.includes(key)
  );
}

/**
 * Exemplo de uso:
 * 
 * const formData = {
 *   firstName: "Pedro",
 *   lastName: "Costa",
 *   birthDate: "2007-11-10",
 *   gender: "MASCULINO",
 *   province: "Luanda",
 *   municipality: "Belas",
 *   status: "ATIVO",
 *   tags: ["bolseiro", "monitor"],
 *   guardianName: "Maria",
 *   guardianRelationship: "Mãe",
 *   guardianPhone: "+244927180794",
 *   guardianEmail: "email@exemplo.com",
 *   guardianAddress: "Rua ABC",
 *   // Campos que serão removidos:
 *   studentPhoto: File,
 *   biDocument: File,
 *   studentCard: File,
 *   observations: "Alguma observação"
 * };
 * 
 * const dto = mapStudentFormToDto(formData);
 * // Resultado:
 * // {
 * //   firstName: "Pedro",
 * //   lastName: "Costa",
 * //   gender: "MASCULINO",
 * //   birthDate: "2007-11-10",
 * //   province: "Luanda",
 * //   municipality: "Belas",
 * //   status: "ATIVO",
 * //   tags: ["bolseiro", "monitor"],
 * //   guardian: {
 * //     name: "Maria",
 * //     phone: "+244927180794",
 * //     email: "email@exemplo.com",
 * //     relationship: "Mãe",
 * //     address: "Rua ABC",
 * //     bi: "39939393932"
 * //   }
 * // }
 */