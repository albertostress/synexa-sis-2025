/**
 * Sistema de classificação de notas - Padrão Angola
 * Apenas duas classificações baseadas na nota de 0-20
 */

export type GradeClassification = "APROVADO" | "REPROVADO";

export interface ClassificationResult {
  label: GradeClassification;
  color: string;
  bgColor: string;
  icon: string;
  textColor: string;
}

/**
 * Função principal para obter classificação simples
 * @param nota - Nota numérica de 0 a 20
 * @returns "APROVADO" se nota >= 10, "REPROVADO" se nota < 10
 */
export function getSimpleClassification(nota: number): GradeClassification {
  return nota >= 10 ? "APROVADO" : "REPROVADO";
}

/**
 * Função completa para obter classificação com cores e ícones
 * @param nota - Nota numérica de 0 a 20
 * @returns Objeto com label, cores e ícone para renderização
 */
export function getGradeClassificationData(nota: number): ClassificationResult {
  if (nota >= 10) {
    return {
      label: "APROVADO",
      color: "bg-green-100 border-green-200",
      bgColor: "bg-green-50",
      icon: "✅",
      textColor: "text-green-700"
    };
  }
  
  return {
    label: "REPROVADO", 
    color: "bg-red-100 border-red-200",
    bgColor: "bg-red-50",
    icon: "❌",
    textColor: "text-red-700"
  };
}

/**
 * Função para obter cor de fundo da célula da nota
 * @param nota - Nota numérica de 0 a 20
 * @returns Classe CSS para fundo colorido
 */
export function getGradeBackgroundColor(nota: number): string {
  return nota >= 10 
    ? "bg-green-50 border-l-green-500" 
    : "bg-red-50 border-l-red-500";
}

/**
 * Verifica se a nota é de aprovação
 * @param nota - Nota numérica de 0 a 20
 * @returns true se aprovado (>= 10), false se reprovado (< 10)
 */
export function isApproved(nota: number): boolean {
  return nota >= 10;
}