import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Dados fictícios angolanos
const provinciasAngola = [
  'Luanda', 'Benguela', 'Huíla', 'Huambo', 'Malanje', 'Uíge', 
  'Lunda Norte', 'Lunda Sul', 'Moxico', 'Cuando Cubango',
  'Namibe', 'Zaire', 'Cabinda', 'Cunene', 'Bié', 'Bengo'
];

const municipiosLuanda = [
  'Luanda', 'Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo',
  'Quiçama', 'Talatona', 'Viana', 'Kilamba Kiaxi'
];

const nomesAngolanos = [
  // Masculinos
  'João', 'António', 'Manuel', 'Francisco', 'Carlos', 'Mário', 'Paulo', 'Pedro', 'Luís', 'José',
  'Miguel', 'Rafael', 'Gabriel', 'Tomás', 'Mateus', 'André', 'Bruno', 'Daniel', 'Ricardo', 'Hélder',
  'Alfredo', 'Domingos', 'Agostinho', 'Severino', 'Joaquim', 'Benedito', 'Celestino', 'Deolindo',
  // Femininos
  'Maria', 'Ana', 'Isabel', 'Catarina', 'Helena', 'Sofia', 'Beatriz', 'Joana', 'Teresa', 'Cristina',
  'Fernanda', 'Paulina', 'Esperança', 'Graça', 'Lurdes', 'Conceição', 'Rosa', 'Filomena', 'Albertina',
  'Domingas', 'Benedita', 'Cândida', 'Deolinda', 'Eugénia', 'Felismina'
];

const sobrenomesAngolanos = [
  'dos Santos', 'Manuel', 'João', 'Francisco', 'António', 'Pereira', 'Silva', 'Ferreira', 'Costa',
  'Rodrigues', 'Martins', 'Oliveira', 'Soares', 'Almeida', 'Carvalho', 'Lopes', 'Gonçalves',
  'Mendes', 'Gomes', 'Fernandes', 'Ribeiro', 'Barbosa', 'Cardoso', 'Correia', 'Marques',
  'Neto', 'Vieira', 'Machado', 'Fonseca', 'Morais', 'Monteiro', 'Ramos', 'Nascimento',
  'Cabral', 'Tavares', 'Teixeira', 'Baptista', 'Reis', 'Rocha', 'Pinto', 'Castro'
];

const disciplinasEscolares = [
  { nome: 'Língua Portuguesa', codigo: 'LP', carga: 180 },
  { nome: 'Matemática', codigo: 'MAT', carga: 180 },
  { nome: 'História de Angola', codigo: 'HA', carga: 120 },
  { nome: 'Geografia de Angola', codigo: 'GA', carga: 120 },
  { nome: 'Ciências Naturais', codigo: 'CN', carga: 120 },
  { nome: 'Física', codigo: 'FIS', carga: 120 },
  { nome: 'Química', codigo: 'QUI', carga: 120 },
  { nome: 'Biologia', codigo: 'BIO', carga: 120 },
  { nome: 'Inglês', codigo: 'ING', carga: 120 },
  { nome: 'Francês', codigo: 'FRA', carga: 90 },
  { nome: 'Educação Física', codigo: 'EF', carga: 90 },
  { nome: 'Educação Visual', codigo: 'EV', carga: 60 },
  { nome: 'Educação Musical', codigo: 'EM', carga: 60 },
  { nome: 'Educação Moral e Cívica', codigo: 'EMC', carga: 60 },
  { nome: 'Informática', codigo: 'INF', carga: 60 }
];

// Funções auxiliares
function gerarBI(): string {
  const numeros = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  const letras = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                 String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const finalNumeros = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${numeros}${letras}${finalNumeros}`;
}

function gerarTelefone(): string {
  const prefixos = ['923', '924', '925', '926', '927', '943', '944', '945'];
  const prefixo = prefixos[Math.floor(Math.random() * prefixos.length)];
  const numero = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefixo}${numero}`;
}

function gerarEmail(nome: string, sobrenome: string): string {
  const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'sapo.ao'];
  const dominio = dominios[Math.floor(Math.random() * dominios.length)];
  const nomeClean = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sobrenomeClean = sobrenome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ')[0];
  return `${nomeClean}.${sobrenomeClean}${Math.floor(Math.random() * 99)}@${dominio}`;
}

let contadorEstudante = 1;

function gerarNumeroEstudante(): string {
  const ano = new Date().getFullYear();
  const numero = contadorEstudante.toString().padStart(4, '0');
  contadorEstudante++;
  return `EST${ano}${numero}`;
}

function gerarDataNascimento(idadeMin: number, idadeMax: number): Date {
  const hoje = new Date();
  const anoMin = hoje.getFullYear() - idadeMax;
  const anoMax = hoje.getFullYear() - idadeMin;
  const ano = Math.floor(Math.random() * (anoMax - anoMin + 1)) + anoMin;
  const mes = Math.floor(Math.random() * 12);
  const dia = Math.floor(Math.random() * 28) + 1; // Evita problemas com dias inválidos
  return new Date(ano, mes, dia);
}

function escolherAleatorio(array: any[]): any {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');
  
  // Limpar dados existentes (exceto usuários admin)
  console.log('🧹 Limpando dados existentes...');
  await prisma.attendance.deleteMany();
  await prisma.message.deleteMany();
  await prisma.document.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.schoolClass.deleteMany();
  
  // Manter apenas usuários admin/secretaria
  await prisma.user.deleteMany({
    where: {
      role: {
        not: {
          in: ['ADMIN', 'SECRETARIA']
        }
      }
    }
  });

  console.log('✅ Dados limpos');

  // 1. Criar disciplinas
  console.log('📚 Criando disciplinas...');
  const subjects = [];
  for (const disc of disciplinasEscolares) {
    const subject = await prisma.subject.create({
      data: {
        name: disc.nome,
        description: `Disciplina de ${disc.nome} - Sistema educativo angolano`,
        code: disc.codigo,
        year: '2024',
        category: 'OBRIGATORIA',
        credits: 1,
        workloadHours: disc.carga,
        isActive: true
      }
    });
    subjects.push(subject);
  }
  console.log(`✅ ${subjects.length} disciplinas criadas`);

  // 2. Criar usuários e professores
  console.log('👨‍🏫 Criando professores...');
  const teachers = [];
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  for (let i = 0; i < 20; i++) {
    const nome = escolherAleatorio(nomesAngolanos);
    const sobrenome = escolherAleatorio(sobrenomesAngolanos);
    const email = gerarEmail(nome, sobrenome);
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: `${nome} ${sobrenome}`,
        email: email,
        password: hashedPassword,
        role: 'PROFESSOR'
      }
    });

    // Criar professor
    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        specialization: escolherAleatorio(disciplinasEscolares).nome,
        qualification: escolherAleatorio(['Licenciado', 'Mestre', 'Doutor']),
        experience: Math.floor(Math.random() * 15) + 1
      }
    });

    teachers.push(teacher);
  }
  console.log(`✅ ${teachers.length} professores criados`);

  // 3. Associar professores às disciplinas
  console.log('🔗 Associando professores às disciplinas...');
  for (const teacher of teachers) {
    // Cada professor pode ensinar 1-3 disciplinas
    const numDisciplinas = Math.floor(Math.random() * 3) + 1;
    const disciplinasProf: string[] = [];
    
    for (let i = 0; i < numDisciplinas; i++) {
      let disciplina = escolherAleatorio(subjects);
      while (disciplinasProf.includes(disciplina.id)) {
        disciplina = escolherAleatorio(subjects);
      }
      disciplinasProf.push(disciplina.id);
      
      // Conectar através da relação many-to-many
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          subjects: {
            connect: { id: disciplina.id }
          }
        }
      });
    }
  }
  console.log('✅ Associações professor-disciplina criadas');

  // 4. Criar turmas
  console.log('🏫 Criando turmas...');
  const classes = [];
  const anos = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'];
  const turnos = ['MORNING', 'AFTERNOON', 'EVENING'];
  const salas = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2'];
  
  for (const ano of anos) {
    for (const turno of turnos) {
      if (turno === 'EVENING' && ['7ª Classe', '8ª Classe'].includes(ano)) continue; // Noturno só para classes mais avançadas
      
      const numTurmas = turno === 'EVENING' ? 1 : 2; // Menos turmas no noturno
      
      for (let t = 1; t <= numTurmas; t++) {
        const schoolClass = await prisma.schoolClass.create({
          data: {
            name: `${ano} - Turma ${t} (${turno === 'MORNING' ? 'Manhã' : turno === 'AFTERNOON' ? 'Tarde' : 'Noite'})`,
            year: 2024,
            shift: turno as any,
            capacity: 35
          }
        });
        classes.push(schoolClass);
      }
    }
  }
  console.log(`✅ ${classes.length} turmas criadas`);

  // 5. Criar estudantes
  console.log('🎓 Criando estudantes...');
  for (const schoolClass of classes) {
    // Cada turma terá entre 25-35 alunos
    const numAlunos = Math.floor(Math.random() * 11) + 25;
    
    for (let i = 0; i < numAlunos; i++) {
      const nome = escolherAleatorio(nomesAngolanos);
      const sobrenome = escolherAleatorio(sobrenomesAngolanos);
      const genero = Math.random() > 0.5 ? 'MASCULINO' : 'FEMININO';
      
      // Idade baseada na classe (7ª classe = 12-14 anos, 12ª classe = 17-19 anos)
      const idadeBase = parseInt(schoolClass.name.charAt(0)) + 5;
      const idade = idadeBase + Math.floor(Math.random() * 3);
      
      const student = await prisma.student.create({
        data: {
          firstName: nome,
          lastName: sobrenome,
          gender: genero as any,
          birthDate: gerarDataNascimento(idade, idade + 1),
          biNumber: gerarBI(),
          studentNumber: gerarNumeroEstudante(),
          academicYear: '2024',
          classId: schoolClass.id,
          guardianName: `${escolherAleatorio(nomesAngolanos)} ${escolherAleatorio(sobrenomesAngolanos)}`,
          guardianPhone: gerarTelefone(),
          municipality: escolherAleatorio(municipiosLuanda),
          province: 'Luanda',
          country: 'Angola',
          parentEmail: gerarEmail(nome, sobrenome),
          parentPhone: gerarTelefone(),
          status: 'ATIVO',
          tags: []
        }
      });

      // Criar matrícula
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: schoolClass.id,
          year: 2024,
          status: 'ACTIVE'
        }
      });
    }
  }

  // Contar estudantes criados
  const totalStudents = await prisma.student.count();
  console.log(`✅ ${totalStudents} estudantes criados`);

  // 6. Criar algumas notas de exemplo
  console.log('📊 Criando notas de exemplo...');
  const students = await prisma.student.findMany({
    include: { schoolClass: true }
  });

  // Para cada aluno, criar algumas notas
  let totalGrades = 0;
  for (const student of students.slice(0, 100)) { // Limitar a 100 alunos para não demorar muito
    const numDisciplinas = Math.floor(Math.random() * 5) + 3; // 3-7 disciplinas por aluno
    const disciplinasAluno = subjects.slice(0, numDisciplinas);
    
    for (const subject of disciplinasAluno) {
      const professor = escolherAleatorio(teachers);
      
      // Criar 2-3 notas por disciplina (diferentes trimestres/tipos)
      const numNotas = Math.floor(Math.random() * 2) + 2;
      const tiposNota = ['MAC', 'NPP', 'NPT'];
      
      for (let n = 1; n <= numNotas; n++) {
        const nota = Math.floor(Math.random() * 16) + 5; // Notas entre 5 e 20
        const tipo = escolherAleatorio(tiposNota);
        const trimestre = Math.floor(Math.random() * 3) + 1; // 1, 2, ou 3
        
        try {
          await prisma.grade.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              teacherId: professor.id,
              classId: student.classId,
              value: nota,
              type: tipo as any,
              term: trimestre,
              year: 2024
            }
          });
          totalGrades++;
        } catch (error) {
          // Ignorar erros de constraint unique (evitar duplicatas)
          continue;
        }
      }
    }
  }
  console.log(`✅ ${totalGrades} notas criadas`);

  // 7. Estatísticas finais
  console.log('\n📈 Estatísticas do seed:');
  console.log(`👥 Professores: ${teachers.length}`);
  console.log(`📚 Disciplinas: ${subjects.length}`);
  console.log(`🏫 Turmas: ${classes.length}`);
  console.log(`🎓 Estudantes: ${totalStudents}`);
  console.log(`📊 Notas: ${totalGrades}`);
  
  console.log('\n🎉 Seed completo! Dados fictícios criados com sucesso.');
  console.log('\n👥 Usuários para teste:');
  console.log('📧 admin@escola.com (ADMIN) - senha: 123456');
  console.log('📧 secretaria@escola.com (SECRETARIA) - senha: 123456');
  console.log('📧 Professores: [emails gerados] - senha: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });