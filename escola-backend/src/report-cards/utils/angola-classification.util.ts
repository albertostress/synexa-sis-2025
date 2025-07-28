/**
 * Utilitários para classificação do sistema educacional angolano (MINED)
 * Sistema de 0-20 pontos
 */

/**
 * Calcula a Média Trimestral (MT) seguindo a fórmula angolana
 * MT = (MAC + NPP + NPT) / 3
 */
export function calculateMT(mac: number | null, npp: number | null, npt: number | null): number | null {
  // Verificar se pelo menos uma nota existe
  const validGrades = [mac, npp, npt].filter(grade => grade !== null && grade !== undefined);
  
  if (validGrades.length === 0) {
    return null;
  }

  // Se todas as 3 notas existem, usar a fórmula padrão
  if (mac !== null && npp !== null && npt !== null) {
    return Math.round(((mac + npp + npt) / 3) * 100) / 100;
  }

  // Se apenas algumas notas existem, calcular média das disponíveis
  const sum = validGrades.reduce((total, grade) => total + grade, 0);
  return Math.round((sum / validGrades.length) * 100) / 100;
}

/**
 * Determina a classificação textual baseada na MT (Sistema Angolano)
 */
export function getAngolaClassification(mt: number | null): string {
  if (mt === null || mt === undefined) {
    return 'Não Avaliado';
  }

  if (mt >= 17 && mt <= 20) {
    return 'Excelente';
  } else if (mt >= 14 && mt <= 16) {
    return 'Muito Bom';
  } else if (mt >= 12 && mt <= 13) {
    return 'Bom';
  } else if (mt >= 10 && mt <= 11) {
    return 'Satisfatório';
  } else {
    return 'Não Satisfatório';
  }
}

/**
 * Determina a situação final do aluno (Sistema Angolano)
 * Aprovado se MT >= 10 em todas as disciplinas
 */
export function getFinalStatus(subjectMTs: (number | null)[]): string {
  const validMTs = subjectMTs.filter(mt => mt !== null && mt !== undefined) as number[];
  
  if (validMTs.length === 0) {
    return 'Sem Avaliação';
  }

  // Aluno é aprovado se todas as MTs são >= 10
  const allApproved = validMTs.every(mt => mt >= 10);
  return allApproved ? 'Aprovado' : 'Reprovado';
}

/**
 * Calcula a média geral (média das MTs válidas)
 */
export function calculateGeneralAverage(subjectMTs: (number | null)[]): number {
  const validMTs = subjectMTs.filter(mt => mt !== null && mt !== undefined) as number[];
  
  if (validMTs.length === 0) {
    return 0;
  }

  const sum = validMTs.reduce((total, mt) => total + mt, 0);
  return Math.round((sum / validMTs.length) * 100) / 100;
}

/**
 * Formatar turno para exibição em português
 */
export function formatShift(shift: string): string {
  const shiftMap: Record<string, string> = {
    'MORNING': 'Manhã',
    'AFTERNOON': 'Tarde',
    'EVENING': 'Noite',
  };

  return shiftMap[shift] || shift;
}

/**
 * Formatar data para padrão angolano (DD/MM/YYYY)
 */
export function formatDateForAngola(date: Date): string {
  return date.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}