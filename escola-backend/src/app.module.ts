import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TeachersModule } from './teachers/teachers.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ClassesModule } from './classes/classes.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { GradesModule } from './grades/grades.module';
import { ReportCardsModule } from './report-cards/report-cards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    SubjectsModule,
    ClassesModule,
    EnrollmentModule,
    GradesModule,
    ReportCardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}