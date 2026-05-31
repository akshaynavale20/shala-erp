# OPEN-QUESTIONS.md — Unresolved Items Requiring Confirmation

> Do NOT invent answers. Each item here blocks a design or implementation decision.
> Resolution source: school staff, government portal, or Maharashtra ED circular/GR.

---

## Category 1 — System Integration & Data Formats

### OQ-001: SARAL ID format
**Question:** What is the exact format and digit structure of the system-generated SARAL student ID? Is it a sequential number, or does it encode district/school/year?  
**Why it matters:** Data model — `saral_id` field length and validation rule.  
**Where to confirm:** Log into SARAL portal as school admin; view any student record; note the ID format. Or contact SARAL helpdesk: mahastudent.assist@gmail.com  
**Blocking:** Student master data model

---

### OQ-002: BEEMS / AEBAS / Shalarth attendance link
**Question:** For aided school staff, is there a mandatory link between biometric attendance (AEBAS at `attendance.maharashtra.gov.in`) and Shalarth salary processing? Specifically: does Shalarth deduct salary based on AEBAS data, or is attendance tracked separately?  
**Why it matters:** If aided units must use AEBAS, the SMS biometric module must push to AEBAS as well as internal records.  
**Where to confirm:** Speak to the school's administrative head / accountant at the aided unit. Check latest GRs from School Education and Sports Department.  
**Blocking:** Biometric attendance module design for aided units; Shalarth export spec

---

### OQ-003: MSCE scholarship registration — school vs student submission
**Question:** Does the school submit bulk student data to MSCE (`puppssmsce.in`) on behalf of students, or does each student/parent apply individually? If school submits, what is the data format (CSV/Excel/API)?  
**Why it matters:** If school submits, SMS needs an export feature. If students apply individually, SMS only needs a tracking field.  
**Where to confirm:** Check `puppssmsce.in` for school login section; or contact MSCE Pune.  
**Blocking:** Scholarship exam module design

---

### OQ-004: Aadhaar on TC — mandatory or optional?
**Question:** Is the student's Aadhaar number required on the Transfer Certificate (शाळा सोडल्याचा दाखला) per any Maharashtra GR, or is it optional?  
**Why it matters:** DPDP Act 2023 requires purpose limitation for Aadhaar display. If not mandated, we should omit from TC PDF.  
**Where to confirm:** Check Maharashtra School Education GR; consult BEEO/DEO office.  
**Blocking:** TC template design; DPDP compliance

---

### OQ-005: No-detention policy — current status for Std 6 & 7
**Question:** Maharashtra has reintroduced annual exams and pass/fail for Std 5 and Std 8 (GR January 2025). What is the current policy for Std 6 and Std 7 — auto-promote (no detention), or are exams/detention applicable?  
**Why it matters:** Auto-promotion engine configuration; progress card format for these classes.  
**Where to confirm:** Maharashtra School Education and Sports Department GR dated January 2025 or subsequent; BEEO office.  
**Blocking:** Auto-promotion engine; CCE vs marks-based progress card for Std 6–7

---

## Category 2 — Document Formats

### OQ-006: Bonafide vs Vartanuk Dakhla — distinction
**Question:** Does the school issue two distinct certificates: (a) "वर्तणूक दाखला" = conduct/character certificate, and (b) "अध्ययन प्रमाणपत्र" = proof of enrollment (bonafide)? Or is "वर्तणूक दाखला" used for both purposes?  
**Why it matters:** Two separate templates vs one; separate numbering series.  
**Where to confirm:** School admin office — ask to see existing certificate formats.  
**Blocking:** Certificate module template count

---

### OQ-007: Jr College TC — exact heading and field order
**Question:** What is the exact Marathi heading of the Jr College Transfer Certificate? (e.g., "महाविद्यालय सोडल्याचा दाखला" or "ज्युनियर कॉलेज सोडल्याचा दाखला"?) What are the mandatory fields specific to Jr College TC that differ from school TC?  
**Why it matters:** Jr College TC template design.  
**Where to confirm:** Existing Jr College TC from the school's records; or MSBSHSE guidelines.  
**Blocking:** Jr College TC template

---

### OQ-008: Arts stream permitted subject combinations
**Question:** Which subject combinations are permitted by the relevant divisional board for the कला (Arts) stream at this Jr College? The Maharashtra Board allows a pool of subjects but the permitted combinations depend on divisional board circulars.  
**Why it matters:** Subject combination validation at admission; prevents students registering for disallowed combos.  
**Where to confirm:** Divisional board office (Pune/Mumbai/etc.) circular; or college principal who manages board registration.  
**Blocking:** Jr College subject combination configuration

---

### OQ-009: Bifocal IT marks structure
**Question:** For Information Technology (IT) as a bifocal subject in HSC: is the total 100 marks (50 theory + 50 practical) or 200 marks (same as Computer Science and Electronics bifocal pattern)? Does it differ for Science vs Commerce stream students?  
**Why it matters:** Marks entry form; maximum marks validation; progress card layout.  
**Where to confirm:** MSBSHSE official syllabus document for IT bifocal; or current teacher of IT at the college.  
**Blocking:** IT bifocal marks model

---

### OQ-010: Internal marks breakdown for Commerce subjects
**Question:** For Commerce subjects (BK, OCM, Economics, SP), the 20 internal marks are split 5+5+10. Does this apply uniformly to all Commerce subjects, or do some subjects (e.g., Secretarial Practice) have a different breakdown?  
**Why it matters:** Internal marks entry form per subject.  
**Where to confirm:** MSBSHSE Commerce syllabus document; or college's Commerce subject teacher.  
**Blocking:** HSC marks entry form

---

## Category 3 — Terminology Confirmation

### OQ-011: Numerals — Devanagari or Arabic?
**Question:** On printed reports (progress cards, TC, fee receipts, salary slips), should numbers appear in Devanagari (०, १, २…) or Arabic (0, 1, 2…)?  
**Why it matters:** All PDF templates, number formatting library config.  
**Where to confirm:** Show existing printed report to school; ask preference. Most Maharashtra govt printouts use Arabic.  
**Blocking:** PDF generation configuration; `i18next` number formatting locale

---

### OQ-012: "सहामाही" vs "अर्धवार्षिक" for half-yearly exam
**Question:** Which term does this school use for the half-yearly examination — "सहामाही परीक्षा" or "अर्धवार्षिक परीक्षा"?  
**Why it matters:** Timetable, marks entry, report headings.  
**Where to confirm:** Existing progress card / exam schedule of this school.  
**Blocking:** Exam type configuration; progress card template

---

### OQ-013: "डॅशबोर्ड" vs "मुख्य पृष्ठ" for main dashboard screen
**Question:** In the school's context, is "डॅशबोर्ड" an acceptable loanword for the main summary screen, or should we use "मुख्य पृष्ठ" or "सारांश पृष्ठ"?  
**Why it matters:** Navigation labels; heading on the main screen.  
**Where to confirm:** Ask Marathi-medium teacher or admin at the school.  
**Blocking:** Navigation design

---

### OQ-014: "भ्रमणध्वनी क्रमांक" vs "मोबाईल नंबर" for phone number label
**Question:** For the mobile number field on forms, which label is preferred: the formal "भ्रमणध्वनी क्रमांक" or the informal "मोबाईल नंबर" that is universally understood?  
**Why it matters:** Form labels, admission form, parent record.  
**Where to confirm:** Ask Marathi-medium teacher.  
**Blocking:** Form field label design

---

### OQ-015: Jr College — "प्रात्यक्षिक" or "प्रयोगात्मक"?
**Question:** When referring to practical exams at Jr College, is "प्रात्यक्षिक परीक्षा" universally used, or does the school use "प्रयोगात्मक परीक्षा" for lab practicals?  
**Why it matters:** Marks entry form labels, marksheet.  
**Where to confirm:** Existing internal marksheet of the Jr College.  
**Blocking:** Marks entry labels

---

## Category 4 — Sanstha-Specific (to resolve in Phase 2 Discovery)

### OQ-016: Aided vs unaided status per unit
**Question:** Which units of this Sanstha are aided (grant-in-aid) and which are unaided? This determines Shalarth requirement, pay scale norms, and AEBAS obligation.  
**Why it matters:** Payroll module configuration; Shalarth export scope; BEEMS/AEBAS integration requirement.  
**Where to confirm:** Sanstha Director / Accountant — check grant sanction order from DEO.  
**Blocking:** Payroll architecture; biometric integration for staff

---

### OQ-017: FYJC CAP — is this Jr College in a CAP-cluster?
**Question:** Is this Jr College in a district/city where FYJC CAP (online centralized admissions) applies? From 2026-27 it is state-wide, but confirm the college is registered on `mahafyjcadmissions.in`.  
**Why it matters:** If yes, admission module must record CAP allotment fields. If local admissions, different flow.  
**Where to confirm:** Principal of the Jr College; or check `mahafyjcadmissions.in` for college listing.  
**Blocking:** Jr College admissions module

---

### OQ-018: Divisional board affiliation
**Question:** Which divisional board is this Jr College affiliated with? (Pune / Mumbai / Nagpur / Aurangabad / Kolhapur / Amravati / Nashik / Latur / Konkan)  
**Why it matters:** Some documents and report formats differ by divisional board; board registration submission goes to divisional office.  
**Where to confirm:** Jr College's registration certificate with MSBSHSE.  
**Blocking:** Document templates; board submission module

---

### OQ-019: Existing data migration
**Question:** What data exists in digital form currently? Per unit: (a) student records — Excel/Access/current ERP?, (b) staff records — Shalarth only, or also internal?, (c) fee records — Excel/tally?, (d) attendance — manual only?  
**Why it matters:** Migration module design; data cleaning scope; go-live timeline.  
**Where to confirm:** Each unit's administrative office.  
**Blocking:** Data migration plan

---

### OQ-020: Biometric devices — existing or new procurement?
**Question:** Are any biometric devices already installed at any unit? If yes: brand, model, current software/middleware. If new procurement needed: what is the budget range?  
**Why it matters:** Integration approach (existing device APIs vs fresh procurement spec).  
**Where to confirm:** School/college office; IT person if any.  
**Blocking:** Biometric integration module; device onboarding workflow

---

### OQ-021: Shalarth-eligible staff count
**Question:** How many teaching and non-teaching staff across aided units are currently processed via Shalarth? Is this Sanstha's Shalarth login already set up, or is this a new setup?  
**Why it matters:** Scope of payroll module; whether Shalarth export is Phase 1 or Phase 2.  
**Where to confirm:** Sanstha accountant.  
**Blocking:** Payroll module scope

---

### OQ-022: जात वैधता tracking — current process
**Question:** How does the Jr College currently track caste validity certificate status for reserved-quota students? Is there an existing register or Excel, and what are the status values used?  
**Why it matters:** Caste validity tracking module data model.  
**Where to confirm:** Jr College office / clerk who handles admissions.  
**Blocking:** Admission module caste validity workflow

---

### OQ-023: SEBC / Maratha reservation — current application
**Question:** Is the Sanstha admitting students under SEBC (Maratha reservation, 10%) given the Supreme Court stay? What is the current practice — admitting provisionally, not admitting, or following state interim orders?  
**Why it matters:** Category dropdown must reflect current law; provisional admission flag needed if applicable.  
**Where to confirm:** Principal / Sanstha Director.  
**Blocking:** Category field options; admission validation

---

### OQ-024: शाळा सिद्धी applicability
**Question:** Does any school unit participate in the शाळा सिद्धी (Shaala Siddhi) national school self-assessment framework? If yes, does the SMS need to support data export for Shaala Siddhi?  
**Where to confirm:** Headmaster; or check if school is registered on `shaalasiddhi.niepa.ac.in`.  
**Blocking:** Compliance module scope

---

### OQ-025: NCC / NSS / Scout-Guide tracking
**Question:** Does the school / Jr College run NCC, NSS, or Scout-Guide programmes? If yes, are student enrollment and activity records tracked in the current system, or only on paper?  
**Where to confirm:** School office / Principal.  
**Blocking:** Co-curricular module scope

---

## Resolution Tracker

| OQ # | Status | Decision | Date |
|------|--------|----------|------|
| OQ-001 | ✅ Closed | `saral_id` stored as free-text VARCHAR; no format validation | 2026-05-26 |
| OQ-002 | ✅ Closed | No AEBAS/Shalarth biometric link. Use third-party device integration (ESSL/ZKTeco ADMS) only | 2026-05-26 |
| OQ-003 | 🔴 Open | | |
| OQ-004 | 🔴 Open | | |
| OQ-005 | ✅ Closed | Std 6–7 promotion is manual (class teacher decides). No auto-promotion rules for these classes | 2026-05-26 |
| OQ-006 | 🔴 Open | | |
| OQ-007 | 🔴 Open | | |
| OQ-008 | 🔴 Open | | |
| OQ-009 | 🔴 Open | | |
| OQ-010 | 🔴 Open | | |
| OQ-011 | ✅ Closed | Devanagari numerals (०–९) on all PDFs and reports | 2026-05-26 |
| OQ-012 | 🔴 Open | | |
| OQ-013 | 🔴 Open | | |
| OQ-014 | 🔴 Open | | |
| OQ-015 | 🔴 Open | | |
| OQ-016 | ✅ Closed | Simple flat salary only. No payroll architecture. Section heading "वेतन" (Salary) | 2026-05-26 |
| OQ-017 | ✅ Closed | FYJC CAP integration not required. Direct/local admissions only | 2026-05-26 |
| OQ-018 | 🔴 Open | | |
| OQ-019 | 🔴 Open | | |
| OQ-020 | 🔴 Open | | |
| OQ-021 | 🔴 Open | | |
| OQ-022 | 🔴 Open | | |
| OQ-023 | 🔴 Open | | |
| OQ-024 | 🔴 Open | | |
| OQ-025 | 🔴 Open | | |
