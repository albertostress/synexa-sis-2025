import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { settingsAPI } from '@/lib/api';
import { 
  Setting, 
  SETTING_KEYS, 
  DEFAULT_SETTINGS, 
  validateSetting,
  SettingCategory 
} from '@/types/settings';

export interface UseSettingsOptions {
  category?: SettingCategory;
  autoSave?: boolean;
  debounceMs?: number;
}

export function useSettings(options: UseSettingsOptions = {}) {
  const { category, autoSave = false, debounceMs = 1000 } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

  // Query for all settings
  const {
    data: settings = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['settings', category],
    queryFn: () => settingsAPI.getAllSettings(category ? { category } : undefined),
    staleTime: 5 * 60 * 1000,
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => 
      settingsAPI.updateSettingByKey(key, value),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      if (!autoSave) {
        toast({
          title: "Configuração atualizada",
          description: "A configuração foi guardada com sucesso.",
        });
      }
    },
    onError: (error: any, { key }) => {
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      toast({
        title: "Erro ao atualizar",
        description: error.response?.data?.message || "Erro inesperado",
        variant: "destructive",
      });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (updates: Record<string, string>) => {
      const promises = Object.entries(updates).map(([key, value]) =>
        settingsAPI.updateSettingByKey(key, value)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setPendingChanges({});
      toast({
        title: "Configurações guardadas",
        description: "Todas as configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao guardar",
        description: error.response?.data?.message || "Erro inesperado",
        variant: "destructive",
      });
    },
  });

  // Get setting value with fallback to default
  const getSetting = useCallback((key: string, defaultValue?: string): string => {
    const setting = settings.find((s: Setting) => s.key === key);
    return setting?.value || defaultValue || DEFAULT_SETTINGS[key] || '';
  }, [settings]);

  // Get boolean setting
  const getBooleanSetting = useCallback((key: string, defaultValue = false): boolean => {
    const value = getSetting(key, defaultValue.toString());
    return value === 'true' || value === '1';
  }, [getSetting]);

  // Get number setting
  const getNumberSetting = useCallback((key: string, defaultValue = 0): number => {
    const value = getSetting(key, defaultValue.toString());
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }, [getSetting]);

  // Update setting with validation
  const updateSetting = useCallback((key: string, value: string, immediate = false) => {
    // Validate the setting
    const validation = validateSetting(key, value);
    if (!validation.isValid) {
      toast({
        title: "Valor inválido",
        description: validation.message,
        variant: "destructive",
      });
      return false;
    }

    if (immediate || autoSave) {
      updateSettingMutation.mutate({ key, value });
    } else {
      setPendingChanges(prev => ({ ...prev, [key]: value }));
    }
    return true;
  }, [updateSettingMutation, autoSave, toast]);

  // Update boolean setting
  const updateBooleanSetting = useCallback((key: string, value: boolean, immediate = false) => {
    return updateSetting(key, value.toString(), immediate);
  }, [updateSetting]);

  // Update number setting
  const updateNumberSetting = useCallback((key: string, value: number, immediate = false) => {
    return updateSetting(key, value.toString(), immediate);
  }, [updateSetting]);

  // Save all pending changes
  const saveAll = useCallback(() => {
    if (Object.keys(pendingChanges).length > 0) {
      bulkUpdateMutation.mutate(pendingChanges);
    }
  }, [pendingChanges, bulkUpdateMutation]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    try {
      await settingsAPI.resetToDefaults();
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setPendingChanges({});
      toast({
        title: "Configurações restauradas",
        description: "Todas as configurações foram repostas para os valores padrão.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao restaurar",
        description: error.response?.data?.message || "Erro inesperado",
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);

  // Export settings
  const exportSettings = useCallback(async () => {
    try {
      const blob = await settingsAPI.exportSettings();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuracoes-synexa-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Export concluído",
        description: "As configurações foram exportadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Não foi possível exportar as configurações.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Get settings by category
  const getSettingsByCategory = useCallback((cat: SettingCategory) => {
    return settings.filter((s: Setting) => s.category === cat);
  }, [settings]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  // Get all school settings as an object
  const getSchoolSettings = useCallback(() => ({
    name: getSetting(SETTING_KEYS.SCHOOL_NAME),
    address: getSetting(SETTING_KEYS.SCHOOL_ADDRESS),
    phone: getSetting(SETTING_KEYS.SCHOOL_PHONE),
    email: getSetting(SETTING_KEYS.SCHOOL_EMAIL),
    website: getSetting(SETTING_KEYS.SCHOOL_WEBSITE),
  }), [getSetting]);

  // Get all system settings as an object
  const getSystemSettings = useCallback(() => ({
    language: getSetting(SETTING_KEYS.SYSTEM_LANGUAGE),
    timezone: getSetting(SETTING_KEYS.SYSTEM_TIMEZONE),
    dateFormat: getSetting(SETTING_KEYS.SYSTEM_DATE_FORMAT),
    currency: getSetting(SETTING_KEYS.SYSTEM_CURRENCY),
    theme: getSetting(SETTING_KEYS.SYSTEM_THEME),
  }), [getSetting]);

  // Get all academic settings as an object
  const getAcademicSettings = useCallback(() => ({
    year: getSetting(SETTING_KEYS.ACADEMIC_YEAR),
    semesterStart: getSetting(SETTING_KEYS.ACADEMIC_SEMESTER_START),
    semesterEnd: getSetting(SETTING_KEYS.ACADEMIC_SEMESTER_END),
    gradingScale: getSetting(SETTING_KEYS.ACADEMIC_GRADING_SCALE),
    passGrade: getNumberSetting(SETTING_KEYS.ACADEMIC_PASS_GRADE),
    maxAbsences: getNumberSetting(SETTING_KEYS.ACADEMIC_MAX_ABSENCES),
  }), [getSetting, getNumberSetting]);

  return {
    // Data
    settings,
    pendingChanges,
    hasUnsavedChanges,
    
    // Loading states
    isLoading,
    error,
    isSaving: updateSettingMutation.isPending || bulkUpdateMutation.isPending,
    
    // Getters
    getSetting,
    getBooleanSetting,
    getNumberSetting,
    getSettingsByCategory,
    getSchoolSettings,
    getSystemSettings,
    getAcademicSettings,
    
    // Setters
    updateSetting,
    updateBooleanSetting,
    updateNumberSetting,
    
    // Actions
    saveAll,
    resetToDefaults,
    exportSettings,
    refetch,
  };
}

// Specialized hooks for specific categories
export const useSchoolSettings = () => useSettings({ category: SettingCategory.SCHOOL });
export const useSystemSettings = () => useSettings({ category: SettingCategory.SYSTEM });
export const useAcademicSettings = () => useSettings({ category: SettingCategory.ACADEMIC });
export const useSecuritySettings = () => useSettings({ category: SettingCategory.SECURITY });
export const useNotificationSettings = () => useSettings({ category: SettingCategory.NOTIFICATIONS });
export const useBackupSettings = () => useSettings({ category: SettingCategory.BACKUP });