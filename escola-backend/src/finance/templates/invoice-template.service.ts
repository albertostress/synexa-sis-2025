/**
 * Invoice Template Service - Geração de PDFs de Faturas e Recibos
 * Sistema adaptado para escolas angolanas
 */
import { Injectable } from '@nestjs/common';

interface SchoolInfo {
  name: string;
  nif: string;
  address: string;
  phone: string;
  email: string;
  bankAccounts: {
    bank: string;
    account: string;
    iban: string;
    holder: string;
  }[];
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: 'PENDENTE' | 'PAGA' | 'VENCIDA' | 'PARCIAL' | 'CANCELADA';
  studentName: string;
  studentNumber: string;
  studentAddress: string;
  studentPhone: string;
  studentNif: string;
  className: string;
  description: string;
  amount: number;
  dueDate: Date;
  issueDate: Date;
  month: number;
  year: number;
  paymentInfo?: {
    method: string;
    reference: string;
    paidAt: Date;
    amount: number;
  };
}

@Injectable()
export class InvoiceTemplateService {
  private schoolInfo: SchoolInfo = {
    name: 'CASA INGLESA',
    nif: '5000461563',
    address: 'Bairro Benfica, Desvio do Tombua\ndefronte ao Condomínio Residencial "Boa Vida"',
    phone: '923728235 / 941048407',
    email: 'geral@casainglesa.ao',
    bankAccounts: [
      {
        bank: 'BAI',
        account: '009314804010001',
        iban: 'AO06 0040 0000 9314 8040 1017 0',
        holder: 'CASA INGLESA'
      },
      {
        bank: 'BCA',
        account: '000900101910001',
        iban: 'AO06 0043 0000 0900 1019 1011 1',
        holder: 'CASA INGLESA'
      },
      {
        bank: 'BSOL',
        account: '12414913710001',
        iban: 'AO06 0044 0000 2414 9137 1018 5',
        holder: 'CASA INGLESA'
      }
    ]
  };

  /**
   * Gera HTML para fatura (cobrança) ou recibo (pagamento)
   */
  generateInvoiceHTML(data: InvoiceData): string {
    const isPaid = data.status === 'PAGA';
    const documentType = isPaid ? 'FACTURA RECIBO' : 'FACTURA';
    const documentNumber = `${isPaid ? 'FR' : 'FT'} VSOA${data.invoiceNumber.substring(0, 3)}${data.year}/${data.invoiceNumber.substring(3, 6)}`;
    const currentDate = new Date();
    const formattedDate = this.formatDateTime(currentDate);
    
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentType} - ${documentNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.3;
      color: #000;
      background: white;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 15mm;
      background: white;
      position: relative;
    }
    
    /* Header Section */
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 3mm;
      margin-bottom: 5mm;
    }
    
    .logo-area {
      flex: 1;
    }
    
    .logo-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0066cc, #003d7a);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .school-name {
      font-size: 18pt;
      font-weight: 700;
      color: #003d7a;
      margin-bottom: 2px;
      letter-spacing: -0.5px;
    }
    
    .school-tagline {
      font-size: 8pt;
      color: #666;
      font-style: italic;
    }
    
    .contact-info {
      text-align: right;
      font-size: 8pt;
      color: #333;
      line-height: 1.4;
    }
    
    .contact-info div {
      margin-bottom: 2px;
    }
    
    .contact-icon {
      display: inline-block;
      width: 14px;
      margin-right: 3px;
    }
    
    /* Document Title Box */
    .document-header {
      background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 12px 20px;
      margin: 15px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .document-title {
      font-size: 14pt;
      font-weight: 700;
      color: #000;
    }
    
    .document-info {
      text-align: right;
      font-size: 9pt;
    }
    
    .document-number {
      font-weight: 600;
      color: #000;
      font-size: 10pt;
    }
    
    .document-status {
      font-size: 8pt;
      color: #666;
      margin-top: 2px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: 600;
      margin-left: 5px;
    }
    
    .status-normal {
      background: #d4edda;
      color: #155724;
    }
    
    .status-cancelled {
      background: #f8d7da;
      color: #721c24;
    }
    
    /* Two Column Layout */
    .two-column {
      display: flex;
      gap: 20px;
      margin: 15px 0;
    }
    
    .left-column {
      flex: 1.2;
    }
    
    .right-column {
      flex: 1;
    }
    
    /* Info Box */
    .info-box {
      background: #ffffff;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 15px;
    }
    
    .info-box-title {
      font-size: 9pt;
      font-weight: 700;
      color: #495057;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 4px;
      font-size: 9pt;
    }
    
    .info-label {
      min-width: 80px;
      color: #6c757d;
    }
    
    .info-value {
      flex: 1;
      color: #000;
      font-weight: 500;
    }
    
    /* Main Table */
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .invoice-table thead {
      background: #f8f9fa;
    }
    
    .invoice-table th {
      padding: 10px 12px;
      text-align: left;
      font-size: 9pt;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .invoice-table td {
      padding: 12px;
      font-size: 9pt;
      border-bottom: 1px solid #e9ecef;
      color: #212529;
    }
    
    .invoice-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .invoice-table tbody tr:hover {
      background: #f8f9fa;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .item-description {
      font-weight: 600;
      color: #000;
      margin-bottom: 2px;
    }
    
    .item-reference {
      font-size: 8pt;
      color: #6c757d;
    }
    
    /* Totals Section */
    .totals-container {
      display: flex;
      justify-content: flex-end;
      margin: 20px 0;
    }
    
    .totals-box {
      width: 320px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 15px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 9pt;
    }
    
    .total-row.subtotal {
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    
    .total-row.grand-total {
      border-top: 2px solid #495057;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 12pt;
      font-weight: 700;
    }
    
    .total-label {
      color: #495057;
    }
    
    .total-value {
      color: #000;
      font-weight: 600;
    }
    
    .grand-total .total-value {
      color: ${isPaid ? '#28a745' : '#dc3545'};
    }
    
    /* Payment Section */
    .payment-section {
      background: ${isPaid ? '#d4edda' : '#fff3cd'};
      border: 1px solid ${isPaid ? '#c3e6cb' : '#ffeeba'};
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
    }
    
    .payment-title {
      font-size: 10pt;
      font-weight: 700;
      color: ${isPaid ? '#155724' : '#856404'};
      margin-bottom: 10px;
    }
    
    .payment-details {
      font-size: 9pt;
      line-height: 1.5;
      color: ${isPaid ? '#155724' : '#856404'};
    }
    
    .payment-row {
      display: flex;
      margin-bottom: 3px;
    }
    
    .payment-label {
      min-width: 120px;
      font-weight: 600;
    }
    
    /* Bank Details */
    .bank-section {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }
    
    .bank-title {
      font-size: 9pt;
      font-weight: 700;
      color: #495057;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .bank-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    
    .bank-item {
      font-size: 8pt;
      line-height: 1.4;
    }
    
    .bank-name {
      font-weight: 700;
      color: #000;
      margin-bottom: 2px;
    }
    
    .bank-detail {
      color: #495057;
      word-break: break-all;
    }
    
    /* Footer */
    .footer-section {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #dee2e6;
    }
    
    .footer-notes {
      font-size: 8pt;
      color: #6c757d;
      line-height: 1.4;
      margin-bottom: 10px;
    }
    
    .processing-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 15px;
    }
    
    .qr-placeholder {
      width: 60px;
      height: 60px;
      border: 2px solid #dee2e6;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7pt;
      color: #adb5bd;
      background: white;
    }
    
    .processing-text {
      font-size: 7pt;
      color: #6c757d;
      text-align: right;
      line-height: 1.3;
    }
    
    /* IVA Notice */
    .iva-notice {
      font-size: 8pt;
      color: #6c757d;
      font-style: italic;
      margin: 5px 0;
    }
    
    @media print {
      body {
        margin: 0;
      }
      
      .page {
        padding: 10mm 15mm;
      }
      
      .invoice-table tbody tr:hover {
        background: transparent;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header-top">
      <div class="logo-area">
        <div class="logo-circle">CI</div>
        <div class="school-name">CASA INGLESA</div>
        <div class="school-tagline">ENSINO - ESCOLA E CLÍNICA PSICOLÓGICA<br>DE AUTO MELHORIA</div>
      </div>
      <div class="contact-info">
        <div>📍 ${this.schoolInfo.address.split('\n')[0]}</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${this.schoolInfo.address.split('\n')[1]}</div>
        <div>📞 ${this.schoolInfo.phone}</div>
        <div>📱 941048407</div>
      </div>
    </div>
    
    <!-- Document Header -->
    <div class="document-header">
      <div>
        <div class="document-title">${documentType} nº: ${documentNumber}</div>
      </div>
      <div class="document-info">
        <div>Estado: <span class="status-badge status-normal">Normal</span> / 2ª Via</div>
        <div style="margin-top: 3px;">Operador: Casa Inglesa (500090073)</div>
        <div>Data de Emissão: ${formattedDate}</div>
      </div>
    </div>
    
    <!-- Two Column Layout -->
    <div class="two-column">
      <div class="left-column">
        <div class="info-box">
          <div class="info-box-title">Dados do Cliente</div>
          <div class="info-row">
            <span class="info-label">Nome:</span>
            <span class="info-value">${data.studentName} (${data.studentNumber})</span>
          </div>
          <div class="info-row">
            <span class="info-label">Morada:</span>
            <span class="info-value">${data.studentAddress}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Telef.:</span>
            <span class="info-value">${data.studentPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">NIF:</span>
            <span class="info-value">${data.studentNif}</span>
          </div>
        </div>
      </div>
      
      <div class="right-column">
        <div class="info-box">
          <div class="info-box-title">Informação Escolar</div>
          <div class="info-row">
            <span class="info-label">Classe:</span>
            <span class="info-value">${data.className || 'ENSINO PRIMÁRIO - 1ª Classe'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Regime:</span>
            <span class="info-value">INTEGRAL - C</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Invoice Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 45%">Artigo / Descrição</th>
          <th class="text-center" style="width: 10%">Quant.</th>
          <th class="text-right" style="width: 15%">P. Unit.</th>
          <th class="text-center" style="width: 10%">Desc. (%)</th>
          <th class="text-center" style="width: 10%">Taxa (%)</th>
          <th class="text-right" style="width: 15%">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-description">${data.description}</div>
            <div class="item-reference">ref: ${this.getMonthName(data.month)} / ${data.year}</div>
          </td>
          <td class="text-center">1,00</td>
          <td class="text-right">${this.formatCurrency(data.amount)}</td>
          <td class="text-center">0,00</td>
          <td class="text-center">0,00</td>
          <td class="text-right"><strong>${this.formatCurrency(data.amount)}</strong></td>
        </tr>
      </tbody>
    </table>
    
    <div class="iva-notice">IVA – Regime de exclusão</div>
    
    <!-- Tax Summary -->
    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
      <table style="width: 100%; font-size: 8pt;">
        <tr>
          <td style="width: 20%"><strong>Taxa (%)</strong></td>
          <td style="width: 20%"><strong>Designação</strong></td>
          <td style="width: 20%; text-align: right;"><strong>Base Incidência</strong></td>
          <td style="width: 20%; text-align: right;"><strong>Valor Imp.</strong></td>
        </tr>
        <tr>
          <td>0,00</td>
          <td>IVA</td>
          <td style="text-align: right;">${this.formatCurrency(data.amount)}</td>
          <td style="text-align: right;">0,00</td>
        </tr>
      </table>
    </div>
    
    <!-- Totals -->
    <div class="totals-container">
      <div class="totals-box">
        <div class="total-row">
          <span class="total-label">Total Ilíquido:</span>
          <span class="total-value">${this.formatCurrency(data.amount)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Descontos comerciais:</span>
          <span class="total-value">0,00</span>
        </div>
        <div class="total-row">
          <span class="total-label">Descontos financeiros:</span>
          <span class="total-value">0,00</span>
        </div>
        <div class="total-row subtotal">
          <span class="total-label">Total Impostos:</span>
          <span class="total-value">0,00</span>
        </div>
        <div class="total-row grand-total">
          <span class="total-label">TOTAL A PAGAR:</span>
          <span class="total-value">${this.formatCurrency(data.amount)}</span>
        </div>
      </div>
    </div>
    
    <!-- Payment Section -->
    ${isPaid ? `
    <div class="payment-section">
      <div class="payment-title">Pagamento:</div>
      <div class="payment-details">
        <div class="payment-row">
          <span class="payment-label">${data.paymentInfo?.method || 'Transferência'}:</span>
          <span>Oper. ${data.paymentInfo?.reference || '-0001-11-30'}</span>
          <span style="margin-left: 20px; font-weight: 700;">${this.formatCurrency(data.amount)}</span>
        </div>
      </div>
    </div>
    ` : `
    <div class="payment-section">
      <div class="payment-title">⚠️ AGUARDANDO PAGAMENTO</div>
      <div class="payment-details">
        <div class="payment-row">
          <span class="payment-label">Data de Vencimento:</span>
          <span>${this.formatDate(data.dueDate)}</span>
        </div>
        <div class="payment-row">
          <span class="payment-label">Valor a Pagar:</span>
          <span style="font-weight: 700;">${this.formatCurrency(data.amount)}</span>
        </div>
      </div>
    </div>
    `}
    
    <!-- Bank Details -->
    <div class="bank-section">
      <div class="bank-title">Coordenadas bancárias:</div>
      <div class="bank-grid">
        ${this.schoolInfo.bankAccounts.map(acc => `
        <div class="bank-item">
          <div class="bank-name">* ${acc.bank}</div>
          <div class="bank-detail">Conta: ${acc.account}</div>
          <div class="bank-detail">IBAN: ${acc.iban}</div>
          <div class="bank-detail">Titular: ${acc.holder}</div>
        </div>
        `).join('')}
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer-section">
      <div class="footer-notes">
        * Os bens/serviços foram colocados a disposição do adquirente na data do documento.
      </div>
      
      <div class="processing-info">
        <div class="qr-placeholder">
          <div>QR</div>
        </div>
        <div class="processing-text">
          NIF: ${this.schoolInfo.nif}<br>
          8qNl-Processado por programa validado nº 271/AGT/2020 - GME Sílica. | Pág. 1 / 1
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Formatar valor para moeda (Kwanza)
   */
  private formatCurrency(value: number): string {
    // Formatar com espaço como separador de milhares e vírgula para decimais
    return value.toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Kz';
  }

  /**
   * Formatar data
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formatar data e hora
   */
  private formatDateTime(date: Date): string {
    return date.toLocaleString('pt-AO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '');
  }

  /**
   * Obtém nome do mês
   */
  private getMonthName(month: number): string {
    const months = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ];
    return months[month - 1] || '';
  }
}