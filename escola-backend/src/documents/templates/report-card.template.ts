/**
 * Report Card Template - Template para Boletim Escolar Angolano
 * Referência: context7 mcp - Template Pattern
 */
import { ReportCard } from '../../report-cards/entities/report-card.entity';
import { AngolaReportCard } from '../../report-cards/entities/angola-report-card.entity';

export interface ReportCardData extends ReportCard {
  // Dados já incluídos na interface ReportCard
}

export const getReportCardTemplate = (data: ReportCardData): string => {
  const termText = data.term ? `${data.term}º TRIMESTRE` : 'BOLETIM FINAL';
  const academicYear = `${data.year}/${data.year + 1}`;
  
  return `
    <!DOCTYPE html>
    <html lang="pt-AO">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boletim Escolar - ${data.student.name}</title>
        <style>
            @page {
                size: A4 landscape;
                margin: 15mm 20mm;
            }
            
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Times New Roman', 'Times', serif;
                font-size: 11px;
                line-height: 1.1;
                color: #000;
                background: #fff;
                width: 100%;
            }
            
            .brasao {
                text-align: center;
                margin-bottom: 4px;
            }
            
            .brasao img {
                width: 35px;
                height: 35px;
                max-width: 35px;
                max-height: 35px;
                object-fit: contain;
                filter: none;
                background: transparent;
            }
            
            .header {
                text-align: center;
                margin-bottom: 6px;
            }
            
            .header h1 {
                font-size: 13px;
                font-weight: bold;
                margin-bottom: 1px;
                letter-spacing: 0.5px;
            }
            
            .header h2 {
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 1px;
            }
            
            .header h3 {
                font-size: 9px;
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .school-info {
                font-size: 8px;
                margin-bottom: 4px;
            }
            
            .document-title {
                text-align: center;
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 6px;
                text-decoration: underline;
            }
            
            .student-info {
                display: flex;
                width: 100%;
                margin-bottom: 8px;
                gap: 15px;
            }
            
            .student-info-left {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 10px;
            }
            
            .student-info-right {
                width: 120px;
                text-align: center;
                flex-shrink: 0;
            }
            
            .photo-placeholder {
                width: 60px;
                height: 70px;
                border: 1px solid #000;
                margin: 0 auto 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                background: #f9f9f9;
            }
            
            .info-row {
                margin-bottom: 4px;
                font-size: 11px;
            }
            
            .info-label {
                font-weight: bold;
                display: inline-block;
                width: 120px;
            }
            
            .grades-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12px;
                font-size: 8px;
            }
            
            .grades-table th,
            .grades-table td {
                border: 1px solid #000;
                padding: 2px;
                text-align: center;
                vertical-align: middle;
            }
            
            .grades-table th {
                font-weight: bold;
                background: #fff;
            }
            
            .subject-cell {
                text-align: left !important;
                padding-left: 3px !important;
                font-weight: normal;
                width: 15%;
            }
            
            .grade-cell {
                width: 3.5%;
                font-size: 7px;
            }
            
            .teacher-cell {
                font-size: 6px;
                width: 8%;
            }
            
            .classification-cell {
                font-size: 6px;
                width: 6%;
            }
            
            .header-row-1 th {
                height: 20px;
                font-size: 7px;
                font-weight: bold;
            }
            
            .header-row-2 th {
                height: 15px;
                font-size: 6px;
                font-weight: bold;
            }
            
            .totals-row {
                background: #f5f5f5;
                font-weight: bold;
            }
            
            .footer-info {
                margin-top: 15px;
                display: flex;
                width: 100%;
                gap: 20px;
            }
            
            .footer-left {
                flex: 2;
            }
            
            .footer-right {
                flex: 1;
            }
            
            .legend {
                font-size: 7px;
                margin-bottom: 8px;
            }
            
            .legend p {
                margin-bottom: 1px;
            }
            
            .signatures {
                margin-top: 20px;
                display: flex;
                width: 100%;
                justify-content: space-around;
            }
            
            .signature-item {
                text-align: center;
                font-size: 8px;
                min-width: 150px;
            }
            
            .signature-line {
                border-top: 1px solid #000;
                margin-top: 25px;
                padding-top: 2px;
            }
            
            .observations {
                margin-top: 10px;
                font-size: 8px;
            }
            
            .observations-box {
                border: 1px solid #000;
                height: 30px;
                padding: 3px;
                margin-top: 3px;
            }
            
            .final-status {
                text-align: center;
                margin-top: 10px;
                font-size: 10px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <!-- BRASÃO OFICIAL -->
        <div class="brasao">
            <img src="/brasao-angola.svg" alt="Brasão da República de Angola" />
        </div>
        
        <!-- CABEÇALHO OFICIAL -->
        <div class="header">
            <h1>REPÚBLICA DE ANGOLA</h1>
            <h2>MINISTÉRIO DA EDUCAÇÃO</h2>
            <h3>DIRECÇÃO MUNICIPAL DE EDUCAÇÃO</h3>
            <div class="school-info">
                <strong>${data.school.name}</strong><br>
                Província: ${data.school.province} - Município: ${data.school.municipality}
            </div>
        </div>
        
        <!-- TÍTULO DO DOCUMENTO -->
        <div class="document-title">
            BOLETIM ESCOLAR - ${termText}<br>
            ANO LECTIVO: ${academicYear}
        </div>
        
        <!-- INFORMAÇÕES DO ALUNO -->
        <div class="student-info">
            <div class="student-info-left">
                <div class="info-row">
                    <span class="info-label">Nome do Aluno:</span> ${data.student.name}
                </div>
                <div class="info-row">
                    <span class="info-label">Nome do Pai:</span> ${data.student.fatherName || 'Não informado'}
                </div>
                <div class="info-row">
                    <span class="info-label">Sala:</span> ${data.class.name}
                </div>
                <div class="info-row">
                    <span class="info-label">Turma:</span> ${data.class.shift === 'MORNING' ? 'Manhã' : data.class.shift === 'AFTERNOON' ? 'Tarde' : 'Noite'}
                </div>
                <div class="info-row">
                    <span class="info-label">Data de Nascimento:</span> ${data.student.birthDate ? new Date(data.student.birthDate).toLocaleDateString('pt-AO') : 'Não informado'}
                </div>
                <div class="info-row">
                    <span class="info-label">Ano Lectivo:</span> ${academicYear}
                </div>
            </div>
            <div class="student-info-right">
                <div class="photo-placeholder">
                    FOTO
                </div>
                <div style="font-size: 8px; text-align: center; margin-top: 5px;">
                    Nº Estudante:<br>
                    <strong>${data.student.studentNumber}</strong>
                </div>
            </div>
        </div>
        
        <!-- TABELA DE DISCIPLINAS E NOTAS -->
        <table class="grades-table">
            <thead>
                <tr class="header-row-1">
                    <th rowspan="2" class="subject-cell">DISCIPLINAS CURRICULARES</th>
                    <th colspan="5">1º TRIMESTRE</th>
                    <th colspan="5">2º TRIMESTRE</th>
                    <th colspan="5">3º TRIMESTRE</th>
                    <th colspan="4">CLASSIFICAÇÃO ANUAL</th>
                    <th rowspan="2" class="teacher-cell">PROFESSOR</th>
                </tr>
                <tr class="header-row-2">
                    <th class="grade-cell">MAC</th>
                    <th class="grade-cell">NPP</th>
                    <th class="grade-cell">NPT</th>
                    <th class="grade-cell">MT</th>
                    <th class="grade-cell">FAL</th>
                    <th class="grade-cell">MAC</th>
                    <th class="grade-cell">NPP</th>
                    <th class="grade-cell">NPT</th>
                    <th class="grade-cell">MT</th>
                    <th class="grade-cell">FAL</th>
                    <th class="grade-cell">MAC</th>
                    <th class="grade-cell">NPP</th>
                    <th class="grade-cell">NPT</th>
                    <th class="grade-cell">MT</th>
                    <th class="grade-cell">FAL</th>
                    <th class="grade-cell">MT1</th>
                    <th class="grade-cell">MT2</th>
                    <th class="grade-cell">MT3</th>
                    <th class="grade-cell">MFD</th>
                </tr>
            </thead>
            <tbody>
                ${data.subjects.map(subject => {
                    // Buscar notas por trimestre
                    const term1Grades = subject.grades.filter(g => g.term === 1);
                    const term2Grades = subject.grades.filter(g => g.term === 2);
                    const term3Grades = subject.grades.filter(g => g.term === 3);
                    
                    // Trimestre 1
                    const t1Mac = term1Grades.find(g => g.type === 'MAC')?.value || '-';
                    const t1Npp = term1Grades.find(g => g.type === 'NPP')?.value || '-';
                    const t1Npt = term1Grades.find(g => g.type === 'NPT')?.value || '-';
                    const t1Mt = term1Grades.find(g => g.type === 'MT')?.value || '-';
                    
                    // Trimestre 2
                    const t2Mac = term2Grades.find(g => g.type === 'MAC')?.value || '-';
                    const t2Npp = term2Grades.find(g => g.type === 'NPP')?.value || '-';
                    const t2Npt = term2Grades.find(g => g.type === 'NPT')?.value || '-';
                    const t2Mt = term2Grades.find(g => g.type === 'MT')?.value || '-';
                    
                    // Trimestre 3
                    const t3Mac = term3Grades.find(g => g.type === 'MAC')?.value || '-';
                    const t3Npp = term3Grades.find(g => g.type === 'NPP')?.value || '-';
                    const t3Npt = term3Grades.find(g => g.type === 'NPT')?.value || '-';
                    const t3Mt = term3Grades.find(g => g.type === 'MT')?.value || '-';
                    
                    // Médias finais
                    const mt1 = t1Mt !== '-' ? t1Mt : '-';
                    const mt2 = t2Mt !== '-' ? t2Mt : '-';
                    const mt3 = t3Mt !== '-' ? t3Mt : '-';
                    const mfd = subject.averageGrade ? subject.averageGrade.toFixed(1) : '-';
                    
                    return `
                        <tr>
                            <td class="subject-cell">${subject.subjectName}</td>
                            <td class="grade-cell">${t1Mac}</td>
                            <td class="grade-cell">${t1Npp}</td>
                            <td class="grade-cell">${t1Npt}</td>
                            <td class="grade-cell">${t1Mt}</td>
                            <td class="grade-cell">${subject.absences || '-'}</td>
                            <td class="grade-cell">${t2Mac}</td>
                            <td class="grade-cell">${t2Npp}</td>
                            <td class="grade-cell">${t2Npt}</td>
                            <td class="grade-cell">${t2Mt}</td>
                            <td class="grade-cell">${subject.absences || '-'}</td>
                            <td class="grade-cell">${t3Mac}</td>
                            <td class="grade-cell">${t3Npp}</td>
                            <td class="grade-cell">${t3Npt}</td>
                            <td class="grade-cell">${t3Mt}</td>
                            <td class="grade-cell">${subject.absences || '-'}</td>
                            <td class="grade-cell">${mt1}</td>
                            <td class="grade-cell">${mt2}</td>
                            <td class="grade-cell">${mt3}</td>
                            <td class="grade-cell"><strong>${mfd}</strong></td>
                            <td class="teacher-cell">${subject.teacherName.split(' ').slice(0, 2).join(' ')}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <!-- RODAPÉ COM INFORMAÇÕES -->
        <div class="footer-info">
            <div class="footer-left">
                <!-- Observações -->
                <div class="observations">
                    <strong>OBSERVAÇÕES:</strong>
                    <div class="observations-box"></div>
                </div>
                
                <!-- Assinatura do Diretor -->
                <div style="margin-top: 20px; text-align: center;">
                    <div style="border-top: 1px solid #000; width: 200px; margin: 40px auto 5px;">
                        <strong>ASSINATURA DO DIRECTOR</strong>
                    </div>
                </div>
            </div>
            
            <div class="footer-right">
                <!-- Situação Final -->
                <div class="final-status">
                    SITUAÇÃO FINAL:<br>
                    <span style="font-size: 16px; margin-top: 10px; display: block;">
                        ${data.status === 'APROVADO' ? '✓ APROVADO' : data.status === 'REPROVADO' ? '✗ REPROVADO' : '⚠ EM RECUPERAÇÃO'}
                    </span>
                </div>
                
                <!-- Média Geral -->
                <div style="margin-top: 15px; text-align: center; font-size: 11px;">
                    <strong>MÉDIA GERAL: ${data.averageGrade.toFixed(1)}</strong><br>
                    <strong>FREQUÊNCIA: ${data.attendancePercentage.toFixed(1)}%</strong>
                </div>
            </div>
        </div>
        
        <!-- LEGENDA -->
        <div class="legend" style="margin-top: 25px;">
            <p><strong>LEGENDA:</strong></p>
            <p><strong>MAC</strong> = Média das Aulas Contínuas | <strong>NPP</strong> = Prova do Professor | <strong>NPT</strong> = Prova Trimestral</p>
            <p><strong>MT</strong> = Média Trimestral | <strong>MFD</strong> = Média Final da Disciplina | <strong>FAL</strong> = Faltas</p>
            <p><strong>CLASSIFICAÇÃO:</strong> E = Excelente | MB = Muito Bom | B = Bom | S = Satisfatório | NS = Não Satisfatório</p>
        </div>
        
        <!-- ASSINATURAS FINAIS -->
        <div class="signatures">
            <div class="signature-item">
                <div class="signature-line">O Secretário</div>
            </div>
            <div class="signature-item">
                <div class="signature-line">O Encarregado de Educação</div>
            </div>
            <div class="signature-item">
                <div class="signature-line">Data: ___/___/____</div>
            </div>
        </div>
        
        <!-- RODAPÉ FINAL -->
        <div style="text-align: center; margin-top: 20px; font-size: 8px; color: #666;">
            Boletim gerado em ${new Date(data.generatedAt).toLocaleDateString('pt-AO')} - Sistema Synexa-SIS ${data.year}
        </div>
    </body>
    </html>
  `;
};

export const getAngolaReportCardTemplate = (data: AngolaReportCard): string => {
  const termText = data.term ? `${data.term}º TRIMESTRE` : 'BOLETIM FINAL';
  const academicYear = `${data.year}/${data.year + 1}`;
  
  return `
    <!DOCTYPE html>
    <html lang="pt-AO">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boletim Escolar - ${data.student.name}</title>
        <style>
            @page {
                size: A4 landscape;
                margin: 15mm 20mm;
            }
            
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Times New Roman', 'Times', serif;
                font-size: 11px;
                line-height: 1.1;
                color: #000;
                background: #fff;
                width: 100%;
            }
            
            .brasao {
                text-align: center;
                margin-bottom: 4px;
            }
            
            .brasao img {
                width: 35px;
                height: 35px;
                max-width: 35px;
                max-height: 35px;
                object-fit: contain;
                filter: none;
                background: transparent;
            }
            
            .header {
                text-align: center;
                margin-bottom: 6px;
            }
            
            .header h1 {
                font-size: 13px;
                font-weight: bold;
                margin-bottom: 1px;
                letter-spacing: 0.5px;
            }
            
            .header h2 {
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 1px;
            }
            
            .header h3 {
                font-size: 9px;
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .school-info {
                font-size: 8px;
                margin-bottom: 4px;
            }
            
            .document-title {
                text-align: center;
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 6px;
                text-decoration: underline;
            }
            
            .student-info {
                display: flex;
                width: 100%;
                margin-bottom: 8px;
                gap: 15px;
            }
            
            .student-info-left {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 10px;
            }
            
            .student-info-right {
                width: 120px;
                text-align: center;
                flex-shrink: 0;
            }
            
            .photo-placeholder {
                width: 60px;
                height: 70px;
                border: 1px solid #000;
                margin: 0 auto 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                background: #f9f9f9;
            }
            
            .info-row {
                margin-bottom: 4px;
                font-size: 11px;
            }
            
            .info-label {
                font-weight: bold;
                display: inline-block;
                width: 120px;
            }
            
            .grades-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12px;
                font-size: 8px;
            }
            
            .grades-table th,
            .grades-table td {
                border: 1px solid #000;
                padding: 2px;
                text-align: center;
                vertical-align: middle;
            }
            
            .grades-table th {
                font-weight: bold;
                background: #fff;
            }
            
            .subject-cell {
                text-align: left !important;
                padding-left: 3px !important;
                font-weight: normal;
                width: 20%;
            }
            
            .grade-cell {
                width: 8%;
                font-size: 7px;
            }
            
            .teacher-cell {
                font-size: 6px;
                width: 12%;
            }
            
            .classification-cell {
                font-size: 6px;
                width: 10%;
            }
            
            .final-status {
                text-align: center;
                margin-top: 10px;
                font-size: 10px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <!-- BRASÃO OFICIAL -->
        <div class="brasao">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNSIgaGVpZ2h0PSIzNSI+PHJlY3Qgd2lkdGg9IjM1IiBoZWlnaHQ9IjM1IiBmaWxsPSIjZmZmIiBzdHJva2U9IiMwMDAiLz48dGV4dCB4PSIxNy41IiB5PSIyMCIgZm9udC1zaXplPSI4IiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CTzwvdGV4dD48L3N2Zz4=" alt="Brasão da República de Angola" />
        </div>
        
        <!-- CABEÇALHO OFICIAL -->
        <div class="header">
            <h1>REPÚBLICA DE ANGOLA</h1>
            <h2>MINISTÉRIO DA EDUCAÇÃO</h2>
            <h3>DIRECÇÃO MUNICIPAL DE EDUCAÇÃO</h3>
            <div class="school-info">
                <strong>ESCOLA SYNEXA-SIS</strong><br>
                Província: Luanda - Município: Luanda
            </div>
        </div>
        
        <!-- TÍTULO DO DOCUMENTO -->
        <div class="document-title">
            BOLETIM ESCOLAR - ${termText}<br>
            ANO LECTIVO: ${academicYear}
        </div>
        
        <!-- INFORMAÇÕES DO ALUNO -->
        <div class="student-info">
            <div class="student-info-left">
                <div class="info-row">
                    <span class="info-label">Nome do Aluno:</span> ${data.student.name}
                </div>
                <div class="info-row">
                    <span class="info-label">Nome do Pai:</span> ${data.student.fatherName || 'Não informado'}
                </div>
                <div class="info-row">
                    <span class="info-label">Sala:</span> ${data.student.className}
                </div>
                <div class="info-row">
                    <span class="info-label">Turma:</span> ${data.student.shift === 'MORNING' ? 'Manhã' : data.student.shift === 'AFTERNOON' ? 'Tarde' : 'Noite'}
                </div>
                <div class="info-row">
                    <span class="info-label">Data de Nascimento:</span> ${data.student.birthDate ? new Date(data.student.birthDate).toLocaleDateString('pt-AO') : 'Não informado'}
                </div>
                <div class="info-row">
                    <span class="info-label">Ano Lectivo:</span> ${academicYear}
                </div>
            </div>
            <div class="student-info-right">
                <div class="photo-placeholder">
                    FOTO
                </div>
                <div style="font-size: 8px; text-align: center; margin-top: 5px;">
                    Ano Acadêmico:<br>
                    <strong>${data.student.academicYear}</strong>
                </div>
            </div>
        </div>
        
        <!-- TABELA DE DISCIPLINAS E NOTAS SIMPLES PARA ANGOLA -->
        <table class="grades-table">
            <thead>
                <tr>
                    <th class="subject-cell">DISCIPLINA</th>
                    <th class="grade-cell">MAC</th>
                    <th class="grade-cell">NPP</th>
                    <th class="grade-cell">NPT</th>
                    <th class="grade-cell">MT</th>
                    <th class="grade-cell">FAL</th>
                    <th class="classification-cell">CLASSIFICAÇÃO</th>
                    <th class="teacher-cell">PROFESSOR</th>
                </tr>
            </thead>
            <tbody>
                ${data.subjects.map(subject => `
                    <tr>
                        <td class="subject-cell">${subject.subjectName}</td>
                        <td class="grade-cell">${subject.mac || '-'}</td>
                        <td class="grade-cell">${subject.npp || '-'}</td>
                        <td class="grade-cell">${subject.npt || '-'}</td>
                        <td class="grade-cell"><strong>${subject.mt || '-'}</strong></td>
                        <td class="grade-cell">${subject.fal || '-'}</td>
                        <td class="classification-cell">${subject.classification || '-'}</td>
                        <td class="teacher-cell">${subject.teacherName || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- SITUAÇÃO FINAL -->
        <div class="final-status">
            SITUAÇÃO FINAL:<br>
            <span style="font-size: 16px; margin-top: 10px; display: block;">
                ${data.finalStatus === 'Aprovado' ? '✓ APROVADO' : data.finalStatus === 'Reprovado' ? '✗ REPROVADO' : '⚠ EM RECUPERAÇÃO'}
            </span>
        </div>
        
        <!-- MÉDIA GERAL -->
        <div style="margin-top: 15px; text-align: center; font-size: 11px;">
            <strong>MÉDIA GERAL: ${data.averageGrade.toFixed(1)}</strong><br>
            <strong>FREQUÊNCIA: ${data.attendancePercentage.toFixed(1)}%</strong>
        </div>
        
        <!-- ASSINATURAS -->
        <div style="margin-top: 30px; display: flex; justify-content: space-around;">
            <div style="text-align: center; font-size: 8px; min-width: 150px;">
                <div style="border-top: 1px solid #000; margin-top: 25px; padding-top: 2px;">
                    O Secretário
                </div>
            </div>
            <div style="text-align: center; font-size: 8px; min-width: 150px;">
                <div style="border-top: 1px solid #000; margin-top: 25px; padding-top: 2px;">
                    O Encarregado de Educação
                </div>
            </div>
            <div style="text-align: center; font-size: 8px; min-width: 150px;">
                <div style="border-top: 1px solid #000; margin-top: 25px; padding-top: 2px;">
                    O Diretor
                </div>
            </div>
        </div>
        
        <!-- RODAPÉ FINAL -->
        <div style="text-align: center; margin-top: 20px; font-size: 8px; color: #666;">
            Boletim gerado em ${new Date(data.generatedAt).toLocaleDateString('pt-AO')} - Sistema Synexa-SIS ${data.year}
        </div>
    </body>
    </html>
  `;
};