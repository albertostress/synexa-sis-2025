import React from 'react';

export default function GradeTest() {
  return (
    <div style={{ padding: '20px', background: 'red', color: 'white', fontSize: '24px' }}>
      <h1>🚨 TESTE ATUALIZADO - {new Date().toLocaleString()}</h1>
      <p>Se você vê esta página, o sistema de atualização está funcionando!</p>
      <div style={{ marginTop: '20px', padding: '10px', background: 'yellow', color: 'black' }}>
        <h2>Nova Classificação de Notas:</h2>
        <p>✅ APROVADO (nota ≥ 10)</p>
        <p>❌ REPROVADO (nota &lt; 10)</p>
      </div>
    </div>
  );
}