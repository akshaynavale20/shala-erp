import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

// ── Entities
import { Sanstha } from './modules/sanstha/sanstha.entity';
import { Unit } from './modules/unit/unit.entity';
import { AcademicYear } from './modules/academic-year/academic-year.entity';
import { FinancialYear } from './modules/financial-year/financial-year.entity';
import { GradeConfig, Division } from './modules/grade/grade.entity';
import { Stream } from './modules/stream/stream.entity';
import { Subject } from './modules/subject/subject.entity';
import { Role } from './modules/role/role.entity';
import { User, UserUnitRole } from './modules/user/user.entity';
import { Staff } from './modules/staff/staff.entity';
import { Student } from './modules/student/student.entity';
import { StudentAttendance, StaffAttendance } from './modules/attendance/attendance.entity';
import { Exam, ExamMarks } from './modules/exam/exam.entity';
import { FeeStructure, FeeInstallment, ConcessionTemplate, FeePayment, FeePaymentItem, FeeDemand } from './modules/fee/fee.entity';
import { AccountTransaction } from './modules/accounts/accounts.entity';
import { SalaryComponent, SalarySlip } from './modules/salary/salary.entity';
import { Certificate } from './modules/certificate/certificate.entity';
import { TimetableEntry } from './modules/timetable/timetable.entity';
import { LibraryBook, LibraryIssue } from './modules/library/library.entity';
import { AuditLog } from './modules/audit/audit.entity';
import { ReportTemplate } from './modules/report/report-template.entity';

// ── Services
import { SansthaService } from './modules/sanstha/sanstha.service';
import { UnitService } from './modules/unit/unit.service';
import { UserService } from './modules/user/user.service';
import { RoleService } from './modules/role/role.service';
import { StaffService } from './modules/staff/staff.service';
import { StudentService } from './modules/student/student.service';
import { AttendanceService } from './modules/attendance/attendance.service';
import { ExamService } from './modules/exam/exam.service';
import { FeeService } from './modules/fee/fee.service';
import { SalaryService } from './modules/salary/salary.service';
import { CertificateService } from './modules/certificate/certificate.service';
import { AcademicYearService } from './modules/academic-year/academic-year.service';
import { FinancialYearService } from './modules/financial-year/financial-year.service';
import { AccountsService } from './modules/accounts/accounts.service';
import { GradeService } from './modules/grade/grade.service';
import { TimetableService } from './modules/timetable/timetable.service';
import { LibraryService } from './modules/library/library.service';
import { AuthService } from './modules/auth/auth.service';
import { JwtStrategy } from './modules/auth/jwt.strategy';
import { ReportService } from './modules/report/report.service';
import { SaralExportService } from './modules/export/saral-export.service';
import { SmsService } from './modules/notification/sms.service';
import { FeeReminderService } from './modules/notification/fee-reminder.service';
import { AuditInterceptor } from './modules/audit/audit.interceptor';

// ── Controllers
import { SansthaController } from './modules/sanstha/sanstha.controller';
import { UnitController } from './modules/unit/unit.controller';
import { UserController } from './modules/user/user.controller';
import { RoleController } from './modules/role/role.controller';
import { StaffController } from './modules/staff/staff.controller';
import { StudentController } from './modules/student/student.controller';
import { AttendanceController } from './modules/attendance/attendance.controller';
import { ExamController } from './modules/exam/exam.controller';
import { FeeController } from './modules/fee/fee.controller';
import { SalaryController } from './modules/salary/salary.controller';
import { CertificateController } from './modules/certificate/certificate.controller';
import { AcademicYearController } from './modules/academic-year/academic-year.controller';
import { FinancialYearController } from './modules/financial-year/financial-year.controller';
import { ReportController } from './modules/report/report.controller';
import { AccountsController } from './modules/accounts/accounts.controller';
import { GradeController } from './modules/grade/grade.controller';
import { TimetableController } from './modules/timetable/timetable.controller';
import { LibraryController } from './modules/library/library.controller';
import { AuthController } from './modules/auth/auth.controller';
import { HealthController } from './modules/health/health.controller';
import { ExportController } from './modules/export/export.controller';
import { VerifyController } from './modules/verify/verify.controller';

// ── Guards
import { PermissionsGuard } from './common/guards/permissions.guard';

// ── Modules
import { NotificationModule } from './modules/notification/notification.module';

const ALL_ENTITIES = [
  Sanstha, Unit, AcademicYear, FinancialYear,
  GradeConfig, Division, Stream, Subject,
  Role, User, UserUnitRole,
  Staff, Student,
  StudentAttendance, StaffAttendance,
  Exam, ExamMarks,
  FeeStructure, FeeInstallment, ConcessionTemplate, FeePayment, FeePaymentItem, FeeDemand, AccountTransaction,
  SalaryComponent, SalarySlip,
  Certificate,
  TimetableEntry,
  LibraryBook, LibraryIssue,
  AuditLog,
  ReportTemplate,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    TerminusModule,

    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        autoLogging: false,
      },
    }),

    ScheduleModule.forRoot(),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: ALL_ENTITIES,
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    TypeOrmModule.forFeature(ALL_ENTITIES),

    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '8h') },
      }),
    }),

    NotificationModule,
  ],

  controllers: [
    AuthController,
    SansthaController, UnitController,
    UserController, RoleController,
    StaffController, StudentController,
    AttendanceController, ExamController,
    FeeController, SalaryController,
    CertificateController, AcademicYearController, FinancialYearController,
    ReportController, AccountsController,
    GradeController, TimetableController, LibraryController,
    HealthController, ExportController,
    VerifyController,
  ],

  providers: [
    AuthService, JwtStrategy,
    SansthaService, UnitService,
    UserService, RoleService,
    StaffService, StudentService,
    AttendanceService, ExamService,
    FeeService, SalaryService,
    CertificateService, AcademicYearService, FinancialYearService, AccountsService,
    GradeService, TimetableService, LibraryService,
    PermissionsGuard,
    ReportService,
    SaralExportService,
    SmsService,
    FeeReminderService,
    AuditInterceptor,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
