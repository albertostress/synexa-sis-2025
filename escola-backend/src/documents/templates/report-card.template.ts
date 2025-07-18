/**
 * Report Card Template - Template para Boletim Escolar Angolano
 * Referência: context7 mcp - Template Pattern
 */
import { ReportCard } from '../../report-cards/entities/report-card.entity';

export interface ReportCardData extends ReportCard {
  // Dados já incluídos na interface ReportCard
}

export const getReportCardTemplate = (data: ReportCardData): string => {
  const termText = data.term ? `${data.term}º Trimestre` : 'Boletim Final';
  const academicYear = `${data.year}/${data.year + 1}`;
  
  return `
    <!DOCTYPE html>
    <html lang="pt-AO">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boletim Escolar - ${data.student.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @page {
                size: A4;
                margin: 15mm;
            }
            
            body {
                font-family: 'Times New Roman', serif;
                line-height: 1.4;
                color: #000;
            }
            
            .page-break {
                page-break-after: always;
            }
            
            .header-border {
                border: 2px solid #000;
                border-radius: 8px;
            }
            
            .grades-table {
                border-collapse: collapse;
                width: 100%;
            }
            
            .grades-table th,
            .grades-table td {
                border: 1px solid #000;
                padding: 8px;
                text-align: center;
                vertical-align: middle;
            }
            
            .grades-table th {
                background-color: #f8f9fa;
                font-weight: bold;
            }
            
            .subject-name {
                text-align: left !important;
                font-weight: bold;
            }
            
            .classification-excellent { color: #059669; }
            .classification-very-good { color: #0d9488; }
            .classification-good { color: #2563eb; }
            .classification-satisfactory { color: #d97706; }
            .classification-unsatisfactory { color: #dc2626; }
            
            .status-approved { 
                color: #059669; 
                font-weight: bold;
                font-size: 18px;
            }
            .status-failed { 
                color: #dc2626; 
                font-weight: bold;
                font-size: 18px;
            }
            .status-recovery { 
                color: #d97706; 
                font-weight: bold;
                font-size: 18px;
            }
        </style>
    </head>
    <body class="bg-white">
        <!-- Cabeçalho Oficial -->
        <div class="header-border p-6 mb-6">
            <div class="text-center">
                <h1 class="text-2xl font-bold mb-2">REPÚBLICA DE ANGOLA</h1>
                <h2 class="text-lg font-semibold mb-1">MINISTÉRIO DA EDUCAÇÃO</h2>
                <h3 class="text-base font-medium mb-4">${data.school.name}</h3>
                <div class="text-sm">
                    <p><strong>Província:</strong> ${data.school.province} | <strong>Município:</strong> ${data.school.municipality}</p>
                </div>
            </div>
        </div>
        
        <!-- Título do Documento -->
        <div class="text-center mb-6">
            <h1 class="text-xl font-bold">BOLETIM ESCOLAR</h1>
            <h2 class="text-lg">${termText} - Ano Lectivo ${academicYear}</h2>
        </div>
        
        <!-- Informações do Aluno -->
        <div class="mb-6">
            <h3 class="text-lg font-bold mb-3 border-b border-black pb-1">IDENTIFICAÇÃO DO ALUNO</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p><strong>Nome:</strong> ${data.student.name}</p>
                    <p><strong>Nº de Estudante:</strong> ${data.student.studentNumber}</p>
                </div>
                <div>
                    <p><strong>Classe:</strong> ${data.class.name}</p>
                    <p><strong>Turno:</strong> ${data.class.shift === 'MORNING' ? 'Manhã' : data.class.shift === 'AFTERNOON' ? 'Tarde' : 'Noite'}</p>
                </div>
            </div>
        </div>
        
        <!-- Disciplinas Curriculares -->
        <div class="mb-6">
            <h3 class="text-lg font-bold mb-3 border-b border-black pb-1">DISCIPLINAS CURRICULARES</h3>
            <table class="grades-table">
                <thead>
                    <tr>
                        <th rowspan="2" class="w-32">Disciplina</th>
                        <th colspan="4">Avaliações</th>
                        <th rowspan="2" class="w-12">FAL</th>
                        <th rowspan="2" class="w-24">Classificação</th>
                        <th rowspan="2" class="w-20">Professor</th>
                    </tr>
                    <tr>
                        <th class="w-12">MAC</th>
                        <th class="w-12">NPP</th>
                        <th class="w-12">NPT</th>
                        <th class="w-12">MT</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.subjects.map(subject => {
                        const macGrade = subject.grades.find(g => g.type === 'MAC');
                        const nppGrade = subject.grades.find(g => g.type === 'NPP');
                        const nptGrade = subject.grades.find(g => g.type === 'NPT');
                        const mtGrade = subject.grades.find(g => g.type === 'MT');
                        
                        const mt = subject.averageGrade || mtGrade?.value || 0;
                        let classificationClass = '';
                        let classificationText = '';
                        
                        if (mt >= 17) {
                            classificationClass = 'classification-excellent';
                            classificationText = 'Excelente';
                        } else if (mt >= 14) {
                            classificationClass = 'classification-very-good';
                            classificationText = 'Muito Bom';
                        } else if (mt >= 12) {
                            classificationClass = 'classification-good';
                            classificationText = 'Bom';
                        } else if (mt >= 10) {
                            classificationClass = 'classification-satisfactory';
                            classificationText = 'Satisfatório';
                        } else {
                            classificationClass = 'classification-unsatisfactory';
                            classificationText = 'Não Satisfatório';
                        }
                        
                        return `
                            <tr>
                                <td class="subject-name">${subject.subjectName}</td>
                                <td>${macGrade?.value || '-'}</td>
                                <td>${nppGrade?.value || '-'}</td>
                                <td>${nptGrade?.value || '-'}</td>
                                <td class="font-bold">${mt.toFixed(1)}</td>
                                <td>${subject.absences}</td>
                                <td class="${classificationClass}">${classificationText}</td>
                                <td class="text-xs">${subject.teacherName.split(' ').slice(0, 2).join(' ')}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Resumo e Observações -->
        <div class="grid grid-cols-2 gap-6 mb-6">
            <div>
                <h4 class="font-bold mb-2">RESUMO ACADÉMICO</h4>
                <div class="text-sm space-y-1">
                    <p><strong>Média Geral:</strong> ${data.averageGrade.toFixed(1)} valores</p>
                    <p><strong>Frequência:</strong> ${data.attendancePercentage.toFixed(1)}%</p>
                    <p class="${data.status === 'APROVADO' ? 'status-approved' : data.status === 'REPROVADO' ? 'status-failed' : 'status-recovery'}">
                        <strong>Estado:</strong> ${data.status}
                    </p>
                </div>
            </div>
            
            <div>
                <h4 class="font-bold mb-2">LEGENDA</h4>
                <div class="text-xs space-y-1">
                    <p><strong>MAC</strong> = Média das Avaliações Contínuas</p>
                    <p><strong>NPP</strong> = Nota da Prova do Professor</p>
                    <p><strong>NPT</strong> = Nota da Prova Trimestral</p>
                    <p><strong>MT</strong> = Média Trimestral</p>
                    <p><strong>FAL</strong> = Faltas</p>
                </div>
            </div>
        </div>
        
        <!-- Escalas de Classificação -->
        <div class="mb-6">
            <h4 class="font-bold mb-2">ESCALA DE CLASSIFICAÇÃO (0-20 valores)</h4>
            <div class="text-xs grid grid-cols-5 gap-2">
                <div class="classification-excellent">17-20: Excelente</div>
                <div class="classification-very-good">14-16: Muito Bom</div>
                <div class="classification-good">12-13: Bom</div>
                <div class="classification-satisfactory">10-11: Satisfatório</div>
                <div class="classification-unsatisfactory">0-9: Não Satisfatório</div>
            </div>
        </div>
        
        <!-- Assinaturas -->
        <div class="mt-8 grid grid-cols-3 gap-6 text-center text-sm">
            <div>
                <div class="border-t border-black mt-12 pt-2">
                    <p class="font-bold">O Director</p>
                </div>
            </div>
            <div>
                <div class="border-t border-black mt-12 pt-2">
                    <p class="font-bold">O Secretário</p>
                </div>
            </div>
            <div>
                <div class="border-t border-black mt-12 pt-2">
                    <p class="font-bold">O Encarregado de Educação</p>
                </div>
            </div>
        </div>
        
        <!-- Rodapé -->
        <div class="mt-8 text-center text-xs text-gray-600">
            <p>Boletim gerado em ${new Date(data.generatedAt).toLocaleDateString('pt-AO')} às ${new Date(data.generatedAt).toLocaleTimeString('pt-AO')}</p>
            <p>Sistema de Gestão Escolar - Synexa-SIS ${data.year}</p>
        </div>
    </body>
    </html>
  `;
};