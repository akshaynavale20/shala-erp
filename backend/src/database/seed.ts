/**
 * seed.ts — creates initial Sanstha + all system roles + Director user
 * Run once: npx ts-node src/database/seed.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

import { Sanstha } from '../modules/sanstha/sanstha.entity';
import { Unit } from '../modules/unit/unit.entity';
import { AcademicYear } from '../modules/academic-year/academic-year.entity';
import { FinancialYear } from '../modules/financial-year/financial-year.entity';
import { GradeConfig, Division } from '../modules/grade/grade.entity';
import { Stream } from '../modules/stream/stream.entity';
import { Subject } from '../modules/subject/subject.entity';
import { Role, PERMISSIONS, SYSTEM_ROLES, RoleScope, Permission } from '../modules/role/role.entity';
import { User, UserUnitRole } from '../modules/user/user.entity';

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'sms_user',
  password: process.env.DB_PASSWORD || 'sms_pass_local',
  database: process.env.DB_DATABASE || 'sms_db',
  entities: [Sanstha, Unit, AcademicYear, FinancialYear, GradeConfig, Division, Stream, Subject, Role, User, UserUnitRole],
  synchronize: true,
  logging: false,
});

// Permissions shorthand
const P = PERMISSIONS;
const ALL = Object.values(PERMISSIONS) as Permission[];

// System roles definition
const SYSTEM_ROLE_DEFS = [
  {
    key: SYSTEM_ROLES.SANSTHA_DIRECTOR,
    nameMr: 'संस्था संचालक',
    nameEn: 'Sanstha Director',
    scope: RoleScope.SANSTHA,
    permissions: ALL,
  },
  {
    key: SYSTEM_ROLES.SANSTHA_PRESIDENT,
    nameMr: 'संस्था अध्यक्ष',
    nameEn: 'Sanstha President',
    scope: RoleScope.SANSTHA,
    permissions: [P.REPORT_SANSTHA, P.REPORT_UNIT, P.SETUP_MANAGE] as Permission[],
  },
  {
    key: SYSTEM_ROLES.SANSTHA_SECRETARY,
    nameMr: 'संस्था सचिव',
    nameEn: 'Sanstha Secretary',
    scope: RoleScope.SANSTHA,
    permissions: [P.SETUP_MANAGE, P.USER_MANAGE, P.ROLE_MANAGE, P.UNIT_MANAGE, P.REPORT_SANSTHA, P.REPORT_UNIT] as Permission[],
  },
  {
    key: SYSTEM_ROLES.SANSTHA_TREASURER,
    nameMr: 'संस्था खजिनदार',
    nameEn: 'Sanstha Treasurer',
    scope: RoleScope.SANSTHA,
    permissions: [P.SALARY_READ, P.FEE_READ, P.REPORT_SANSTHA, P.REPORT_UNIT] as Permission[],
  },
  {
    key: SYSTEM_ROLES.SANSTHA_ACCOUNTANT,
    nameMr: 'संस्था लेखापाल',
    nameEn: 'Sanstha Accountant',
    scope: RoleScope.SANSTHA,
    permissions: [
      P.FEE_COLLECT, P.FEE_READ, P.FEE_MANAGE,
      P.SALARY_RUN, P.SALARY_READ, P.SALARY_MANAGE,
      P.REPORT_UNIT, P.REPORT_SANSTHA,
    ] as Permission[],
  },
  {
    key: SYSTEM_ROLES.HEADMASTER,
    nameMr: 'मुख्याध्यापक',
    nameEn: 'Head Master',
    scope: RoleScope.UNIT,
    permissions: [
      P.STUDENT_CREATE, P.STUDENT_READ, P.STUDENT_EDIT, P.STUDENT_DELETE,
      P.STAFF_CREATE, P.STAFF_READ, P.STAFF_EDIT,
      P.ATTENDANCE_MARK, P.ATTENDANCE_READ,
      P.EXAM_CREATE, P.EXAM_MARKS_ENTRY, P.EXAM_READ,
      P.FEE_COLLECT, P.FEE_READ, P.FEE_MANAGE,
      P.SALARY_RUN, P.SALARY_READ, P.SALARY_MANAGE,
      P.CERT_ISSUE, P.CERT_READ,
      P.REPORT_UNIT, P.YEAR_TRANSITION,
    ] as Permission[],
  },
  {
    key: SYSTEM_ROLES.PRINCIPAL,
    nameMr: 'प्राचार्य',
    nameEn: 'Principal',
    scope: RoleScope.UNIT,
    permissions: [
      P.STUDENT_CREATE, P.STUDENT_READ, P.STUDENT_EDIT, P.STUDENT_DELETE,
      P.STAFF_CREATE, P.STAFF_READ, P.STAFF_EDIT,
      P.ATTENDANCE_MARK, P.ATTENDANCE_READ,
      P.EXAM_CREATE, P.EXAM_MARKS_ENTRY, P.EXAM_READ,
      P.FEE_COLLECT, P.FEE_READ, P.FEE_MANAGE,
      P.SALARY_RUN, P.SALARY_READ, P.SALARY_MANAGE,
      P.CERT_ISSUE, P.CERT_READ,
      P.REPORT_UNIT, P.YEAR_TRANSITION,
    ] as Permission[],
  },
  {
    key: SYSTEM_ROLES.DEPUTY_HEADMASTER,
    nameMr: 'उपमुख्याध्यापक',
    nameEn: 'Deputy Head Master',
    scope: RoleScope.UNIT,
    permissions: [
      P.STUDENT_CREATE, P.STUDENT_READ, P.STUDENT_EDIT,
      P.ATTENDANCE_MARK, P.ATTENDANCE_READ,
      P.EXAM_CREATE, P.EXAM_MARKS_ENTRY, P.EXAM_READ,
      P.CERT_READ, P.REPORT_UNIT,
    ] as Permission[],
  },
  {
    key: SYSTEM_ROLES.CLASS_TEACHER,
    nameMr: 'वर्गशिक्षक',
    nameEn: 'Class Teacher',
    scope: RoleScope.UNIT,
    permissions: [
      P.STUDENT_READ, P.STUDENT_EDIT,
      P.ATTENDANCE_MARK, P.ATTENDANCE_READ,
      P.EXAM_MARKS_ENTRY, P.EXAM_READ,
      P.CERT_READ,
    ] as Permission[],
  },
  {
    key: SYSTEM_ROLES.SUBJECT_TEACHER,
    nameMr: 'विषय शिक्षक',
    nameEn: 'Subject Teacher',
    scope: RoleScope.UNIT,
    permissions: [
      P.STUDENT_READ,
      P.ATTENDANCE_MARK, P.ATTENDANCE_READ,
      P.EXAM_MARKS_ENTRY, P.EXAM_READ,
    ] as Permission[],
  },
  {
    key: SYSTEM_ROLES.LECTURER,
    nameMr: 'प्रवचनकर्ता (Jr. College)',
    nameEn: 'Lecturer',
    scope: RoleScope.UNIT,
    permissions: [
      P.STUDENT_READ,
      P.ATTENDANCE_MARK, P.ATTENDANCE_READ,
      P.EXAM_MARKS_ENTRY, P.EXAM_READ,
    ] as Permission[],
  },
  {
    key: SYSTEM_ROLES.CLERK,
    nameMr: 'लिपिक',
    nameEn: 'Clerk',
    scope: RoleScope.UNIT,
    permissions: [
      P.STUDENT_CREATE, P.STUDENT_READ, P.STUDENT_EDIT,
      P.FEE_COLLECT, P.FEE_READ,
      P.CERT_ISSUE, P.CERT_READ,
      P.REPORT_UNIT,
    ] as Permission[],
  },
  {
    key: SYSTEM_ROLES.LIBRARIAN,
    nameMr: 'ग्रंथपाल',
    nameEn: 'Librarian',
    scope: RoleScope.UNIT,
    permissions: [P.STUDENT_READ] as Permission[],
  },
];

async function seed() {
  await ds.initialize();
  console.log('DB connected');

  // ── 1. Sanstha
  const sansthaRepo = ds.getRepository(Sanstha);
  let sanstha = await sansthaRepo.findOne({ where: { nameMr: 'चाचणी शिक्षण संस्था' } });
  if (!sanstha) {
    sanstha = await sansthaRepo.save(
      sansthaRepo.create({
        nameMr: 'चाचणी शिक्षण संस्था',
        nameEn: 'Test Education Trust',
        email: 'admin@sanstha.edu',
        phone: '9999999999',
      }),
    );
    console.log('✅ Sanstha created:', sanstha.id);
  } else {
    console.log('ℹ️  Sanstha exists');
  }

  // ── 2. All system roles
  const roleRepo = ds.getRepository(Role);
  let directorRole: Role | null = null;

  for (const def of SYSTEM_ROLE_DEFS) {
    let role = await roleRepo.findOne({ where: { sansthaId: sanstha.id, systemKey: def.key } });
    if (!role) {
      role = await roleRepo.save(
        roleRepo.create({
          sansthaId: sanstha.id,
          nameMr: def.nameMr,
          nameEn: def.nameEn,
          systemKey: def.key,
          scope: def.scope,
          permissions: def.permissions,
          isSystemRole: true,
        }),
      );
      console.log(`✅ Role created: ${def.nameEn}`);
    } else {
      console.log(`ℹ️  Role exists: ${def.nameEn}`);
    }
    if (def.key === SYSTEM_ROLES.SANSTHA_DIRECTOR) directorRole = role;
  }

  // ── 3. Director user
  const userRepo = ds.getRepository(User);
  let director = await userRepo.findOne({ where: { email: 'director@sanstha.edu' } });
  if (!director) {
    director = await userRepo.save(
      userRepo.create({
        sansthaId: sanstha.id,
        nameMr: 'संस्था संचालक',
        email: 'director@sanstha.edu',
        passwordHash: await bcrypt.hash('Admin@1234', 12),
        mustChangePassword: false,
        isActive: true,
      }),
    );
    console.log('✅ Director user created');
    console.log('   Email:    director@sanstha.edu');
    console.log('   Password: Admin@1234');
  }

  // ── 4. Assign Director role
  const uurRepo = ds.getRepository(UserUnitRole);
  const existing = await uurRepo.findOne({ where: { userId: director.id, roleId: directorRole!.id } });
  if (!existing) {
    await uurRepo.save(
      uurRepo.create({
        sansthaId: sanstha.id,
        userId: director.id,
        roleId: directorRole!.id,
        unitId: undefined,
        isActive: true,
      }),
    );
    console.log('✅ Role assigned');
  }

  // ── 5. Academic Year 2026-27
  const ayRepo = ds.getRepository(AcademicYear);
  const ay = await ayRepo.findOne({ where: { sansthaId: sanstha.id, labelEn: '2026-27' } });
  if (!ay) {
    await ayRepo.save(
      ayRepo.create({
        sansthaId: sanstha.id,
        labelMr: '२०२६-२७',
        labelEn: '2026-27',
        startDate: '2026-06-15',
        endDate: '2027-04-30',
        status: 'active' as any,
        isCurrent: true,
      }),
    );
    console.log('✅ Academic year 2026-27 created');
  }

  // ── 6. Financial Year 2026-27
  const fyRepo = ds.getRepository(FinancialYear);
  const fy = await fyRepo.findOne({ where: { sansthaId: sanstha.id, labelEn: '2026-27' } });
  if (!fy) {
    await fyRepo.save(
      fyRepo.create({
        sansthaId: sanstha.id,
        labelMr: '२०२६-२७',
        labelEn: '2026-27',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        status: 'active' as any,
        isCurrent: true,
      }),
    );
    console.log('✅ Financial year 2026-27 created');
  }

  console.log('\n✅ Seed complete. Login at http://localhost:5173/login');
  await ds.destroy();
}

seed().catch((e) => { console.error(e); process.exit(1); });
