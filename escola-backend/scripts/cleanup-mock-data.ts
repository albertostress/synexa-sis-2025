import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupMockData() {
  console.log('🧼 Iniciando limpeza de dados mock do sistema...');
  
  try {
    // 1. Limpar dados relacionados a estudantes (em ordem de dependências)
    console.log('🗑️ Removendo dados de estudantes...');
    
    // Limpar attendances
    await prisma.attendance.deleteMany({});
    console.log('✅ Attendances removidas');
    
    // Limpar grades
    await prisma.grade.deleteMany({});
    console.log('✅ Grades removidas');
    
    // Limpar invoices
    await prisma.invoice.deleteMany({});
    console.log('✅ Invoices removidas');
    
    // Limpar documents
    await prisma.document.deleteMany({});
    console.log('✅ Documents removidos');
    
    // Limpar parents
    await prisma.parent.deleteMany({});
    console.log('✅ Parents removidos');
    
    // Limpar enrollments
    await prisma.enrollment.deleteMany({});
    console.log('✅ Enrollments removidos');
    
    // Limpar students
    await prisma.student.deleteMany({});
    console.log('✅ Students removidos');
    
    // 2. Limpar dados de comunicação
    console.log('🗑️ Removendo dados de comunicação...');
    
    // Limpar communication (verificar se existem)
    try {
      await prisma.conversationMessage.deleteMany({});
      await prisma.conversationParticipant.deleteMany({});
      await prisma.conversation.deleteMany({});
      console.log('✅ Conversations removidas');
    } catch (e) {
      console.log('⚠️ Conversations não encontradas (podem não existir)');
    }
    
    // Limpar communication messages e messages
    await prisma.communicationMessage.deleteMany({});
    await prisma.message.deleteMany({});
    console.log('✅ Messages removidas');
    
    // 3. Limpar dados de professores e estrutura acadêmica
    console.log('🗑️ Removendo dados acadêmicos...');
    
    // Limpar loans (biblioteca)
    await prisma.loan.deleteMany({});
    console.log('✅ Loans removidos');
    
    // Limpar schedules
    await prisma.schedule.deleteMany({});
    console.log('✅ Schedules removidos');
    
    // Limpar teachers (manter relação com users)
    await prisma.teacher.deleteMany({});
    console.log('✅ Teachers removidos');
    
    // Limpar subjects
    await prisma.subject.deleteMany({});
    console.log('✅ Subjects removidos');
    
    // Limpar school classes
    await prisma.schoolClass.deleteMany({});
    console.log('✅ School Classes removidas');
    
    // 4. Limpar módulos secundários
    console.log('🗑️ Removendo módulos secundários...');
    
    // Events
    await prisma.event.deleteMany({});
    console.log('✅ Events removidos');
    
    // Transport
    await prisma.studentTransport.deleteMany({});
    await prisma.transportRoute.deleteMany({});
    console.log('✅ Transport removido');
    
    // Library
    await prisma.book.deleteMany({});
    console.log('✅ Books removidos');
    
    // Uploaded files
    await prisma.uploadedFile.deleteMany({});
    console.log('✅ Uploaded Files removidos');
    
    // Student notes e timelines (verificar se existem)
    try {
      await prisma.studentNote.deleteMany({});
      await prisma.studentTimeline.deleteMany({});
      console.log('✅ Student Notes/Timelines removidos');
    } catch (e) {
      console.log('⚠️ Student Notes/Timelines não encontrados');
    }
    
    // Event participation
    await prisma.eventParticipation.deleteMany({});
    console.log('✅ Event Participation removida');
    
    // Settings não essenciais (manter configurações do sistema)
    // Não removemos settings pois podem conter configurações importantes
    
    // 5. Limpar usuários NÃO ADMIN
    console.log('🗑️ Removendo usuários não-admin...');
    
    const adminUsers = await prisma.user.findMany({
      where: { role: Role.ADMIN }
    });
    
    if (adminUsers.length === 0) {
      throw new Error('❌ ERRO: Nenhum usuário ADMIN encontrado! Operação cancelada para segurança.');
    }
    
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          not: Role.ADMIN
        }
      }
    });
    
    console.log(`✅ ${deletedUsers.count} usuários não-admin removidos`);
    console.log(`✅ ${adminUsers.length} usuário(s) ADMIN preservado(s)`);
    
    // 6. Verificação final
    console.log('\n📊 Verificação final do sistema:');
    
    const remainingUsers = await prisma.user.count();
    const remainingStudents = await prisma.student.count();
    const remainingTeachers = await prisma.teacher.count();
    const remainingClasses = await prisma.schoolClass.count();
    const remainingMessages = await prisma.message.count();
    
    console.log(`👥 Usuários restantes: ${remainingUsers} (apenas ADMIN)`);
    console.log(`🎓 Estudantes restantes: ${remainingStudents}`);
    console.log(`👨‍🏫 Professores restantes: ${remainingTeachers}`);
    console.log(`🏫 Turmas restantes: ${remainingClasses}`);
    console.log(`💬 Mensagens restantes: ${remainingMessages}`);
    
    if (remainingStudents > 0 || remainingTeachers > 0 || remainingClasses > 0 || remainingMessages > 0) {
      console.log('⚠️ ATENÇÃO: Alguns dados mock podem não ter sido removidos completamente.');
    }
    
    console.log('\n🎉 Limpeza de dados mock concluída com sucesso!');
    console.log('✅ Sistema pronto para receber dados reais');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanupMockData()
    .then(() => {
      console.log('🏁 Script de limpeza finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na limpeza:', error);
      process.exit(1);
    });
}

export default cleanupMockData;