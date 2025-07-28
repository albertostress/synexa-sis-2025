/**
 * Report Service - Serviço para boletins escolares Angola (MINED)
 * Conexão com endpoints otimizados do backend
 */
import { api } from '@/lib/api';

export interface AngolaReportCard {
  student: {
    name: string;
    fatherName: string | null;
    className: string;
    shift: string;
    birthDate: string;
    academicYear: number;
  };
  subjects: {
    subjectName: string;
    teacherName: string;
    mac: number | null;
    npp: number | null;
    npt: number | null;
    mt: number | null;
    fal: number;
    classification: string;
  }[];
  averageGrade: number;
  finalStatus: string;
  attendancePercentage: number;
  term: number | null;
  year: number;
  generatedAt: Date;
}

export interface StudentInfo {
  id: string;
  name: string;
}

export interface GetReportParams {
  year: number;
  term?: number;
}

export const reportService = {
  /**
   * FASE 1: Buscar boletim angolano de um aluno específico
   * GET /report-cards/:studentId?year=YYYY&term=X
   */
  getAngolaReportCard: async (studentId: string, params: GetReportParams): Promise<AngolaReportCard> => {
    const queryParams = new URLSearchParams({
      year: params.year.toString(),
      ...(params.term && { term: params.term.toString() })
    });
    
    const response = await api.get(`/report-cards/${studentId}?${queryParams}`);
    return response.data;
  },

  /**
   * FASE 2: Buscar alunos de uma turma para autocomplete
   * GET /report-cards/class/:classId/students
   */
  getStudentsByClass: async (classId: string, year: number): Promise<StudentInfo[]> => {
    if (!classId) {
      throw new Error('ID da turma é obrigatório');
    }
    
    const response = await api.get(`/report-cards/class/${classId}/students?year=${year}`);
    
    if (!Array.isArray(response.data)) {
      console.warn('Resposta inesperada da API de alunos:', response.data);
      return [];
    }
    
    return response.data;
  },

  /**
   * Função específica para relatórios (alias para compatibilidade)
   */
  getReportStudentsByClass: async (classId: string, year: number = new Date().getFullYear()): Promise<StudentInfo[]> => {
    return reportService.getStudentsByClass(classId, year);
  },

  /**
   * FASE 4: Gerar PDF do boletim angolano
   * POST /report-cards/:studentId/pdf
   */
  generateReportCardPdf: async (studentId: string, params: GetReportParams): Promise<Blob> => {
    const response = await api.post(`/report-cards/${studentId}/pdf`, params, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  /**
   * FASE 4: Gerar PDF com nome de arquivo
   */
  generateReportCardPdfWithFilename: async (
    studentId: string, 
    params: GetReportParams
  ): Promise<{ blob: Blob; filename: string }> => {
    const response = await api.post(`/report-cards/${studentId}/pdf`, params, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'boletim_angola.pdf'; // fallback
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="?([^"]+)"?/);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }
    
    return {
      blob: response.data,
      filename
    };
  },

  /**
   * Helper para iniciar download do PDF
   */
  triggerDownload: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Helper para filtrar alunos por nome (usado no autocomplete)
   */
  filterStudentsByName: (students: StudentInfo[], searchTerm: string): StudentInfo[] => {
    if (!searchTerm || searchTerm.length < 2) {
      return students;
    }
    
    const normalizedSearch = searchTerm.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(normalizedSearch)
    );
  }
};