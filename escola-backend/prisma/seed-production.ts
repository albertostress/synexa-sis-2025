import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de produção para Synexa-SIS-2025...');

  // 1. Criar Usuário Administrador Principal
  const adminPassword = await bcrypt.hash('Admin@2025', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@synexa.ao' },
    update: {},
    create: {
      email: 'admin@synexa.ao',
      name: 'Administrador Synexa',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Administrador criado:', admin.email);

  // 2. Criar Diretor
  const directorPassword = await bcrypt.hash('Diretor@2025', 10);
  
  const director = await prisma.user.upsert({
    where: { email: 'diretor@escola.ao' },
    update: {},
    create: {
      email: 'diretor@escola.ao',
      name: 'João Manuel Silva',
      password: directorPassword,
      role: 'DIRETOR',
    },
  });

  console.log('✅ Diretor criado:', director.email);

  // 3. Criar Secretária
  const secretaryPassword = await bcrypt.hash('Secretaria@2025', 10);
  
  const secretary = await prisma.user.upsert({
    where: { email: 'secretaria@escola.ao' },
    update: {},
    create: {
      email: 'secretaria@escola.ao',
      name: 'Maria José Santos',
      password: secretaryPassword,
      role: 'SECRETARIA',
    },
  });

  console.log('✅ Secretária criada:', secretary.email);

  // 4. Criar Professores
  const professorPassword = await bcrypt.hash('Professor@2025', 10);
  
  const professores = [
    { name: 'Ana Paula Ferreira', email: 'ana.ferreira@escola.ao', specialization: 'Matemática' },
    { name: 'Carlos Eduardo Neto', email: 'carlos.neto@escola.ao', specialization: 'Português' },
    { name: 'Isabel Maria Costa', email: 'isabel.costa@escola.ao', specialization: 'Ciências' },
    { name: 'Pedro Miguel Santos', email: 'pedro.santos@escola.ao', specialization: 'História' },
    { name: 'Sofia Alexandra Lima', email: 'sofia.lima@escola.ao', specialization: 'Geografia' },
  ];

  for (const prof of professores) {
    const user = await prisma.user.upsert({
      where: { email: prof.email },
      update: {},
      create: {
        email: prof.email,
        name: prof.name,
        password: professorPassword,
        role: 'PROFESSOR',
      },
    });

    // Criar registro de professor
    await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: `Professor(a) de ${prof.specialization}`,
        qualification: 'Licenciatura em ' + prof.specialization,
        specialization: prof.specialization,
        experience: 5,
      },
    });

    console.log('✅ Professor(a) criado(a):', prof.name);
  }

  // 5. Criar Turmas para 2025/2026
  const turmas = [
    { name: '7A', classLevel: 'CLASSE_7', shift: 'MORNING', capacity: 35 },
    { name: '7B', classLevel: 'CLASSE_7', shift: 'MORNING', capacity: 35 },
    { name: '8A', classLevel: 'CLASSE_8', shift: 'MORNING', capacity: 35 },
    { name: '8B', classLevel: 'CLASSE_8', shift: 'AFTERNOON', capacity: 35 },
    { name: '9A', classLevel: 'CLASSE_9', shift: 'MORNING', capacity: 30 },
    { name: '10A', classLevel: 'CLASSE_10', shift: 'MORNING', capacity: 30 },
    { name: '10B', classLevel: 'CLASSE_10', shift: 'AFTERNOON', capacity: 30 },
    { name: '11A', classLevel: 'CLASSE_11', shift: 'MORNING', capacity: 25 },
    { name: '12A', classLevel: 'CLASSE_12', shift: 'MORNING', capacity: 25 },
  ];

  for (const turma of turmas) {
    await prisma.schoolClass.upsert({
      where: { 
        name_year: {
          name: turma.name,
          year: 2025
        }
      },
      update: {},
      create: {
        name: turma.name,
        classLevel: turma.classLevel as any,
        cycle: getCycleFromClassLevel(turma.classLevel),
        year: 2025,
        shift: turma.shift as any,
        capacity: turma.capacity,
      },
    });

    console.log('✅ Turma criada:', turma.name);
  }

  // 6. Criar Disciplinas Básicas
  const disciplinas = [
    { name: 'Matemática', code: 'MAT', category: 'CORE' },
    { name: 'Língua Portuguesa', code: 'LP', category: 'CORE' },
    { name: 'Física', code: 'FIS', category: 'SCIENCE' },
    { name: 'Química', code: 'QUI', category: 'SCIENCE' },
    { name: 'Biologia', code: 'BIO', category: 'SCIENCE' },
    { name: 'História', code: 'HIS', category: 'HUMANITIES' },
    { name: 'Geografia', code: 'GEO', category: 'HUMANITIES' },
    { name: 'Inglês', code: 'ING', category: 'LANGUAGES' },
    { name: 'Educação Física', code: 'EF', category: 'SPORTS' },
    { name: 'Informática', code: 'INF', category: 'TECHNOLOGY' },
  ];

  const teachers = await prisma.teacher.findMany({ include: { user: true } });

  for (const disc of disciplinas) {
    // Criar para cada nível de classe (7ª a 12ª)
    for (let classe = 7; classe <= 12; classe++) {
      const classLevel = `CLASSE_${classe}` as any;
      
      const subject = await prisma.subject.upsert({
        where: { 
          name_year_classLevel: {
            name: disc.name,
            year: '2025/2026',
            classLevel: classLevel
          }
        },
        update: {},
        create: {
          name: disc.name,
          code: `${disc.code}${classe}`,
          description: `${disc.name} para ${classe}ª classe`,
          year: '2025/2026',
          classLevel: classLevel,
          cycle: getCycleFromClassLevel(classLevel),
          category: disc.category as any,
          credits: 4,
          teachers: {
            connect: teachers
              .filter(t => t.specialization?.includes(disc.name.split(' ')[0]))
              .map(t => ({ id: t.id }))
              .slice(0, 2) // Máximo 2 professores por disciplina
          }
        },
      });
    }

    console.log('✅ Disciplina criada para todos os níveis:', disc.name);
  }

  // 7. Criar Configurações Iniciais
  await prisma.settings.upsert({
    where: { key: 'school_name' },
    update: {},
    create: {
      key: 'school_name',
      value: 'Escola Secundária Synexa',
      description: 'Nome da instituição',
      category: 'GENERAL',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'school_year' },
    update: {},
    create: {
      key: 'school_year',
      value: '2025/2026',
      description: 'Ano letivo atual',
      category: 'ACADEMIC',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'school_address' },
    update: {},
    create: {
      key: 'school_address',
      value: 'Rua da Educação, 123 - Luanda, Angola',
      description: 'Endereço da escola',
      category: 'GENERAL',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'school_phone' },
    update: {},
    create: {
      key: 'school_phone',
      value: '+244 923 456 789',
      description: 'Telefone de contato',
      category: 'GENERAL',
    },
  });

  console.log('✅ Configurações iniciais criadas');

  // 8. Criar alguns alunos de exemplo
  const alunos = [
    { firstName: 'João', lastName: 'Silva', birthDate: new Date('2008-03-15'), gender: 'MALE' },
    { firstName: 'Maria', lastName: 'Santos', birthDate: new Date('2008-07-22'), gender: 'FEMALE' },
    { firstName: 'Pedro', lastName: 'Costa', birthDate: new Date('2009-01-10'), gender: 'MALE' },
    { firstName: 'Ana', lastName: 'Ferreira', birthDate: new Date('2009-05-18'), gender: 'FEMALE' },
    { firstName: 'Carlos', lastName: 'Neto', birthDate: new Date('2008-11-30'), gender: 'MALE' },
  ];

  const turma7A = await prisma.schoolClass.findFirst({ where: { name: '7A', year: 2025 } });

  for (let i = 0; i < alunos.length; i++) {
    const aluno = alunos[i];
    const studentNumber = `2025${String(i + 1).padStart(4, '0')}`;
    
    const student = await prisma.student.upsert({
      where: { studentNumber },
      update: {},
      create: {
        studentNumber,
        firstName: aluno.firstName,
        lastName: aluno.lastName,
        birthDate: aluno.birthDate,
        gender: aluno.gender as any,
        address: 'Luanda, Angola',
        phoneNumber: '+244 923 000 00' + i,
        email: `${aluno.firstName.toLowerCase()}.${aluno.lastName.toLowerCase()}@aluno.escola.ao`,
      },
    });

    // Matricular na 7ª A
    if (turma7A) {
      await prisma.enrollment.upsert({
        where: {
          studentId_classId_year: {
            studentId: student.id,
            classId: turma7A.id,
            year: 2025,
          },
        },
        update: {},
        create: {
          studentId: student.id,
          classId: turma7A.id,
          year: 2025,
          status: 'ACTIVE',
          enrollmentDate: new Date(),
        },
      });
    }

    console.log('✅ Aluno criado e matriculado:', `${aluno.firstName} ${aluno.lastName}`);
  }

  console.log('\n🎉 Seed de produção concluído com sucesso!');
  console.log('\n📋 CREDENCIAIS DE ACESSO:');
  console.log('================================');
  console.log('ADMINISTRADOR:');
  console.log('Email: admin@synexa.ao');
  console.log('Senha: Admin@2025');
  console.log('');
  console.log('DIRETOR:');
  console.log('Email: diretor@escola.ao');
  console.log('Senha: Diretor@2025');
  console.log('');
  console.log('SECRETÁRIA:');
  console.log('Email: secretaria@escola.ao');
  console.log('Senha: Secretaria@2025');
  console.log('');
  console.log('PROFESSORES:');
  console.log('Senha padrão: Professor@2025');
  console.log('================================');
}

function getCycleFromClassLevel(classLevel: string): any {
  const level = parseInt(classLevel.replace('CLASSE_', ''));
  if (level <= 6) return 'PRIMARIO_2';
  if (level <= 9) return 'SECUNDARIO_1';
  return 'SECUNDARIO_2';
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });