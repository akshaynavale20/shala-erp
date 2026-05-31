# PLAN.md — Marathi School Management System
## शिक्षण संस्था व्यवस्थापन प्रणाली

> Phase 3 Planning Document. No code until user types: **"Approved — start Phase 1 build"**

---

## 1. Confirmed Decisions

| Decision | Value |
|----------|-------|
| Hosting | AWS Mumbai (ap-south-1) |
| Frontend | Web-only (no mobile app in Phase 1) |
| Numerals in PDFs | Devanagari (०, १, २, ३…) |
| Biometric | Out of Phase 1 |
| FYJC CAP integration | Not required |
| Payroll model | Flat monthly salary only (simple) |
| Std 6–7 promotion | Manual (class teacher decides) |
| SARAL ID | Free-text VARCHAR, no validation |
| Language | 100% Marathi Devanagari UI; English code/logs/docs |

---

## 2. Glossary Lock-In

Full glossary lives in `GLOSSARY.md`. Key locked terms for code-level reference:

| Concept | Locked Marathi Term | Internal Code Name |
|---------|--------------------|--------------------|
| Sanstha (Trust) | शिक्षण संस्था | `sanstha` |
| Unit (School/Jr College) | घटक | `unit` |
| Academic Year | शैक्षणिक वर्ष | `academic_year` |
| Financial Year | आर्थिक वर्ष | `financial_year` |
| Student | विद्यार्थी | `student` |
| Staff | कर्मचारी | `staff` |
| Class | वर्ग / इयत्ता | `grade` |
| Division / Section | तुकडी | `division` |
| Roll Number | हजेरी क्रमांक | `roll_number` |
| Stream | शाखा | `stream` |
| Attendance | हजेरी | `attendance` |
| Fee | शुल्क | `fee` |
| Salary | वेतन | `salary` |
| Leaving Certificate | शाळा सोडल्याचा दाखला | `leaving_certificate` |
| Progress Card | प्रगती पत्रक | `progress_card` |
| General Register | जनरल रजिस्टर | `general_register` |
| Promotion | वर्गोन्नती | `promotion` |
| Detention | वर्ग पुनरावृत्ती | `detention` |
| Category | प्रवर्ग | `category` |
| Headmaster | मुख्याध्यापक | `headmaster` |
| Principal (Jr College) | प्राचार्य | `principal` |
| Lecturer | प्राध्यापक | `lecturer` |
| Practical Exam | प्रात्यक्षिक परीक्षा | `practical_exam` |
| Internal Marks | अंतर्गत गुण | `internal_marks` |
| External Marks | बाह्य गुण | `external_marks` |

---

## 3. Data Model

### 3.1 Multi-Tenant Hierarchy

```
sanstha (1)
  └── unit (N)           ← each school / Jr College
        ├── grade (N)    ← Std 1–12
        │     └── division (N)   ← तुकडी अ, ब, क
        ├── stream (N)   ← Science / Commerce / Arts (Jr College only)
        ├── student (N)  ← scoped to unit + academic_year
        └── staff (N)    ← allocated to unit (can be multi-unit)
```

**Rule enforced on every table:**
```
sanstha_id     NOT NULL  -- always present
unit_id        NOT NULL  -- always present (except sanstha-level tables)
academic_year_id         -- on all student/exam/attendance/fee records
financial_year_id        -- on all salary/payment/fee-collection records
```

---

### 3.2 Complete Entity List

#### TIER 1 — Sanstha & Configuration

```sql
sanstha
  id, name_mr, name_en, ptr_number, pan, address_mr,
  phone, email, logo_url, created_at

unit
  id, sanstha_id, name_mr, name_en, unit_type (enum: school|jr_college|pre_primary),
  udise_code, address_mr, phone, email,
  aided (bool), divisional_board, established_year,
  is_active, created_at

academic_year
  id, sanstha_id, unit_id (nullable — null = Sanstha-wide default),
  label (e.g. "२०२६-२७"), start_date, end_date,
  status (enum: upcoming|active|closing|closed),
  created_at

financial_year
  id, sanstha_id, label (e.g. "२०२६-२७"),
  start_date (Apr 1), end_date (Mar 31),
  status (enum: active|closed), locked_by, locked_at

role
  id, sanstha_id, name, scope (enum: sanstha|unit),
  permissions (JSONB), is_system_role (bool)

user
  id, sanstha_id, name_mr, email, phone,
  password_hash, is_active, last_login_at

user_unit_role
  id, user_id, unit_id (nullable — null = sanstha-wide),
  role_id, valid_from, valid_to
  -- allows one user → multiple units × roles
```

#### TIER 2 — Academic Configuration

```sql
grade_config
  id, unit_id, academic_year_id,
  grade_number (1–12), grade_label_mr (e.g. "इयत्ता पाचवी"),
  level (enum: pre_primary|primary|upper_primary|secondary|hsc),
  promotion_mode (enum: auto|manual|board_result),
  pass_marks_pct (nullable), min_attendance_pct (nullable)

division
  id, unit_id, academic_year_id, grade_config_id,
  name_mr (e.g. "तुकडी अ"), class_teacher_id (→ staff),
  room_number

stream
  id, unit_id, name_mr (कला शाखा / विज्ञान शाखा / वाणिज्य शाखा),
  code (arts|science|commerce), is_active

subject
  id, unit_id, name_mr, name_en, subject_code,
  stream_id (nullable — null = compulsory all streams),
  grade_range_start, grade_range_end,
  subject_type (enum: theory|practical|bifocal|compulsory),
  max_theory_marks, max_internal_marks, max_practical_marks,
  is_bifocal (bool), bifocal_total_marks

subject_combination
  id, unit_id, stream_id, name_mr,
  subject_ids (JSONB array)
  -- approved combos per stream per divisional board
```

#### TIER 3 — Students

```sql
student
  id, sanstha_id, unit_id, academic_year_id,
  -- Identity
  first_name_mr, middle_name_mr, last_name_mr,
  first_name_en, last_name_en,
  gender (enum: male|female|other),
  dob, place_of_birth_mr,
  -- Family
  father_name_mr, mother_name_mr,
  guardian_name_mr, guardian_relation_mr,
  parent_phone, parent_alt_phone, parent_email,
  address_current_mr, address_permanent_mr,
  -- Identity documents
  aadhaar_masked (last 4 digits only — DPDP),
  -- Maharashtra-specific
  religion_mr, caste_mr, sub_caste_mr,
  category (enum: open|sc|st|vj|nt_a|nt_b|nt_c|nt_d|obc|sbc|sebc|ews),
  mother_tongue_mr, nationality_mr,
  rte_quota (bool), bpl (bool),
  is_divyang (bool), disability_type_mr, disability_pct,
  is_single_girl_child (bool),
  ex_serviceman_ward (bool),
  -- School enrollment
  gr_number, saral_id,
  admission_date, admission_type (enum: regular|rte_25|age_appropriate),
  admission_standard, previous_school_mr,
  medium (enum: marathi|hindi|english|semi_english|other),
  udise_code_prev_school,
  -- Current placement
  division_id, roll_number, stream_id (Jr College),
  subject_combination_id (Jr College),
  -- Jr College CAP (not required — kept for future)
  -- Status
  status (enum: active|withdrawn|tc_issued|alumni|detained),
  -- Scholarship
  scholarship_flag (bool), scholarship_type_mr,
  caste_validity_cert_status (enum: not_required|pending|submitted|verified),
  caste_validity_cert_number,
  -- Timestamps
  created_at, updated_at, created_by

student_year_history
  id, student_id, academic_year_id, unit_id,
  grade_number, division_id, roll_number,
  stream_id, result (enum: promoted|detained|board_pending|tc_issued|dropout),
  promoted_by, promotion_notes, promoted_at
  -- immutable log of every year's result
```

#### TIER 4 — Staff

```sql
staff
  id, sanstha_id,
  first_name_mr, middle_name_mr, last_name_mr,
  gender, dob, phone, email,
  aadhaar_masked,
  pan_number,
  -- Employment
  employee_code, joining_date,
  designation_mr, department_mr,
  staff_type (enum: teaching|non_teaching|admin|contract),
  qualification_mr,
  -- Bank (for salary)
  bank_name_mr, bank_account_no, bank_ifsc, bank_branch_mr,
  payment_mode (enum: cash|cheque|bank_transfer),
  -- Status
  status (enum: active|on_leave|transferred|retired|resigned),
  created_at, updated_at

staff_unit_allocation
  id, staff_id, unit_id, academic_year_id,
  role_mr, is_primary_unit (bool),
  valid_from, valid_to
  -- allows one staff → multiple units (shared/transferred)

staff_subject_allocation
  id, staff_id, unit_id, academic_year_id,
  subject_id, division_id (nullable — null = stream-wide for Jr College)
```

#### TIER 5 — Attendance

```sql
attendance_record
  id, unit_id, academic_year_id, financial_year_id,
  student_id, date,
  status (enum: present|absent|late|half_day|holiday|leave),
  marked_by (user_id), marked_at,
  remarks_mr

attendance_summary
  id, unit_id, student_id, academic_year_id,
  month (1–12), year,
  working_days, days_present, days_absent, percentage

staff_attendance_record
  id, unit_id, financial_year_id,
  staff_id, date,
  status (enum: present|absent|late|half_day|on_duty|leave),
  leave_type (enum: cl|sl|el|ml|lop|duty|other),
  marked_by, marked_at
```

#### TIER 6 — Examinations & Marks

```sql
exam
  id, unit_id, academic_year_id,
  name_mr (e.g. "सहामाही परीक्षा"),
  exam_type (enum: unit_test|half_yearly|annual|board|practical),
  grade_number, stream_id (nullable),
  start_date, end_date,
  status (enum: scheduled|in_progress|marks_entry|completed|locked),
  created_by

exam_subject
  id, exam_id, subject_id,
  max_theory_marks, max_internal_marks, max_practical_marks,
  passing_marks

student_marks
  id, exam_id, exam_subject_id, student_id,
  unit_id, academic_year_id,
  theory_marks_obtained, internal_marks_obtained, practical_marks_obtained,
  total_obtained, is_absent (bool),
  is_pass (bool, computed),
  entered_by, entered_at, verified_by, verified_at

exam_result_summary
  id, exam_id, student_id, unit_id,
  total_marks_obtained, total_max_marks,
  percentage, grade_mr, rank_in_class,
  result (enum: pass|fail|absent|withheld)
```

#### TIER 7 — Fees

```sql
fee_structure
  id, unit_id, academic_year_id,
  name_mr (e.g. "इयत्ता नववी शुल्क"),
  grade_number (nullable), stream_id (nullable),
  category_applicable (nullable — null = all),
  is_active

fee_head
  id, fee_structure_id,
  head_name_mr (e.g. "शिक्षण शुल्क"),
  amount, frequency (enum: annual|term|monthly|one_time),
  is_optional (bool), sequence_order

student_fee_allocation
  id, student_id, unit_id, academic_year_id,
  fee_structure_id,
  total_billed, total_paid, balance,
  concession_amount, concession_reason_mr

fee_collection
  id, unit_id, academic_year_id, financial_year_id,
  student_id, receipt_number,
  collection_date,
  heads_detail (JSONB — [{head_name_mr, amount}]),
  gross_amount, concession_amount, net_amount,
  payment_mode (enum: cash|cheque|online),
  cheque_number, utr_number, bank_name,
  collected_by (user_id), remarks_mr,
  is_cancelled (bool), cancelled_by, cancelled_at
```

#### TIER 8 — Salary (Simple)

```sql
staff_salary_master
  id, staff_id, unit_id, financial_year_id,
  monthly_amount, effective_from,
  notes_mr, created_by

salary_run
  id, unit_id, financial_year_id,
  month (1–12), year,
  status (enum: draft|finalised|paid),
  run_by, run_at, finalised_by, finalised_at

salary_run_line
  id, salary_run_id, staff_id,
  gross_amount,
  working_days, days_present, lop_days,
  lop_deduction,
  manual_additions (JSONB [{label_mr, amount}]),
  manual_deductions (JSONB [{label_mr, amount}]),
  net_amount,
  payment_status (enum: pending|paid),
  paid_date, payment_mode, reference_number,
  paid_by (user_id)

salary_slip
  id, salary_run_line_id, staff_id, unit_id,
  slip_pdf_url, generated_at, generated_by
```

#### TIER 9 — Certificates & Documents

```sql
certificate_issue
  id, unit_id, academic_year_id,
  student_id (nullable), staff_id (nullable),
  cert_type (enum: tc|bonafide|character|experience|service|migration|eligibility),
  serial_number,
  issue_date, issued_by,
  purpose_mr (for bonafide/character),
  pdf_url,
  is_duplicate (bool), original_issue_id

tc_details
  id, certificate_issue_id,
  leaving_date, reason_for_leaving_mr,
  last_standard, conduct_mr, progress_mr,
  remarks_mr
```

#### TIER 10 — Audit

```sql
audit_log
  id, sanstha_id, unit_id,
  user_id, action, entity_type, entity_id,
  old_value (JSONB), new_value (JSONB),
  ip_address, user_agent, created_at
  -- immutable; no UPDATE/DELETE on this table
```

---

### 3.3 Key Constraints

```sql
-- Every student record scoped to sanstha
ALTER TABLE student ADD CONSTRAINT chk_student_sanstha
  CHECK (unit_id IN (SELECT id FROM unit WHERE sanstha_id = student.sanstha_id));

-- Roll numbers unique per division per AY
UNIQUE (division_id, roll_number, academic_year_id) ON student;

-- GR numbers unique per unit (never recycled)
UNIQUE (unit_id, gr_number) ON student;

-- Receipt numbers unique per unit per FY
UNIQUE (unit_id, financial_year_id, receipt_number) ON fee_collection;

-- Salary run unique per unit per month per FY
UNIQUE (unit_id, financial_year_id, month, year) ON salary_run;
```

---

## 4. Module Map — Every Screen

### Navigation Structure

```
/ (root)
├── /setup          → संस्था सेटअप
├── /dashboard      → संस्था डॅशबोर्ड  [Sanstha Director]
├── /unit/:id       → घटक डॅशबोर्ड    [Unit Head]
├── /students       → विद्यार्थी
├── /staff          → कर्मचारी
├── /attendance     → हजेरी
├── /exams          → परीक्षा
├── /fees           → शुल्क
├── /salary         → वेतन
├── /certificates   → प्रमाणपत्रे
└── /reports        → अहवाल
```

### Full Screen Inventory

#### Setup & Configuration (`/setup`)

| Route | Marathi Heading | Description |
|-------|----------------|-------------|
| `/setup/sanstha` | संस्था माहिती | Create/edit Sanstha: name, PTR, logo, contact |
| `/setup/units` | घटक यादी | List all units |
| `/setup/units/new` | नवीन घटक जोडा | Add school / Jr College unit |
| `/setup/units/:id` | घटक सेटअप | Edit unit: UDISE, address, aided/unaided |
| `/setup/academic-years` | शैक्षणिक वर्ष | Manage AYs; open/close AY |
| `/setup/financial-years` | आर्थिक वर्ष | Manage FYs; lock closed FY |
| `/setup/grades` | वर्ग व तुकड्या | Configure grade list per unit; add divisions |
| `/setup/streams` | शाखा | Science / Commerce / Arts per Jr College unit |
| `/setup/subjects` | विषय | Subject master: name, type, max marks |
| `/setup/subject-combinations` | विषय संच | Approved subject combos per stream |
| `/setup/fee-structures` | शुल्क रचना | Fee heads, amounts per grade/stream |
| `/setup/roles` | भूमिका | Role + permission config |
| `/setup/users` | वापरकर्ते | Create users; assign role + unit |

#### Dashboard (`/dashboard`, `/unit/:id`)

| Route | Marathi Heading | Who sees |
|-------|----------------|---------|
| `/dashboard` | संस्था डॅशबोर्ड | Sanstha Director |
| `/unit/:id/dashboard` | घटक डॅशबोर्ड | Unit Head, subject staff |

#### Students (`/students`)

| Route | Marathi Heading |
|-------|----------------|
| `/students` | विद्यार्थी यादी |
| `/students/new` | नवीन प्रवेश |
| `/students/:id` | विद्यार्थी माहिती |
| `/students/:id/edit` | विद्यार्थी माहिती संपादन |
| `/students/:id/history` | वर्ष इतिहास |
| `/students/:id/marks` | गुणपत्रक |
| `/students/:id/fees` | शुल्क तपशील |
| `/students/:id/attendance` | हजेरी तपशील |
| `/students/:id/certificates` | प्रमाणपत्रे |
| `/students/general-register` | जनरल रजिस्टर |
| `/students/promotion` | वर्गोन्नती (Year-end) |

#### Staff (`/staff`)

| Route | Marathi Heading |
|-------|----------------|
| `/staff` | कर्मचारी यादी |
| `/staff/new` | नवीन कर्मचारी |
| `/staff/:id` | कर्मचारी माहिती |
| `/staff/:id/edit` | माहिती संपादन |
| `/staff/:id/attendance` | हजेरी तपशील |
| `/staff/:id/salary` | वेतन तपशील |
| `/staff/:id/certificates` | अनुभव / सेवा दाखला |

#### Attendance (`/attendance`)

| Route | Marathi Heading |
|-------|----------------|
| `/attendance/mark` | हजेरी नोंद करा |
| `/attendance/view` | हजेरी पाहा |
| `/attendance/monthly` | मासिक हजेरी अहवाल |
| `/attendance/staff/mark` | कर्मचारी हजेरी |
| `/attendance/staff/monthly` | कर्मचारी मासिक अहवाल |

#### Exams (`/exams`)

| Route | Marathi Heading |
|-------|----------------|
| `/exams` | परीक्षा यादी |
| `/exams/new` | नवीन परीक्षा |
| `/exams/:id` | परीक्षा तपशील |
| `/exams/:id/marks` | गुण नोंदणी |
| `/exams/:id/results` | निकाल |
| `/exams/:id/progress-cards` | प्रगती पत्रक (PDF) |

#### Fees (`/fees`)

| Route | Marathi Heading |
|-------|----------------|
| `/fees/collect` | शुल्क स्वीकारा |
| `/fees/receipts` | पावत्यांची यादी |
| `/fees/receipts/:id` | पावती (PDF) |
| `/fees/dues` | थकीत शुल्क यादी |
| `/fees/report` | शुल्क संकलन अहवाल |

#### Salary (`/salary`)

| Route | Marathi Heading |
|-------|----------------|
| `/salary/run` | मासिक वेतन प्रक्रिया |
| `/salary/run/:id` | वेतन तपशील |
| `/salary/slips` | वेतन चिठ्ठ्या |
| `/salary/register` | वेतन रजिस्टर (PDF) |
| `/salary/staff/:id` | कर्मचारी वार्षिक सारांश |

#### Certificates (`/certificates`)

| Route | Marathi Heading |
|-------|----------------|
| `/certificates/tc/new` | शाळा सोडल्याचा दाखला |
| `/certificates/bonafide/new` | वर्तणूक दाखला |
| `/certificates/tc/list` | दाखला यादी |
| `/certificates/experience/new` | अनुभव प्रमाणपत्र |

#### Reports (`/reports`)

| Route | Marathi Heading |
|-------|----------------|
| `/reports/strength` | विद्यार्थी संख्या अहवाल |
| `/reports/category` | प्रवर्गनिहाय अहवाल |
| `/reports/exam-performance` | परीक्षा निकाल अहवाल |
| `/reports/fee-collection` | शुल्क संकलन अहवाल |
| `/reports/salary-register` | वेतन रजिस्टर |
| `/reports/attendance` | हजेरी अहवाल |
| `/reports/saral-export` | SARAL निर्यात (CSV) |

---

## 5. Sanstha Director Master Dashboard

**Route:** `/dashboard`  
**Marathi Heading:** संस्था डॅशबोर्ड  
**Access:** संस्था संचालक only

### Layout — 4 Zones

```
┌─────────────────────────────────────────────────────┐
│  ZONE A — Unit Switcher Strip                        │
│  [सर्व घटक ▼]  [घटक अ]  [घटक ब]  [घटक क]          │
│  Context toggle: "संचालक म्हणून" / "घटक प्रमुख म्हणून पाहा" │
└─────────────────────────────────────────────────────┘
┌───────────────────┬─────────────────────────────────┐
│  ZONE B — Numbers │  ZONE C — Today                 │
│  विद्यार्थी संख्या  │  आजची हजेरी % (per unit)        │
│  [total] per unit │  शुल्क संकलन (आज)               │
│  कर्मचारी संख्या   │  प्रलंबित वेतन चिठ्ठ्या           │
│  [total] per unit │  नवीन प्रवेश (या महिन्यात)        │
└───────────────────┴─────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  ZONE D — Financial Summary                          │
│  शुल्क: बिल झालेले | जमा | थकीत  (AY + FY tabs)   │
│  वेतन: या महिन्यात भरले | प्रलंबित | एकूण रक्कम      │
│  Last exam performance comparison across units       │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  ZONE E — Year Transition (shown during Apr–Jun)     │
│  AY close checklist: [██████░░] ७०% पूर्ण           │
│  वर्गोन्नती प्रलंबित: ४५ विद्यार्थी                   │
│  शिक्षक पुनरावलोकन प्रलंबित: १२ वर्ग                 │
│  गळती / TC जारी / वर्गोन्नत / पुनरावृत्ती counts      │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  ZONE F — Activity Feed                              │
│  Recent across all units: admissions, TC issued,    │
│  fees collected, salary runs, year transitions      │
│  [drill-down → unit dashboard]                      │
└─────────────────────────────────────────────────────┘
```

**"Switch Context" affordance:**  
Director can select any unit and toggle to "घटक प्रमुख म्हणून पाहा" — sees that unit's full dashboard as if they were the unit head. Every action taken in this mode logs: `"[Director Name] acting as Unit Head — [Unit Name]"` in audit_log.

---

## 6. Tech Stack

### 6.1 Backend

| Component | Choice | Justification |
|-----------|--------|--------------|
| Runtime | Node.js 22 LTS | Team familiarity; excellent PDF/Unicode libs |
| Framework | NestJS + TypeScript | Decorators, DI, modular; generates clean OpenAPI docs |
| Database | PostgreSQL 16 (RDS ap-south-1) | JSONB for flexible fields; row-level security for multi-tenant |
| ORM | TypeORM | Works well with NestJS; migration support |
| Cache / Session | Redis (ElastiCache) | Session store; report caching |
| Auth | JWT + refresh token | Stateless; role claims in token |
| File Storage | S3 (ap-south-1) | PDF storage; private bucket; pre-signed URLs |
| PDF Generation | `pdfmake` + Devanagari fonts | Embedded Noto Sans Devanagari; full Unicode; no browser dependency |
| Task Queue | Bull (Redis-backed) | PDF generation jobs; async report exports |
| API | REST (v1) | Simple; mobile app can consume same API later |

### 6.2 Frontend

| Component | Choice | Justification |
|-----------|--------|--------------|
| Framework | React 18 + Vite | Fast HMR; good ecosystem |
| Language | TypeScript | Type safety; matches backend |
| i18n | `i18next` + `react-i18next` | `mr-IN` locale; ICU MessageFormat for gender/plural |
| UI Components | Ant Design (`antd`) | Form-heavy admin UIs; good table/filter components; overridable theme |
| State | Zustand (light) + React Query | Server state via RQ; global app state via Zustand |
| Forms | React Hook Form + Zod | Validation with Marathi error messages |
| Charts | Recharts | Dashboard stats |
| PDF Preview | `react-pdf` | View generated PDFs in-browser |

### 6.3 Fonts

| Font | Usage |
|------|-------|
| **Mukta** (Google Fonts) | Primary UI font — designed for Devanagari + Latin; excellent readability; 400/500/700 weights |
| **Noto Sans Devanagari** | Fallback; embedded in PDFs via pdfmake |
| **Noto Serif Devanagari** | Optional for formal certificates (TC, salary slip) |

Minimum font size: **16px** for body text (Devanagari conjuncts need more space than Latin). Labels: 14px min.

### 6.4 Infrastructure (AWS ap-south-1)

```
Route 53 → CloudFront → S3 (React app)
                      → ALB → ECS Fargate (NestJS API, 2 tasks min)
                            → RDS PostgreSQL 16 (Multi-AZ)
                            → ElastiCache Redis
                      → S3 (PDF / document storage, private)
```

- **Data residency:** All resources in ap-south-1 (Mumbai) — satisfies DPDP Act 2023 India residency requirement
- **Backups:** RDS automated daily snapshots (7-day retention); S3 versioning enabled
- **Secrets:** AWS Secrets Manager for DB credentials, JWT secret
- **Logging:** CloudWatch Logs; audit_log table in DB (7-year retention per Maharashtra aided school norms)

### 6.5 CI/CD

```
GitHub → GitHub Actions
  ├── lint (ESLint + tsc --noEmit)
  ├── Marathi UI lint (custom rule: fail if any i18n key value contains [A-Za-z] outside allow-list)
  ├── test (Jest unit + integration)
  ├── build
  └── deploy → ECS (API) + S3/CloudFront (frontend)
```

**Marathi lint rule allow-list** (Latin characters permitted in Marathi UI strings):
- Email addresses
- URLs / domain names
- PAN number format (XXXXX0000X)
- Aadhaar (last 4 digits display)
- UDISE code (numeric)
- SARAL ID
- Receipt/serial numbers

---

## 7. Document Templates

| # | Document | Marathi Name | Format | Key Fields | Source |
|---|----------|-------------|--------|-----------|--------|
| T1 | Transfer Certificate (School) | शाळा सोडल्याचा दाखला | A4 Portrait | 27 fields (see RESEARCH-BRIEF §2.1) | Maharashtra ED practice |
| T2 | Transfer Certificate (Jr College) | महाविद्यालय सोडल्याचा दाखला | A4 Portrait | TC fields + stream, subjects, HSC seat no | ⚠️ OQ-007 pending |
| T3 | Bonafide / Character Certificate | वर्तणूक दाखला | A5 Landscape or A4 | Name, class, AY, DOB, purpose, seal | ⚠️ OQ-006 pending |
| T4 | Progress Card Std 1–4 | प्रगती पत्रक (इ. १–४) | A4 | Grade descriptors, no numeric marks | Maharashtra CCE |
| T5 | Progress Card Std 5, 8 | प्रगती पत्रक (इ. ५, ८) | A4 | Marks + pass/fail + retest flag | Post-2025 GR |
| T6 | Progress Card Std 9–10 | प्रगती पत्रक (इ. ९–१०) | A4 | Subject-wise marks, total, %, grade, rank | Maharashtra SSC pattern |
| T7 | Progress Card Std 11 | प्रगती पत्रक (इ. ११) | A4 | Internal + theory; stream-specific subjects | College-internal |
| T8 | HSC Practical Marks Sheet | प्रात्यक्षिक गुण पत्रक | A4 | Subject, int/ext assessor, marks, date | MSBSHSE format |
| T9 | Fee Receipt | शुल्क पावती | A5 | Receipt no, student, heads, mode, amount | School standard |
| T10 | Salary Slip | वेतन चिठ्ठी | A5 | Staff, month, gross, deductions, net | Simple model |
| T11 | Salary Register (monthly) | मासिक वेतन रजिस्टर | A3 Landscape | All staff, amounts, LOP, net, signature | Sanstha standard |
| T12 | Experience Certificate | अनुभव प्रमाणपत्र | A4 | Staff name, designation, period, duties | School standard |
| T13 | Appointment Letter | नियुक्ती पत्र | A4 | Staff, post, unit, date, terms | School standard |
| T14 | General Register (print view) | जनरल रजिस्टर | A3 Landscape | All GR columns per Maharashtra format | SARAL schema |

**All PDFs:**
- Devanagari numerals (०–९) — OQ-011 resolved
- Noto Sans Devanagari / Noto Serif Devanagari embedded
- School/Jr College logo top-left; school name + address as letterhead
- Seal placeholder (rubber stamp area) + signature line
- Serial/receipt number bottom-right
- Watermark "प्रत" (Copy) on duplicate certificates
- Generated via `pdfmake`; stored on S3; served via pre-signed URL

---

## 8. Compliance Checklist

### 8.1 SARAL Alignment

| SARAL Field | SMS Field | Status |
|-------------|-----------|--------|
| General Register No. | `student.gr_number` | ✅ |
| Stream | `student.stream_id` | ✅ |
| Admission Academic Year | `student.academic_year_id` | ✅ |
| Standard | `division.grade_number` | ✅ |
| Division | `student.division_id` | ✅ |
| Student Name (3 parts) | `first_name_mr`, `middle_name_mr`, `last_name_mr` | ✅ |
| Date of Birth | `student.dob` | ✅ |
| Gender | `student.gender` | ✅ |
| Mother's Name (3 parts) | `student.mother_name_mr` (split on export) | ✅ |
| UDISE Number | `unit.udise_code` | ✅ |
| Medium | `student.medium` | ✅ |
| Semi-English | `student.medium == semi_english` | ✅ |
| Date of Admission | `student.admission_date` | ✅ |
| Standard at Admission | `student.admission_standard` | ✅ |
| Admission Type | `student.admission_type` | ✅ |
| Aadhaar / UID | `student.aadhaar_masked` (export with school's own record) | ⚠️ DPDP — see §8.3 |
| SARAL ID | `student.saral_id` (free-text) | ✅ |

**SARAL export:** CSV in exact MINI[UDISE]-[Class]-[Division]-[Stream]-[Year].xls column order. Route: `/reports/saral-export`

### 8.2 U-DISE+ Alignment

| U-DISE Category | SMS Coverage |
|----------------|-------------|
| Student enrollment count per grade/gender | ✅ Derived from student table |
| Category-wise enrollment (SC/ST/OBC/etc.) | ✅ `student.category` |
| RTE 25% enrollment | ✅ `student.rte_quota` |
| New admissions / dropouts | ✅ `student.status` transitions |
| Staff count per type | ✅ `staff.staff_type` |
| Medium of instruction | ✅ `unit` + `student.medium` |

### 8.3 DPDP Act 2023 Compliance

| Requirement | Implementation |
|-------------|---------------|
| Aadhaar — no full storage | Store only last 4 digits (`aadhaar_masked`). Full Aadhaar only shown/used during admission verification — not persisted |
| Biometric — not in Phase 1 | No biometric data collected in Phase 1 |
| Purpose limitation | Each data field tagged with purpose in data dictionary |
| Parental consent for minors | Consent checkbox on admission form; timestamp stored |
| Right to erasure | Student `status=withdrawn` → PII can be anonymised after 7 years (configurable per Maharashtra norm) |
| Data residency | All data in AWS ap-south-1 (India) |
| Audit trail | `audit_log` table — immutable, 7-year retention |
| Access control | Row-level: staff see only their unit's data; `sanstha_id` check on every query |

### 8.4 RTE Act

| Requirement | SMS Support |
|-------------|------------|
| Admission without caste/birth certificate (provisionally) | `admission_type = regular`; docs flagged pending |
| RTE 25% quota tracking | `student.rte_quota = true` |
| No detention Std 1–4 | `grade_config.promotion_mode = auto` for grades 1–4 |
| Age-appropriate admission | `admission_type = age_appropriate` |

---

## 9. Design System

### 9.1 Typography

```css
/* Primary font — all UI */
font-family: 'Mukta', 'Noto Sans Devanagari', sans-serif;

/* Font scale */
--font-xs:   14px;   /* minimum — form labels, table cells */
--font-sm:   16px;   /* body text, buttons */
--font-md:   18px;   /* section headings */
--font-lg:   22px;   /* page headings */
--font-xl:   28px;   /* dashboard numbers */

/* Line height — Devanagari needs more vertical space */
--line-height-body: 1.8;
--line-height-heading: 1.5;

/* Devanagari-specific */
/* Never use font-weight: 300 — Mukta light renders conjuncts poorly */
/* Minimum weight: 400 Regular; prefer 500 Medium for UI labels */
```

### 9.2 Colour Palette (neutral — Sanstha can override with their brand)

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#1A5276` (deep blue) | Buttons, links, active nav |
| `--primary-light` | `#D6EAF8` | Selected rows, highlights |
| `--secondary` | `#F39C12` (saffron) | Accents, alerts, Maharashtra-resonant |
| `--success` | `#27AE60` | Pass, present, paid |
| `--danger` | `#E74C3C` | Fail, absent, overdue |
| `--warning` | `#F1C40F` | Pending, late |
| `--neutral-900` | `#1A1A1A` | Body text |
| `--neutral-600` | `#555555` | Secondary text |
| `--neutral-200` | `#F5F5F5` | Table alternating rows |
| `--white` | `#FFFFFF` | Card backgrounds |

### 9.3 Component Guidelines

- **Tables:** Devanagari text needs min row-height 48px; `word-break: keep-all` for Devanagari
- **Forms:** Label above input (not inline) — Devanagari labels are wider than Latin
- **Buttons:** Min height 44px; min padding 12px 20px; touch target for future mobile readiness
- **Badges (category):** Colour-coded per pravar category for quick scanning
- **Number display:** Always Devanagari in PDFs; Arabic allowed in web UI inputs (user types Arabic, display converts)
- **Date display:** DD/MM/YYYY format; month names in Marathi where space allows

### 9.4 Accessibility

- WCAG AA minimum
- All form fields: `aria-label` in Marathi
- Error messages: Marathi, specific (not "invalid input" — say "जन्म दिनांक चुकीचा आहे")
- Keyboard navigation: full support
- Screen reader: test with NVDA (Windows) which supports Devanagari

---

## 10. Phased Roadmap

### Phase 1 — MVP (estimated 10–13 person-weeks)

| Module | Code Name | Effort | Dependencies |
|--------|-----------|--------|-------------|
| C1: Sanstha + Unit Setup | `setup` | 1.5 pw | — |
| C3: Staff Master | `staff` | 1.5 pw | setup |
| C2: Student Master + GR | `students` | 2.5 pw | setup, staff |
| C4: Attendance (manual) | `attendance` | 1.5 pw | students, staff |
| H2: Fee Management | `fees` | 2 pw | students, setup |
| H1: Exams + Marks | `exams` | 2 pw | students, setup |
| H3: Certificates | `certificates` | 1.5 pw | students, staff |
| H4: Salary (simple) | `salary` | 1 pw | staff |
| C5: Year Transition | `year-transition` | 1.5 pw | all above |
| H5: Sanstha Dashboard | `dashboard` | 1 pw | all above |
| **Total** | | **~16 pw** | |

> Parallelism possible: staff + student masters can run in parallel. Certificates after students. Dashboard last.

**Build order (one module at a time, sign-off after each):**
1. `setup` — Sanstha + unit config + roles + users
2. `staff` — staff master, unit allocation
3. `students` — admission, GR, student record
4. `attendance` — daily marking, monthly report
5. `fees` — structure config, collection, receipt PDF
6. `exams` — create exam, marks entry, progress card PDF
7. `certificates` — TC, bonafide PDF
8. `salary` — monthly run, salary slip PDF
9. `year-transition` — AY close, promotion engine
10. `dashboard` — Sanstha Director view

### Phase 2 — Post-MVP

| Module | Effort estimate |
|--------|----------------|
| P1: Timetable (वेळापत्रक) | 3 pw |
| P2: Library (ग्रंथालय) | 2 pw |
| P3: Leave Management (रजा) | 1.5 pw |
| P4: SARAL / U-DISE Export | 1 pw |
| P5: SMS / WhatsApp to parents | 2 pw |
| P6: Parent + Student Portal | 4 pw |
| P7: Scholarship Tracking | 1 pw |
| P8: Lab Management | 2 pw |
| P9: HSC Board Registration | 2 pw |
| P10: Biometric Integration | 3 pw |
| P11: Shalarth Export (aided units) | 2 pw |

---

## 11. Open Risks

| # | Risk | Impact | Mitigation |
|---|------|--------|-----------|
| R1 | Maharashtra GR changes CCE/no-detention policy further | Progress card format, auto-promotion engine | Config-driven promotion rules; easy to update per unit |
| R2 | MSBSHSE changes HSC subject combinations or marks pattern | Marks entry validation | Subject master is fully configurable; no hardcoded marks |
| R3 | DPDP Act 2023 implementing rules (not yet final) may restrict Aadhaar further | Student data collection | Store only last-4; full design already compliant |
| R4 | FYJC CAP becomes mandatory state-wide (already happening 2026-27) | Jr College admissions | CAP fields exist in data model as optional; enable without schema change |
| R5 | Shalarth API changes or new mandatory fields for aided units | Payroll for aided units | Simple salary module is independent; Shalarth export is Phase 2 add-on |
| R6 | School-specific Marathi terminology differs from research findings | All UI strings | School confirmation required before first module goes live (terminology-review-pending.csv) |
| R7 | Font rendering issues on low-end Android browsers | Mobile web usability | Mukta subset; test on Chrome Android on entry-level device |
| R8 | SARAL 2.0 portal changes data field requirements | SARAL export format | Export is a configurable mapping; update mapping without schema change |
| R9 | Multi-unit Sanstha with >500 concurrent users during exam result day | Performance | RDS read replica; Redis cache for reports; async PDF generation |
| R10 | Unresolved OQs (OQ-006, OQ-007, OQ-008, OQ-009 etc.) block certificate templates | Document templates | Build certificate module with placeholder templates; school confirms format before first TC is generated |

---

## 12. Marathi Quality Gates

**Before any module is merged to main:**
- [ ] All user-facing strings in `mr-IN` locale file only — no hardcoded Marathi in JSX
- [ ] Marathi lint CI check passes (no Latin in UI strings outside allow-list)
- [ ] Devanagari numerals in all generated PDFs
- [ ] Any new Marathi string added to `terminology-review-pending.csv`
- [ ] Gender inflection handled where student gender affects string (विद्यार्थी / विद्यार्थिनी)
- [ ] Error messages in Marathi and specific
- [ ] Date format DD/MM/YYYY; month names in Marathi on certificates

**Before production go-live:**
- [ ] `terminology-review-pending.csv` reviewed by a Marathi-medium teacher
- [ ] All PDFs reviewed for layout with Devanagari text (conjuncts, matras, line breaks)
- [ ] TC and progress card reviewed against actual school's existing printed formats
