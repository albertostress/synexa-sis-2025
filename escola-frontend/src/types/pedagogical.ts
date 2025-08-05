/**
 * 🎯 Estrutura Pedagógica de Angola
 * Enums e tipos para organização curricular
 */

export enum ClassLevel {
  CLASSE_1 = "CLASSE_1",
  CLASSE_2 = "CLASSE_2", 
  CLASSE_3 = "CLASSE_3",
  CLASSE_4 = "CLASSE_4",
  CLASSE_5 = "CLASSE_5",
  CLASSE_6 = "CLASSE_6",
  CLASSE_7 = "CLASSE_7",
  CLASSE_8 = "CLASSE_8",
  CLASSE_9 = "CLASSE_9",
  CLASSE_10 = "CLASSE_10",
  CLASSE_11 = "CLASSE_11",
  CLASSE_12 = "CLASSE_12"
}

export enum SchoolCycle {
  INICIACAO = "INICIACAO",
  PRIMARIO_1 = "PRIMARIO_1",
  PRIMARIO_2 = "PRIMARIO_2", 
  SECUNDARIO_1 = "SECUNDARIO_1",
  SECUNDARIO_2 = "SECUNDARIO_2"
}

// 🎯 Mapeamentos para exibição no frontend
export const CLASS_LEVEL_LABELS: Record<ClassLevel, string> = {
  [ClassLevel.CLASSE_1]: "1.ª Classe",
  [ClassLevel.CLASSE_2]: "2.ª Classe",
  [ClassLevel.CLASSE_3]: "3.ª Classe",
  [ClassLevel.CLASSE_4]: "4.ª Classe",
  [ClassLevel.CLASSE_5]: "5.ª Classe",
  [ClassLevel.CLASSE_6]: "6.ª Classe",
  [ClassLevel.CLASSE_7]: "7.ª Classe",
  [ClassLevel.CLASSE_8]: "8.ª Classe",
  [ClassLevel.CLASSE_9]: "9.ª Classe",
  [ClassLevel.CLASSE_10]: "10.ª Classe",
  [ClassLevel.CLASSE_11]: "11.ª Classe",
  [ClassLevel.CLASSE_12]: "12.ª Classe",
};

export const SCHOOL_CYCLE_LABELS: Record<SchoolCycle, string> = {
  [SchoolCycle.INICIACAO]: "Iniciação",
  [SchoolCycle.PRIMARIO_1]: "1.º Ciclo do Ensino Primário",
  [SchoolCycle.PRIMARIO_2]: "2.º Ciclo do Ensino Primário", 
  [SchoolCycle.SECUNDARIO_1]: "1.º Ciclo do Ensino Secundário Geral",
  [SchoolCycle.SECUNDARIO_2]: "2.º Ciclo do Ensino Secundário Geral",
};

// 🎯 Helper para obter o ciclo com base na classe
export const getCycleFromClassLevel = (classLevel: ClassLevel): SchoolCycle => {
  switch (classLevel) {
    case ClassLevel.CLASSE_1:
    case ClassLevel.CLASSE_2:
    case ClassLevel.CLASSE_3:
    case ClassLevel.CLASSE_4:
      return SchoolCycle.PRIMARIO_1;
    case ClassLevel.CLASSE_5:
    case ClassLevel.CLASSE_6:
      return SchoolCycle.PRIMARIO_2;
    case ClassLevel.CLASSE_7:
    case ClassLevel.CLASSE_8:
    case ClassLevel.CLASSE_9:
      return SchoolCycle.SECUNDARIO_1;
    case ClassLevel.CLASSE_10:
    case ClassLevel.CLASSE_11:
    case ClassLevel.CLASSE_12:
      return SchoolCycle.SECUNDARIO_2;
    default:
      throw new Error("Classe inválida");
  }
};

// 🎯 Arrays para usar em dropdowns
export const CLASS_LEVEL_OPTIONS = Object.entries(CLASS_LEVEL_LABELS).map(([value, label]) => ({
  value: value as ClassLevel,
  label,
}));

export const SCHOOL_CYCLE_OPTIONS = Object.entries(SCHOOL_CYCLE_LABELS).map(([value, label]) => ({
  value: value as SchoolCycle,
  label,
}));