// Test script to create grade data
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function createTestGrades() {
  try {
    console.log('🎯 Creating test grades data...');
    
    // Note: This would require authentication in a real scenario
    // For now, we assume the existing students, teachers, subjects, and classes from previous tests exist
    
    // Sample grade data based on the existing enrollment data
    const testGrades = [
      {
        studentId: "existing-student-id-1", // Ana Silva
        subjectId: "existing-subject-id-1", // Matemática
        teacherId: "existing-teacher-id-1", // Professor João
        classId: "existing-class-id-1", // 10ª Classe
        year: 2024,
        value: 8.5
      },
      {
        studentId: "existing-student-id-2", // João Santos
        subjectId: "existing-subject-id-2", // Português
        teacherId: "existing-teacher-id-2", // Professora Maria
        classId: "existing-class-id-1", // 10ª Classe
        year: 2024,
        value: 9.2
      },
      {
        studentId: "existing-student-id-3", // Pedro Costa
        subjectId: "existing-subject-id-1", // Matemática
        teacherId: "existing-teacher-id-1", // Professor João
        classId: "existing-class-id-2", // 11ª Classe
        year: 2024,
        value: 7.8
      },
      {
        studentId: "existing-student-id-1", // Ana Silva
        subjectId: "existing-subject-id-2", // Português
        teacherId: "existing-teacher-id-2", // Professora Maria
        classId: "existing-class-id-1", // 10ª Classe
        year: 2024,
        value: 9.5
      },
      {
        studentId: "existing-student-id-2", // João Santos
        subjectId: "existing-subject-id-1", // Matemática
        teacherId: "existing-teacher-id-1", // Professor João
        classId: "existing-class-id-1", // 10ª Classe
        year: 2024,
        value: 8.0
      }
    ];

    console.log('📝 Sample test grades created:');
    testGrades.forEach((grade, index) => {
      console.log(`${index + 1}. Student: ${grade.studentId}, Subject: ${grade.subjectId}, Grade: ${grade.value}/10`);
    });

    console.log('\n✅ Test grades data structure created successfully!');
    console.log('💡 To use this data, you would need to:');
    console.log('1. Get actual IDs from the database');
    console.log('2. Authenticate with the API');
    console.log('3. POST each grade to /grades endpoint');
    console.log('4. Or use Prisma Studio to insert the data directly');
    
  } catch (error) {
    console.error('❌ Error creating test grades:', error.message);
  }
}

// Run the test
createTestGrades();