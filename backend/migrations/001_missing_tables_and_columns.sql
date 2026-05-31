-- ============================================================
-- Migration 001 — add missing tables & columns
-- Run: PGPASSWORD=sms_pass_local psql -h localhost -U sms_user -d sms_db -f migrations/001_missing_tables_and_columns.sql
-- ============================================================

-- ── 1. Add missing columns to existing tables ─────────────────────────────

-- certificate.metadata (jsonb for TC/Bonafide extra fields)
ALTER TABLE certificate
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- fee_structure.installment_count
ALTER TABLE fee_structure
  ADD COLUMN IF NOT EXISTS installment_count integer NOT NULL DEFAULT 1;

-- fee_payment: cheque_date, utr_number, cancel_reason
ALTER TABLE fee_payment
  ADD COLUMN IF NOT EXISTS cheque_date date,
  ADD COLUMN IF NOT EXISTS utr_number varchar,
  ADD COLUMN IF NOT EXISTS cancel_reason varchar;

-- ── 2. Create missing enum types ───────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE concession_template_concessiontype_enum AS ENUM (
    'rte', 'bpl', 'sibling', 'staff_child', 'merit', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE timetable_entry_dayofweek_enum AS ENUM (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_transaction_type_enum AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_transaction_category_enum AS ENUM (
    'fee_income', 'grant_income', 'donation', 'other_income',
    'salary', 'rent', 'electricity', 'water', 'maintenance',
    'stationery', 'equipment', 'exam_expense', 'sports',
    'library', 'other_expense'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_transaction_paymentmethod_enum AS ENUM (
    'cash', 'cheque', 'neft', 'upi', 'bank_transfer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE library_book_status_enum AS ENUM (
    'available', 'issued', 'lost', 'damaged'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 3. concession_template ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS concession_template (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at           timestamp NOT NULL DEFAULT now(),
  updated_at           timestamp NOT NULL DEFAULT now(),
  sanstha_id           varchar NOT NULL,
  name_mr              varchar NOT NULL,
  concession_type      concession_template_concessiontype_enum NOT NULL,
  discount_type        varchar NOT NULL,
  discount_value       numeric(10,2) NOT NULL,
  applies_to_fee_types varchar,
  is_active            boolean NOT NULL DEFAULT true
);

-- ── 4. fee_installment ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fee_installment (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          timestamp NOT NULL DEFAULT now(),
  updated_at          timestamp NOT NULL DEFAULT now(),
  sanstha_id          varchar NOT NULL,
  fee_structure_id    varchar NOT NULL,
  installment_number  integer NOT NULL,
  label_mr            varchar NOT NULL,
  due_date            date NOT NULL,
  amount              numeric(10,2) NOT NULL,
  CONSTRAINT uq_fee_installment UNIQUE (fee_structure_id, installment_number)
);

-- ── 5. fee_demand ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fee_demand (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at              timestamp NOT NULL DEFAULT now(),
  updated_at              timestamp NOT NULL DEFAULT now(),
  sanstha_id              varchar NOT NULL,
  unit_id                 varchar NOT NULL,
  student_id              varchar NOT NULL,
  fee_structure_id        varchar NOT NULL,
  academic_year_id        varchar NOT NULL,
  installment_number      integer NOT NULL DEFAULT 1,
  installment_label       varchar,
  due_date                date,
  amount                  numeric(10,2) NOT NULL,
  concession_amount       numeric(10,2) NOT NULL DEFAULT 0,
  concession_reason       varchar,
  concession_template_id  varchar,
  net_amount              numeric(10,2) NOT NULL,
  paid_amount             numeric(10,2) NOT NULL DEFAULT 0,
  is_waived               boolean NOT NULL DEFAULT false,
  CONSTRAINT uq_fee_demand UNIQUE (student_id, fee_structure_id, installment_number)
);

-- ── 6. fee_payment_item ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fee_payment_item (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  timestamp NOT NULL DEFAULT now(),
  updated_at  timestamp NOT NULL DEFAULT now(),
  sanstha_id  varchar NOT NULL,
  payment_id  varchar NOT NULL,
  demand_id   varchar NOT NULL,
  student_id  varchar NOT NULL,
  amount      numeric(10,2) NOT NULL
);

-- ── 7. account_transaction ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_transaction (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        timestamp NOT NULL DEFAULT now(),
  updated_at        timestamp NOT NULL DEFAULT now(),
  sanstha_id        varchar NOT NULL,
  unit_id           varchar,
  financial_year_id varchar,
  type              account_transaction_type_enum NOT NULL,
  category          account_transaction_category_enum NOT NULL,
  description_mr    varchar NOT NULL,
  amount            numeric(12,2) NOT NULL,
  transaction_date  date NOT NULL,
  payment_method    account_transaction_paymentmethod_enum NOT NULL DEFAULT 'cash',
  reference_number  varchar,
  bank_name         varchar,
  voucher_number    varchar,
  party_name_mr     varchar,
  remarks           varchar,
  entered_by        varchar,
  is_approved       boolean NOT NULL DEFAULT false,
  approved_by       varchar,
  document_url      varchar
);

-- ── 8. library_book ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS library_book (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        timestamp NOT NULL DEFAULT now(),
  updated_at        timestamp NOT NULL DEFAULT now(),
  sanstha_id        varchar NOT NULL,
  unit_id           varchar NOT NULL,
  accession_number  varchar,
  title_mr          varchar NOT NULL,
  title_en          varchar,
  author_mr         varchar,
  publisher         varchar,
  subject           varchar,
  category          varchar,
  language          varchar,
  isbn              varchar,
  price             numeric(8,2),
  total_copies      integer NOT NULL DEFAULT 1,
  available_copies  integer NOT NULL DEFAULT 1,
  rack_number       varchar,
  status            library_book_status_enum NOT NULL DEFAULT 'available',
  is_active         boolean NOT NULL DEFAULT true
);

-- ── 9. library_issue ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS library_issue (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   timestamp NOT NULL DEFAULT now(),
  updated_at   timestamp NOT NULL DEFAULT now(),
  sanstha_id   varchar NOT NULL,
  unit_id      varchar NOT NULL,
  book_id      varchar NOT NULL,
  member_type  varchar NOT NULL,
  member_id    varchar NOT NULL,
  issue_date   date NOT NULL,
  due_date     date NOT NULL,
  return_date  date,
  fine_amount  numeric(8,2) NOT NULL DEFAULT 0,
  issued_by    varchar NOT NULL,
  remarks      varchar,
  is_returned  boolean NOT NULL DEFAULT false
);

-- ── 10. timetable_entry ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS timetable_entry (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at       timestamp NOT NULL DEFAULT now(),
  updated_at       timestamp NOT NULL DEFAULT now(),
  sanstha_id       varchar NOT NULL,
  unit_id          varchar NOT NULL,
  academic_year_id varchar NOT NULL,
  grade_config_id  varchar,
  division_id      varchar,
  day_of_week      timetable_entry_dayofweek_enum NOT NULL,
  period_number    integer NOT NULL,
  period_label     varchar,
  start_time       varchar,
  end_time         varchar,
  subject_name_mr  varchar,
  staff_id         varchar,
  room             varchar,
  CONSTRAINT uq_timetable_entry UNIQUE (unit_id, division_id, day_of_week, period_number)
);

-- Done
SELECT 'Migration 001 complete' AS result;
