/**
 * Tipos para módulo de Documentos - Sistema Escolar Angolano
 * Adaptado para mercado angolano com documentos oficiais
 */

// Tipos de documentos oficiais em Angola
export type DocumentType = 
  | 'CERTIFICADO_CONCLUSAO' 
  | 'DECLARACAO_MATRICULA' 
  | 'HISTORICO_ESCOLAR' 
  | 'BOLETIM_ESCOLAR'
  | 'ATESTADO_FREQUENCIA'
  | 'TRANSFERENCIA_ESCOLAR';

export type DocumentStatus = 
  | 'PENDENTE' 
  | 'EM_PROCESSAMENTO' 
  | 'PRONTO' 
  | 'ENTREGUE' 
  | 'REJEITADO' 
  | 'EM_REVISAO';

// Interface para dados do estudante (Angola)
export interface StudentDocumentInfo {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  birthDate: string;
  municipality: string;
  province: string;
  academicYear: string;
  className: string;
}

// Interface para solicitação de documento
export interface DocumentRequest {
  id: string;
  studentId: string;
  student: StudentDocumentInfo;
  type: DocumentType;
  title: string;
  description?: string;
  purpose?: string; // Finalidade (bolsa, transferência, etc.)
  status: DocumentStatus;
  requestDate: string;
  processedDate?: string;
  deliveryDate?: string;
  rejectionReason?: string;
  requestedBy: string; // Quem solicitou
  processedBy?: string; // Quem processou
  notes?: string;
}

// DTOs para criação/atualização
export interface CreateDocumentRequestDto {
  studentId: string;
  type: DocumentType;
  title: string;
  description?: string;
  purpose?: string;
}

export interface UpdateDocumentStatusDto {
  status: DocumentStatus;
  notes?: string;
  rejectionReason?: string;
}

// Dados específicos para cada tipo de documento
export interface CertificateData {
  documentType: 'CERTIFICADO_CONCLUSAO';
  studentName: string;
  birthDate: string;
  className: string;
  shift: string;
  year: number;
  subjects: CertificateSubject[];
  overallAverage: number;
  finalStatus: 'APROVADO' | 'REPROVADO';
  institutionName: string;
  city: string;
  province: string;
  issueDate: string;
  issuer: string;
  issuerRole: string;
}

export interface CertificateSubject {
  subjectName: string;
  finalGrade: number;
  status: 'APROVADO' | 'REPROVADO';
}

export interface DeclarationData {
  documentType: 'DECLARACAO_MATRICULA';
  studentName: string;
  birthDate: string;
  className: string;
  shift: string;
  year: number;
  enrollmentStatus: string;
  enrollmentDate: string;
  institutionName: string;
  institutionAddress: string;
  city: string;
  province: string;
  issueDate: string;
  issuer: string;
  issuerRole: string;
  purpose: string;
}

export interface TranscriptData {
  documentType: 'HISTORICO_ESCOLAR';
  studentName: string;
  birthDate: string;
  rg?: string;
  cpf?: string;
  motherName?: string;
  fatherName?: string;
  years: TranscriptYear[];
  overallAverage: number;
  overallStatus: 'APROVADO' | 'REPROVADO' | 'CURSANDO';
  startDate: string;
  endDate?: string;
  institutionName: string;
  institutionAddress: string;
  city: string;
  province: string;
  issueDate: string;
  issuer: string;
  issuerRole: string;
}

export interface TranscriptYear {
  year: number;
  className: string;
  subjects: TranscriptSubject[];
  yearAverage: number;
  yearStatus: 'APROVADO' | 'REPROVADO' | 'EM_RECUPERACAO';
}

export interface TranscriptSubject {
  subjectName: string;
  year: number;
  finalGrade: number;
  status: 'APROVADO' | 'REPROVADO';
  workload: number; // Carga horária
}

// Interface para filtros de pesquisa
export interface DocumentFilters {
  search?: string;
  type?: DocumentType | 'ALL';
  status?: DocumentStatus | 'ALL';
  province?: string;
  startDate?: string;
  endDate?: string;
  requestedBy?: string;
}

// Interface para resposta da API
export interface DocumentsResponse {
  documents: DocumentRequest[];
  total: number;
  page: number;
  pageSize: number;
}

// Interface para download de PDF
export interface DocumentPdfResponse {
  data: CertificateData | DeclarationData | TranscriptData;
  pdf: string; // Base64
  filename: string;
}

// Labels traduzidos para português angolano
export const DocumentTypeLabels: Record<DocumentType, string> = {
  CERTIFICADO_CONCLUSAO: 'Certificado de Conclusão',
  DECLARACAO_MATRICULA: 'Declaração de Matrícula',
  HISTORICO_ESCOLAR: 'Histórico Escolar',
  BOLETIM_ESCOLAR: 'Boletim Escolar',
  ATESTADO_FREQUENCIA: 'Atestado de Frequência',
  TRANSFERENCIA_ESCOLAR: 'Transferência Escolar',
};

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  PENDENTE: 'Pendente',
  EM_PROCESSAMENTO: 'Em Processamento',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  REJEITADO: 'Rejeitado',
  EM_REVISAO: 'Em Revisão',
};

// Cores para badges de status
export const DocumentStatusColors: Record<DocumentStatus, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  EM_PROCESSAMENTO: 'bg-blue-100 text-blue-800',
  PRONTO: 'bg-green-100 text-green-800',
  ENTREGUE: 'bg-emerald-100 text-emerald-800',
  REJEITADO: 'bg-red-100 text-red-800',
  EM_REVISAO: 'bg-purple-100 text-purple-800',
};

// Províncias de Angola
export const AngolanProvinces = [
  'Luanda',
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Namibe',
  'Uíge',
  'Zaire',
] as const;

export type AngolanProvince = typeof AngolanProvinces[number];