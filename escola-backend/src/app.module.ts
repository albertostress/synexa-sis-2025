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
import { DocumentsModule } from './documents/documents.module';
import { FinanceModule } from './finance/finance.module';
import { ParentsPortalModule } from './parents-portal/parents-portal.module';
import { AttendanceModule } from './attendance/attendance.module';
import { CommunicationModule } from './communication/communication.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadsModule } from './uploads/uploads.module';
import { LibraryModule } from './library/library.module';
import { TransportModule } from './transport/transport.module';
import { EventsModule } from './events/events.module';
import { SettingsModule } from './settings/settings.module';

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
    DocumentsModule,
    FinanceModule,
    ParentsPortalModule,
    AttendanceModule,
    CommunicationModule,
    AnalyticsModule,
    UploadsModule,
    LibraryModule,
    TransportModule,
    EventsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}