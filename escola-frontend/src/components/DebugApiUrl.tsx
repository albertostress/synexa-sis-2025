import React from 'react';

export const DebugApiUrl: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <strong>API URL:</strong> {apiUrl}
    </div>
  );
};