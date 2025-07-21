import { useEffect, useCallback } from 'react';
import { useSettings } from './useSettings';
import { SETTING_KEYS } from '@/types/settings';

export type FontSizeScale = 'small' | 'default' | 'large' | 'extra-large' | 'huge';

interface FontSizeConfig {
  scale: FontSizeScale;
  label: string;
  description: string;
  multiplier: number;
}

export const FONT_SIZE_OPTIONS: FontSizeConfig[] = [
  {
    scale: 'small',
    label: 'Pequeno',
    description: 'Texto mais compacto (87.5%)',
    multiplier: 0.875,
  },
  {
    scale: 'default',
    label: 'Normal',
    description: 'Tamanho padrão (100%)',
    multiplier: 1.0,
  },
  {
    scale: 'large',
    label: 'Grande',
    description: 'Texto maior (112.5%)',
    multiplier: 1.125,
  },
  {
    scale: 'extra-large',
    label: 'Extra Grande',
    description: 'Texto bem maior (125%)',
    multiplier: 1.25,
  },
  {
    scale: 'huge',
    label: 'Enorme',
    description: 'Texto muito grande (150%)',
    multiplier: 1.5,
  },
];

export function useFontSize() {
  const { getSetting, updateSetting } = useSettings();

  // Get current font size from settings
  const currentFontSize = getSetting(SETTING_KEYS.SYSTEM_FONT_SIZE, 'default') as FontSizeScale;

  // Get current font config
  const getCurrentConfig = useCallback((): FontSizeConfig => {
    return FONT_SIZE_OPTIONS.find(option => option.scale === currentFontSize) || FONT_SIZE_OPTIONS[1];
  }, [currentFontSize]);

  // Apply font size to document root
  const applyFontSize = useCallback((scale: FontSizeScale) => {
    const config = FONT_SIZE_OPTIONS.find(option => option.scale === scale);
    if (!config) return;

    // Apply to CSS custom property
    document.documentElement.style.setProperty('--font-scale', config.multiplier.toString());
    
    // Apply to body class for Tailwind utilities
    document.body.className = document.body.className
      .replace(/font-scale-\w+/g, '')
      .concat(` font-scale-${scale}`);
    
    // Store in localStorage for immediate application on page load
    localStorage.setItem('synexa-font-size', scale);
  }, []);

  // Update font size and save to settings
  const setFontSize = useCallback((scale: FontSizeScale, immediate = true) => {
    applyFontSize(scale);
    updateSetting(SETTING_KEYS.SYSTEM_FONT_SIZE, scale, immediate);
  }, [applyFontSize, updateSetting]);

  // Increase font size
  const increaseFontSize = useCallback(() => {
    const currentIndex = FONT_SIZE_OPTIONS.findIndex(option => option.scale === currentFontSize);
    const nextIndex = Math.min(currentIndex + 1, FONT_SIZE_OPTIONS.length - 1);
    if (nextIndex !== currentIndex) {
      setFontSize(FONT_SIZE_OPTIONS[nextIndex].scale);
    }
  }, [currentFontSize, setFontSize]);

  // Decrease font size
  const decreaseFontSize = useCallback(() => {
    const currentIndex = FONT_SIZE_OPTIONS.findIndex(option => option.scale === currentFontSize);
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex !== currentIndex) {
      setFontSize(FONT_SIZE_OPTIONS[prevIndex].scale);
    }
  }, [currentFontSize, setFontSize]);

  // Reset to default
  const resetFontSize = useCallback(() => {
    setFontSize('default');
  }, [setFontSize]);

  // Apply font size on mount and when it changes
  useEffect(() => {
    // Check for immediate font size from localStorage first
    const savedFontSize = localStorage.getItem('synexa-font-size') as FontSizeScale;
    if (savedFontSize && FONT_SIZE_OPTIONS.some(option => option.scale === savedFontSize)) {
      applyFontSize(savedFontSize);
    } else {
      applyFontSize(currentFontSize);
    }
  }, [currentFontSize, applyFontSize]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Plus: Increase font size
      if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        increaseFontSize();
      }
      
      // Ctrl/Cmd + Minus: Decrease font size
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        decreaseFontSize();
      }
      
      // Ctrl/Cmd + 0: Reset font size
      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        resetFontSize();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [increaseFontSize, decreaseFontSize, resetFontSize]);

  return {
    // Current state
    currentFontSize,
    currentConfig: getCurrentConfig(),
    
    // Options
    fontSizeOptions: FONT_SIZE_OPTIONS,
    
    // Actions
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    
    // Utilities
    canIncrease: currentFontSize !== FONT_SIZE_OPTIONS[FONT_SIZE_OPTIONS.length - 1].scale,
    canDecrease: currentFontSize !== FONT_SIZE_OPTIONS[0].scale,
  };
}