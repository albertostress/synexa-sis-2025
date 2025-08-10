import { useEffect } from 'react';

const CURRENT_VERSION = '2025.08.10.6';
const VERSION_KEY = 'app_version';

export function VersionCheck() {
  useEffect(() => {
    const checkVersion = () => {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      
      if (storedVersion !== CURRENT_VERSION) {
        console.log(`🔄 Nova versão detectada: ${CURRENT_VERSION} (anterior: ${storedVersion})`);
        
        // Limpar cache do localStorage
        const userToken = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        // Limpar tudo exceto dados de autenticação
        localStorage.clear();
        
        // Restaurar dados de autenticação
        if (userToken) localStorage.setItem('token', userToken);
        if (userData) localStorage.setItem('user', userData);
        
        // Salvar nova versão
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        
        // Forçar reload da página para limpar cache
        if (storedVersion) {
          console.log('🔄 Recarregando para aplicar nova versão...');
          window.location.reload();
        }
      }
    };

    checkVersion();
    
    // Verificar periodicamente (a cada 5 minutos)
    const interval = setInterval(checkVersion, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return null;
}