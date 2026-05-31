# TODOS.md — Marathi SMS Deferred Items
> Items that were explicitly reviewed and deferred. Not vague intentions — each has context and a reason.

---

## 🔴 Pre-Production Blockers (must resolve before first live school)

### TODO-001: JWT Refresh Token Revocation
**Source:** CEO review D9 decision (stateless chosen for simplicity)
**Task:** Add Redis-backed refresh token store. On logout, password change, or admin deactivation:
store the refresh token hash in Redis with TTL = remaining expiry. Validate against store on refresh.
Redis is already in docker-compose — it's a 2-hour implementation.
**Why it matters:** With stateless refresh tokens, a compromised account stays active for up to 7 days.
**Evaluate before:** First production school with real student data goes live.

### TODO-002: E2E Test Infrastructure
**Source:** CEO review D14 decision (deferred)
**Task:** Add Jest + Supertest E2E test setup. Test database configuration (separate test DB).
First 15 tests: auth login/refresh, student CRUD, fee payment flow, permission guard
(verify non-director user cannot access other sanstha's data after D11 fix),
salary slip duplicate prevention (D12 unique constraint).
**Why it matters:** All hardening changes from the production sprint have no automated safety net until this lands.
**Effort:** S-M (human: 1 day / CC: ~30 min)

---

## 🟡 Compliance Features (blocked by Open Questions)

### TODO-003: Shalarth Payroll Export
**Source:** CEO review — blocked by OQ-002 (BEEMS/AEBAS integration) and OQ-016 (aided vs unaided status per unit)
**Task:** Once OQ-002 and OQ-016 are resolved: build Shalarth-compatible salary export.
`SalaryComponent.shalarth_head_code` (nullable) is now in schema — map components to Shalarth pay heads.
**Blockers:** OQ-002, OQ-016

### TODO-004: CCE Progress Cards (Std 1–8 Maharashtra Format)
**Source:** CEO review — blocked by OQ assessment format questions
**Task:** Build CCE-style progress cards with grades (A1/A2/B1/B2/C1/C2/D/E) and rubric-based
assessment sections for Std 1–8. Maharashtra education dept format.
**Blockers:** OQ on CCE grading format (need sample from school)

### TODO-005: FYJC CAP Integration
**Source:** CEO review — blocked by OQ-007 (Jr College TC format) and OQ-008 (Arts subject combos)
**Task:** Integrate with `mahafyjcadmissions.in` CAP process. Record CAP Application ID, merit number,
allotment round, stream, category. Support direct admissions too.
**Blockers:** OQ-007, OQ-008

### TODO-006: Jr College Stream Management
**Source:** CEO review — multiple OQs blocking
**Task:** Stream selection (Science/Commerce/Arts), subject combination configuration per divisional board,
bifocal subject handling (200-mark pattern), Jr College-specific staff designations (प्राचार्य vs मुख्याध्यापक).
**Blockers:** OQ-008, multiple others

### TODO-007: Scholarship Tracking (PSE/UPSE/NMMS/NTS)
**Source:** CEO review — blocked by OQ-003 (school vs student submission flow)
**Task:** Track which students are registered for MSCE scholarship exams, exam roll number,
result, scholarship amount. Export for school bulk submission if OQ-003 resolves to school-submits.
**Blockers:** OQ-003

### TODO-008: UDISE+ Annual Data Collection Module
**Source:** CEO review — defer after SARAL export is validated with real school data
**Task:** Annual UDISE+ data submission workflow. Student enrollment profile (EP), teacher data,
infrastructure data. Schedule: October–December per year.
**Dependency:** SARAL export validated first (shares data model)

---

## 🟢 Quality & Polish (not blocking, but track)

### TODO-009: Audit Log — Field-Level Diff for High-Accountability Entities
**Source:** CEO review D10 decision (operation-level chosen), D20 TODOS confirmation
**Task:** Upgrade AuditLog for Certificate and FeePayment entities to store before/after
JSON snapshot of changed fields. Required before first DEO compliance audit where "who changed
TC date" is a real question.
**Effort:** M (human: 1 day / CC: ~1h)
**Trigger:** Before first DEO/BEEO inspection of the school using this SMS

### TODO-010: Offline PWA / Service Worker
**Source:** CEO review — deferred, no timeline
**Task:** Architecture decision on sync strategy: event sourcing vs last-write-wins vs CRDTs.
Then implement service worker for offline attendance marking + fee collection in offline mode.
**Why it matters:** Rural schools in Maharashtra have patchy connectivity.
**Trigger:** After first school pilot reveals connectivity patterns

### TODO-011: Bulk Import — Staff, Fee Structures from Excel
**Source:** CEO review — same pattern as B1 (student import) but different entities
**Task:** After student bulk import (B1) is validated, extend to staff and fee structure import.
Use same parser and validation framework.
**Dependency:** B1 (student import) must ship first

### TODO-012: SARAL MINI Format Import (SARAL → SMS)
**Source:** CEO review — stretch goal deferred from B1 scope
**Task:** Accept SARAL MINI XLS export format as import source. Parse SARAL column layout
into SMS student records. Requires OQ-001 resolution for SARAL ID field mapping.
**Dependency:** OQ-001 resolution; SARAL export (B2) validated first

### TODO-013: Audit Log Archival Strategy
**Source:** Spec reviewer concern — 7-year retention with no archival mechanism
**Task:** When audit_log table exceeds 100K rows, add pg index on `created_at` + archival cron
that moves rows older than 7 years to a cold-storage table or exports to S3/GCS.
**Trigger:** When DB size monitoring shows audit_log growing significantly

### TODO-014: DLT Template Registration for SMS Gateway
**Source:** CEO review B3 — operational prerequisite, not code
**Task:** Register DLT sender ID and Marathi SMS template with MSG91 or chosen telecom.
Approval takes 1–2 weeks. Must be initiated BEFORE starting B3 (SMS reminders) development.
**Action:** School management / product owner to initiate DLT registration immediately

---

## ✅ Decided — NOT in scope (for record)

| Item | Decision | Reason |
|------|----------|--------|
| WhatsApp Business API | Skip | Approval process too complex for this phase; SMS only |
| Native mobile app | Defer (no timeline) | PWA first; evaluate after first pilot |
| CBSE-specific features | Out of scope | SMS targets Maharashtra state board |
| Custom report builder | Out of scope | Predefined reports cover known requirements |
| Multi-tenant SaaS billing | Out of scope | Single-sanstha deployment model |
| Real-time notifications (WebSocket) | Out of scope | Future phase |
| Student portal (parent-facing) | Out of scope | Future phase |
