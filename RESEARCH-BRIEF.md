# RESEARCH BRIEF — Marathi School Management System (Maharashtra)

> Phase 1 research output. All findings from web research, Maharashtra government portals, and official education department sources. Uncertain items are flagged ⚠️.

---

## 1. Existing Systems Maharashtra Schools Use

### 1.1 SARAL — Systematic Administrative Reforms for Achieving & Learning by Students

**Operated by:** Maharashtra School Education and Sports Department  
**Portals:** `education.maharashtra.gov.in` / `student.maharashtra.gov.in`  
**Support email:** mahastudent.assist@gmail.com

**Purpose:** Central repository for all student data in government-funded and recognised schools across Maharashtra. Schools input student data; government tracks scheme implementation and compliance.

**Student data fields captured (confirmed from offline data entry schema):**

| # | Field | Type | Values / Format |
|---|-------|------|-----------------|
| 1 | General Register No. | Character | School-assigned, locally unique |
| 2 | Stream | Character | Not Applicable / Arts / Commerce / Science / Composite / Vocational |
| 3 | Admission Academic Year | Character | YYYY-YY |
| 4 | Standard | Character | 1st Standard … 12th Standard (HSC) |
| 5 | Division | Numeric | 1–12 |
| 6–8 | Student Name | Character | First / Middle / Last |
| 9 | Date of Birth | Date | DD-MM-YYYY |
| 10 | Gender | Character | Male / Female / Transgender |
| 11–13 | Mother's Name | Character | First / Middle / Last |
| 14 | UDISE Number | Character | 11-digit school code |
| 15 | Medium | Character | Marathi / Hindi / English / Sindhi / Tamil / Telugu / Urdu / Bengali / Gujarati / Kannada |
| 16 | Semi English | Character | Yes / No / — |
| 17 | Date of Admission | Date | DD-MM-YYYY |
| 18 | Standard of Admission | Character | Class at entry |
| 19 | Admission Type | Character | Regular / RTE 25% Quota / Age Appropriate |
| 20 | UID / Aadhaar | Character | 12 digits, no spaces |

**SARAL export filename format:**  
`MINI[UDISE]-[Class]-[Division]-[Stream]-[Year].xls`  
Example: `MINI27040705346-12-01-2-2015.xls` = Std 12, Division 1, Commerce, 2015

**SARAL ID:** ⚠️ Exact digit-structure of the system-generated SARAL student ID is not publicly documented. Known: it is unique per student across Maharashtra; schools cannot assign it manually. See OPEN-QUESTIONS #1.

**SSC Board registration via SARAL:** Schools submit Std 10 board exam enrollment forms through SARAL portal (managed by principal). Private/re-exam students use a separate online portal. Forms open ~October each year, late fee period through January.

**Key integration:** SARAL feeds U-DISE+ (school uses UDISE code as foreign key). eMarksheet portal (`boardmarksheet.maharashtra.gov.in`) is separate but linked by seat/roll number.

---

### 1.2 U-DISE+ — Unified District Information System for Education Plus

**Operated by:** Ministry of Education, Government of India (UDISE+ team, NIC)  
**Portal:** `udiseplus.gov.in` / SDMS: `sdms.udiseplus.gov.in`  
**School code format:** 11-digit numeric code (state + district + block + school serial)

**Data captured per school (annual, updated by school principal):**
- School profile: name, address, management type, medium, affiliation board, year established
- Enrollment (student-level via SDMS): GP (General Profile), EP (Enrollment Profile), SF (Student Facilities/benefits)
- Teacher data: count, qualifications, training, vacancies
- Infrastructure: classrooms, toilets, library, labs, computers, drinking water, electricity
- Exam results (board results fed back)
- Scheme tracking: RTE, scholarships, mid-day meal

**Data collection schedule:** Annual; schools update in October–December each year for the previous academic year. Some states now do real-time updates via SDMS.

**Relationship to SARAL:** UDISE code is the linking key. SARAL is Maharashtra-state-only; U-DISE+ is national. Both require school-level data entry but are separate systems with some overlap.

---

### 1.3 Shalarth (शाळार्थ)

**Full name:** IFMS (Integrated Financial Management System) — Shalarth Portal for Grant-in-Aid Institutions  
**Operated by:** Directorate of Accounts and Treasuries, Government of Maharashtra  
**URL:** `shalarth.maharashtra.gov.in`

**Who must use it:**
- ZP (Zilla Parishad) schools: **mandatory**
- Municipal corporation schools: **mandatory**
- Aided (Grant-in-Aid) private schools and Jr Colleges: **mandatory**
- Unaided private schools: **NOT applicable** — they manage payroll independently

**Purpose:** Centralized payroll processing for all teaching and non-teaching staff in aided/government schools. Ensures salary reaches directly to staff bank accounts via PFMS/BEAMS linkage.

**Data fed into Shalarth:**
- Staff master: name, designation, pay scale, increment stage, unit (school/Jr College with UDISE code)
- Monthly pay bill: Basic Pay, DA, HRA, Transport Allowance, Medical Allowance, other post-specific allowances
- Deductions: NPS (10% employee contribution of Basic+DA), GPF subscription (for pre-2005 staff), Professional Tax, Group Insurance Scheme (GIS), loan recovery (festival advance, house building advance, co-operative society), TDS/Income Tax

**Salary slip (pay slip) fields on Shalarth:**
- Employee name, designation, school name, month/year
- Pay Head: Basic Pay, DA, HRA, TA, other allowances
- Deductions: NPS/GPF, PT, TDS, GIS, society deduction, loan EMIs
- Gross earnings, total deductions, net pay
- Bank account details, PAN

**GPF vs NPS:** Staff appointed before Jan 1, 2005 are on GPF (General Provident Fund); post-2005 appointees are on NPS (National Pension Scheme, 10% employee + 10% employer contribution). Both are tracked in Shalarth.

**BEEMS (Biometric Enabled Employee Management System):** ⚠️ BEEMS is referenced in Maharashtra Education Department staff-mapping drives. It is a system to verify teaching/non-teaching positions against Sanction Structure and Shalarth records. The state runs a separate AEBAS (Aadhaar-enabled Biometric Attendance System) at `attendance.maharashtra.gov.in`. The exact integration between AEBAS/BEEMS and Shalarth salary deduction logic is unclear from public sources. See OPEN-QUESTIONS #2.

**Staff mapping 2024:** Maharashtra launched a statewide staff-mapping drive where every aided-school post is verified against Shalarth records and the Sanction Structure. Schools with excess posts or ghost employees are flagged.

**For this SMS:** If the Sanstha runs aided units, the system must be able to export salary data in Shalarth-compatible format. For unaided units, payroll is internal only.

---

### 1.4 MSCE Pune — Maharashtra State Council of Examinations

**Full name:** Maharashtra State Council of Examination, Pune  
**Portal:** `puppssmsce.in`  
**Scope:** Conducts scholarship and competitive exams for school students across Maharashtra (does not conduct SSC/HSC — those are MSBSHSE)

**Scholarship exams relevant to this SMS:**

| Exam | Marathi Name | Target Class | Marathi Full Name |
|------|-------------|-------------|-------------------|
| PSE | प्राथमिक शिष्यवृत्ती परीक्षा | Std 4 | Primary Scholarship Examination |
| UPSE | उच्च प्राथमिक शिष्यवृत्ती परीक्षा | Std 7 | Upper Primary Scholarship Examination |
| NMMS | राष्ट्रीय मेधा व साधन शिष्यवृत्ती | Std 8 | National Means-cum-Merit Scholarship |
| NTS | राष्ट्रीय प्रतिभा शोध परीक्षा | Std 10 | National Talent Search |

**Registration timeline (2025-26 cycle):**
- Application released: December 30, 2025
- Last date (regular fee): March 6, 2026 (late: March 10)
- Hall ticket: March 27, 2026
- Exam date: April 26, 2026
- Results: June 2026 (expected)

**Registration flow:** Student applies online at `puppssmsce.in` → uploads documents → pays fee → school confirms enrollment → hall ticket generated. ⚠️ Whether schools bulk-submit via SARAL or students apply individually needs confirmation. See OPEN-QUESTIONS #3.

**System implication:** SMS must track: which students are registered for PSE/UPSE/NMMS/NTS, exam roll number, result (pass/scholarship amount), scholarship recipient flag.

---

### 1.5 FYJC CAP — First Year Junior College Centralized Admission Process

**Portal:** `mahafyjcadmissions.in`  
**Operated by:** School Education and Sports Department, Maharashtra

**Coverage (as of 2026-27):** Fully state-wide — all Maharashtra Jr Colleges (previously only Pune/Mumbai/Nagpur/PCMC clusters; now expanded to entire state).

**Admission process:**
1. Student registers on portal (Part 1 form): personal details, SSC seat no., marks, category, domicile
2. Student fills college preferences (Part 2 form): up to 10 Jr Colleges in priority order, with stream choice (Science/Commerce/Arts)
3. Merit list generated: best 5 SSC subjects; tie-breaking: higher marks → older age → alphabetical name
4. Three regular CAP rounds; then "Open to All" (4th round); special girls round (5th)
5. College confirms admission; student pays fees; college records CAP allotment details

**Data fields the SMS must record from CAP allotment:**
- CAP Application ID (unique ID from portal)
- Merit number (rank in category)
- Allotment round (Round 1 / 2 / 3 / Open / Girls)
- Allotted college code
- Allotted stream
- Cut-off percentile for that round/college/stream/category
- Category under which admitted (Open / SC / ST / OBC / etc.)

**Direct admissions:** Students from other states, other boards, or where CAP is not applicable still get direct admission at the Jr College level based on SSC marks + category.

---

### 1.6 Common Private ERPs — Maharashtra Landscape

| ERP | Features | Known Gaps for ZP/Aided Schools |
|-----|----------|--------------------------------|
| **Fedena** | Admissions, attendance, exams, fees, library, transport, 50+ modules | No SARAL export; no Shalarth integration; no CCE-specific Maharashtra format; English-first UI |
| **MyClassCampus** | 40 modules: admissions, fees, LMS, online exams, HR, inventory, transport | No Marathi UI; no Maharashtra-specific compliance; no FYJC CAP integration |
| **Edusparx** | Basic school management, fee collection | Very limited for aided schools; no payroll; no SARAL |
| **Camu** | Campus management, attendance, LMS | Primarily higher education focus; not school-level compliant for Maharashtra |

**Critical gaps in all generic ERPs for Maharashtra:**
1. No SARAL data format export
2. No Marathi-language UI (all English)
3. No CCE-specific progress card format (Std 1–8 Maharashtra pattern)
4. No FYJC CAP integration for Jr College admissions
5. No Shalarth-compatible payroll export (for aided schools)
6. No Maharashtra reservation category structure (VJ/NT-A/B/C/D/SBC)
7. No multi-unit Sanstha architecture (single-school model assumed)
8. No bifocal subject handling for HSC (200-mark pattern)
9. No General Register in prescribed Maharashtra format
10. No scholarship exam tracking (PSE/UPSE/NMMS/NTS)

---

### 1.7 School Type Differences in Maharashtra

| Type | Funding | Shalarth | Pay Scale | BEEO/DEO Reporting | U-DISE |
|------|---------|----------|-----------|-------------------|--------|
| ZP (Zilla Parishad) | 100% govt | Mandatory | 7th Pay Commission state scales | Reports to ZP Education Officer | Mandatory |
| Municipal (PMC/BMC etc.) | 100% municipal | Mandatory | Municipal corporation scales | Reports to Municipal Education Officer | Mandatory |
| Aided Private | Grant-in-aid (up to 100% salary grant) | Mandatory | Aligned with govt scales | Reports to DEO/BEEO | Mandatory |
| Unaided Private (recognised) | Self-financed | Not applicable | School-determined | Reports to DEO for recognition | Mandatory |
| CBSE-Marathi | Self-financed | Not applicable | School-determined | CBSE regional office | Mandatory (U-DISE) |

---

## 2. Mandatory Documents & Maharashtra Formats

### 2.1 शाळा सोडल्याचा दाखला (Transfer Certificate / Leaving Certificate)

Official fields as per Maharashtra Education Department practice (General Register-linked):

| # | Field (English) | Marathi Label |
|---|----------------|--------------|
| 1 | Book No. / GR Serial No. | पुस्तक क्रमांक / जनरल रजिस्टर क्रमांक |
| 2 | Student's full name | विद्यार्थ्याचे पूर्ण नाव |
| 3 | Father's / Guardian's name | वडिलांचे / पालकाचे नाव |
| 4 | Mother's name | आईचे नाव |
| 5 | Nationality | राष्ट्रीयत्व |
| 6 | Religion | धर्म |
| 7 | Caste | जात |
| 8 | Sub-caste | पोटजात |
| 9 | Category | प्रवर्ग |
| 10 | Mother tongue | मातृभाषा |
| 11 | Place of birth | जन्मस्थान |
| 12 | Date of birth (figures) | जन्म दिनांक (अंकात) |
| 13 | Date of birth (words) | जन्म दिनांक (अक्षरात) |
| 14 | Date of admission to this school | या शाळेत प्रवेश दिनांक |
| 15 | Standard at time of admission | प्रवेशाच्या वेळचा वर्ग |
| 16 | Standard studying in at time of leaving | सोडताना शिकत असलेला वर्ग |
| 17 | Medium of instruction | शिक्षणाचे माध्यम |
| 18 | Scholarship (if any) | शिष्यवृत्ती (असल्यास) |
| 19 | Progress (general) | प्रगती |
| 20 | Conduct | वर्तणूक |
| 21 | Date of leaving | शाळा सोडल्याची तारीख |
| 22 | Reason for leaving | शाळा सोडण्याचे कारण |
| 23 | Remarks | शेरा |
| 24 | Date of issue | दाखला दिल्याची तारीख |
| 25 | TC serial number | दाखला क्रमांक |
| 26 | Signature: Class Teacher | वर्गशिक्षकांची स्वाक्षरी |
| 27 | Signature: Headmaster + school seal | मुख्याध्यापकांची स्वाक्षरी व शाळेचा शिक्का |

⚠️ Aadhaar number is increasingly printed on TCs but inclusion rules vary by GR. See OPEN-QUESTIONS #4.

---

### 2.2 जनरल रजिस्टर (General Register)

Official columns (confirmed from SARAL offline schema and Maharashtra school practice):

| Col | Field | Notes |
|-----|-------|-------|
| A | GR Number | Sequential per school, never reused |
| B | SARAL ID | System-generated unique ID |
| C | Student full name | As per birth certificate |
| D | Father's name | |
| E | Mother's name | |
| F | Aadhaar / UID No. | 12 digits |
| G | Nationality | |
| H | Gender | Male / Female / Transgender |
| I | Religion | |
| J | Caste | |
| K | Sub-caste | |
| L | Category / Pravar | SC / ST / VJ / NT-A/B/C/D / OBC / SBC / EWS / Open |
| M | Date of birth | DD-MM-YYYY |
| N | Place of birth | |
| O | Mother tongue | |
| P | UDISE Code (school) | |
| Q | Medium | Marathi / Hindi / English / etc. |
| R | Semi-English | Yes / No |
| S | Standard at admission | |
| T | Date of admission | |
| U | Admission type | Regular / RTE 25% / Age Appropriate |
| V | Previous school name | |
| W | Current address | |
| X | Permanent address | |
| Y | Parent/Guardian mobile | |
| Z | TC / LC issued (date, serial) | |
| AA | Reason for leaving | |
| AB | Remarks | |

---

### 2.3 प्रगती पत्रक (Progress Card)

**Std 1–4 (CCE, no detention, no exams):**
- Continuous assessment, oral + written activities, projects
- Grade bands: A+ (Outstanding) / A (Excellent) / B+ (Very Good) / B (Good) / C (Satisfactory) / D (Needs Improvement)
- No numeric marks; grade descriptors in Marathi
- No detention; all students auto-promoted (RTE Std 1–4 policy unchanged)

**Std 5 and Std 8 (NEW — as of Jan 2025 GR):**
- Annual exam now mandatory (not board exam)
- Pass/fail criteria apply
- Failure → re-exam within 2 months → fail again → detained (repeat year)
- ⚠️ Exact passing marks % to confirm with school. See OPEN-QUESTIONS #5.

**Std 6 and Std 7:** ⚠️ Policy unclear — likely still CCE/no detention per RTE for Std 6-7. Confirm with OPEN-QUESTIONS #5.

**Std 9–10 (marks-based):**
- Unit tests (घटक चाचणी): periodic throughout year
- Half-yearly (सहामाही): October/November
- Annual/Board: February–March
- Passing: 35% per subject and 35% aggregate
- Progress card shows subject-wise marks, total, percentage, grade, rank in class, teacher remarks, attendance

**Std 10 (SSC Board):**
- Held February–March
- Results April–May
- Board marks appear on separate marksheet; school keeps copy in GR

---

### 2.4 वर्तणूक दाखला / Bonafide Certificate

Standard fields:
- School name, address, logo, seal
- Certificate serial number
- Student name, class, division, roll number
- Academic year
- Date of birth
- Parent/Guardian name
- Purpose for which issued (scholarship / bank / passport / etc.)
- Date of issue
- Headmaster/Principal signature and seal

Note: In Maharashtra school practice, "वर्तणूक दाखला" (conduct/character certificate) and "अध्ययन प्रमाणपत्र" (bonafide study certificate) are sometimes distinct. Bonafide confirms current enrollment; character certificate addresses conduct. ⚠️ Confirm with school which format they use. See OPEN-QUESTIONS #6.

---

### 2.5 शुल्क पावती (Fee Receipt)

Fields:
- School name, address, logo
- Receipt number (sequential per unit per year)
- Academic year, financial year
- Student name, GR number, class, division
- Date of payment
- Fee head(s): Tuition Fee, Admission Fee, Exam Fee, Lab Fee, Library Fee, Sports Fee, etc. — itemised
- Mode of payment: Cash / Cheque / Online
- Cheque number / UTR if applicable
- Amount in figures and words
- Cashier signature

---

### 2.6 Jr College Documents

#### ज्युनियर कॉलेज शाळा सोडल्याचा दाखला (Jr College TC)
Separate format from school TC. Additional fields:
- FYJC CAP allotment number (if applicable)
- Stream (कला / विज्ञान / वाणिज्य)
- Subjects studied
- Std 11 / Std 12 year of study
- HSC seat number (if registered)
- Reason for leaving (TC for Std 11 student who did not reach Std 12; or mid-Std 12 leaving)
- Divisional board affiliation

#### स्थलांतर प्रमाणपत्र (Migration Certificate)
- Issued by: MSBSHSE divisional board (not the college)
- Portal: `verification.mh-hsc.ac.in`
- When: after HSC (Std 12) pass, when student moves to another state/board for higher education
- Fee: ₹375
- Processing: 7–15 working days
- Required fields on application: HSC seat number, Jr College code (from marksheet)
- SMS implication: track migration certificate application status per alumni student

#### पात्रता प्रमाणपत्र (Eligibility Certificate)
- Required for: students who passed Std 10 from CBSE / ICSE / other state boards joining Maharashtra Jr College
- Issued by: MSBSHSE on application
- SMS implication: flag students from other boards; track eligibility certificate status before finalising admission

#### प्रात्यक्षिक परीक्षा गुण पत्रक (Practical Exam Marks Sheet)
- Per subject with practicals (Physics, Chemistry, Biology, Computer Science, Electronics, etc.)
- Internal assessor (college teacher) + External assessor (board-appointed)
- Fields: student name, seat number, subject, marks awarded (external practical), date, assessor signatures

#### HSC Board Registration
- Schools submit Std 12 board registration through MSBSHSE portal
- Data required: student's full name (as on Aadhaar), DOB, photo, previous board seat number, subject combination chosen
- Bifocal subject registration requires separate form

---

## 3. Curriculum & Assessment Structure

### 3.1 Class Structure — School (Std 1–10)

| Level | Classes | Marathi Name |
|-------|---------|-------------|
| Pre-primary | Nursery / LKG / UKG | पूर्व-प्राथमिक |
| Primary | Std 1–4 | प्राथमिक |
| Upper Primary | Std 5–8 | उच्च प्राथमिक |
| Secondary | Std 9–10 | माध्यमिक |

**Exam pattern:**
- Std 1–4: Continuous assessment only; no exams; no detention
- Std 5: Annual exam (new policy 2025); pass/fail
- Std 6–7: ⚠️ Likely CCE — confirm
- Std 8: Annual exam (new policy 2025); pass/fail
- Std 9: Unit tests + half-yearly + annual; pass/fail (35%)
- Std 10: SSC Board (MSBSHSE); external board exam February–March

**Common exam schedule (2024-25 verified):**
- Unit tests / PAT (Periodic Assessment Tests): throughout year
- Half-yearly (सहामाही): October–November
- Annual (वार्षिक): April 8–25
- Results: by May 1
- SSC board: February 21 – March 17

**Scholarship exam tracking:**
- PSE (Std 4): April; results June
- UPSE (Std 7): April; results June
- NMMS (Std 8): National level
- NTS (Std 10): National level

**शाळा सिद्धी:** Government school self-assessment framework; applicable primarily to government/aided schools. ⚠️ Confirm applicability with school.

---

### 3.2 Junior College — HSC (Std 11–12)

**Board:** MSBSHSE (Maharashtra State Board of Secondary and Higher Secondary Education)  
**Divisional boards:** Pune / Mumbai / Nagpur / Aurangabad / Kolhapur / Amravati / Nashik / Latur / Konkan

#### विज्ञान शाखा (Science Stream)

| Subject Group | Subjects | Theory Marks | Practical Marks | Total |
|-------------|---------|-------------|----------------|-------|
| Core (all) | English | 80 | 20 (internal) | 100 |
| Core (all) | Second language (Marathi/Hindi) | 80 | 20 (internal) | 100 |
| PCM | Physics | 70 | 30 (practical) | 100 |
| PCM | Chemistry | 70 | 30 (practical) | 100 |
| PCM | Mathematics | 80 | 20 (internal) | 100 |
| PCB | Physics | 70 | 30 (practical) | 100 |
| PCB | Chemistry | 70 | 30 (practical) | 100 |
| PCB | Biology | 70 | 30 (practical) | 100 |
| PCMB | Physics + Chemistry + Maths + Biology | As above | As above | 100 each |
| Compulsory | Environmental Education | 50 | — | 50 |
| Compulsory | Physical Education | 50 | — | 50 |

**Bifocal (द्विशाखीय) subjects — 200 marks total:**

| Bifocal Subject | Theory | Practical | Total |
|----------------|--------|-----------|-------|
| Computer Science | Paper I (50) + Paper II (50) = 100 | Practical I (50) + Practical II (50) = 100 | 200 |
| Electronics | Paper I (50) + Paper II (50) = 100 | Practical I (50) + Practical II (50) = 100 | 200 |
| Information Technology (IT) | 50 theory | 50 practical | ⚠️ 100 or 200? Confirm |

Note: Bifocal subjects replace one regular subject in the stream. Student with bifocal has one extra 100-mark practical component on top of regular subjects.

#### वाणिज्य शाखा (Commerce Stream)

| Subject | Theory | Internal | Total |
|---------|--------|----------|-------|
| English | 80 | 20 | 100 |
| Second Language | 80 | 20 | 100 |
| Book-Keeping & Accountancy (BK) | 80 | 20 | 100 |
| Organisation of Commerce & Management (OCM) | 80 | 20 | 100 |
| Economics | 80 | 20 | 100 |
| Secretarial Practice (SP) | 80 | 20 | 100 |
| Mathematics & Statistics (optional) | 80 | 20 | 100 |
| Information Technology (optional bifocal) | ⚠️ | ⚠️ | ⚠️ |
| Environmental Education | 50 | — | 50 |
| Physical Education | 50 | — | 50 |

**Internal 20 marks breakdown:** 5 (practical skills) + 5 (oral) + 10 (activities/experiments)

#### कला शाखा (Arts Stream)

Students choose 6 subjects from the following pool (Maharashtra Board determines permitted combinations):

Available subjects: History (इतिहास), Geography (भूगोल), Political Science (राज्यशास्त्र), Sociology (समाजशास्त्र), Psychology (मानसशास्त्र), Economics (अर्थशास्त्र), Logic (तर्कशास्त्र), Hindi (द्वितीय भाषा), Marathi Literature, English Literature, Urdu, Persian, Sanskrit, Music, Drawing, etc.

⚠️ Exact permitted subject combinations for Arts stream need confirmation from the school's divisional board. See OPEN-QUESTIONS #7.

**Passing criteria (all streams):** ≥35% per subject AND ≥35% aggregate  
**Std 12 board exam:** February–March  
**Std 11 internal annual exam:** March–April (school-conducted)

---

### 3.3 FYJC Admission Flow

**CAP path (now state-wide from 2026-27):**
- Student applies on `mahafyjcadmissions.in`
- Part 1: registration + SSC details
- Part 2: college preferences (up to 10) + stream choice
- Merit = best 5 SSC subjects
- Allotment letter contains: CAP ID, merit rank, round, allotted college+stream+category
- Student reports to college, submits: allotment letter, SSC marksheet, caste certificate (if reserved), domicile certificate, photo, Aadhaar

**Stream/subject change:** ⚠️ Typically allowed within first 30 days of admission. School must process and update board records. Confirm with school.

**जात वैधता प्रमाणपत्र (Caste Validity Certificate):** Mandatory for SC/ST/VJ/NT/OBC/SBC quota admissions. Issued by Scrutiny Committee. Students can join provisionally while certificate is pending but must submit it to finalise reserved-seat admission.

---

## 4. Multi-Unit Sanstha Architecture

### 4.1 Legal Structure

- Registered under **Maharashtra Public Trusts Act, 1950** (also known as Bombay Public Trusts Act, 1950)
- Supervised by **Charity Commissioner, Maharashtra** (`charity.maharashtra.gov.in`)
- Registration: PTR (Public Trust Registration) number + Society Registration Act number (if registered as society too)
- 80G / 12A registration for income tax exemption on donations
- Each school/Jr College under the Sanstha is a **separate educational unit** with its own U-DISE code
- All units operate under **one PAN** of the trust (unless separately registered — uncommon)

### 4.2 Operational Model

**Shared at Sanstha level (common to all units):**
- Trust board governance (President, Secretary, Treasurer, Executive Committee)
- Consolidated accounting and audit
- HR policy and payroll (especially for aided units via Shalarth)
- Master data: document templates, grading scales, fee-structure templates
- Cross-unit MIS and reporting

**Isolated per unit (unit-scoped):**
- Student records (each unit has its own GR register)
- Teacher allocation and timetable
- Exam data and marks
- Daily attendance
- Fee collection
- U-DISE compliance data

### 4.3 Cross-Unit Scenarios

- **Student progression:** Sanstha school Std 10 → same Sanstha Jr College Std 11 (most common progression)
- **Staff transfer:** Teacher can be transferred within Sanstha; records move between units; payroll updates to new unit
- **Shared staff:** A प्राध्यापक teaching at two Jr Colleges of same Sanstha — must have dual-unit allocation, attendance split
- **Parent with children in multiple units:** One parent login → unified view of all children across units

### 4.4 Examples of Large Maharashtra Sansthas (reference models)

- **Deccan Education Society (DES):** Pune-based; runs Fergusson College, BMCC, multiple schools; single trust, separate AISHE/U-DISE per institution
- **Maharashtra Education Society (MES):** Pune; runs schools + Jr Colleges + degree colleges; central admin + decentralised unit ops
- **Rayat Shikshan Sanstha:** Satara; hundreds of units across Maharashtra; rural school network
- **PVG's Pratishthan:** Pune; school + Jr College + engineering college under one trust

---

## 5. Biometric Attendance

### 5.1 Devices Common in Maharashtra Schools

| Brand | Models | Common Usage | Protocol |
|-------|--------|-------------|----------|
| ESSL (ZKTeco group) | X990, K90, F22, iClock | Most common; staff rooms and gates | ADMS/WDMS, ZKTeco SDK |
| Mantra | MFS100 (fingerprint), MFSTAB (tablet) | Budget-friendly; government projects | Mantra MFS SDK |
| Realtime | T52, T501 | Mid-range; Maharashtra govt offices | Push protocol |
| Matrix COSEC | Various | Mid to high-end; secure campuses | Matrix API |
| Anviz | C2-Pro, CrossChex | Face recognition units | Anviz SDK |

**Most common school deployment:** ESSL X990 (fingerprint) for staff room; face recognition at gate (post-2020)

### 5.2 Government Biometric System

**AEBAS:** Aadhaar-enabled Biometric Attendance System, Government of Maharashtra (`attendance.maharashtra.gov.in`). Primarily for state government employees. **Aided school staff may be required to use AEBAS** for Shalarth attendance integration. ⚠️ Confirm whether aided school teachers in scope use AEBAS or separate device. See OPEN-QUESTIONS #2.

### 5.3 Integration Architecture

```
Device (fingerprint / face) 
  → Local device buffer (stores punches if offline)
  → ADMS push (HTTP POST to server URL configured on device)
  → School PC middleware (or direct cloud push)
  → SMS backend (biometric_event log table)
  → Processed into daily attendance records
```

**ADMS protocol:** ZKTeco ADMS is HTTP-based push; device is configured with server IP/domain + port; device sends attendance logs every N minutes. Works through NAT/firewall. ~90% of ZKTeco/ESSL devices support ADMS.

**Offline resilience:** Device stores punches locally (ESSL X990: up to 100,000 templates, 3 million logs). When connectivity restores, all buffered punches are pushed.

### 5.4 Use Cases

| Use Case | Mode | Notes |
|----------|------|-------|
| Staff in/out (शिक्षक, शिपाई) | Fingerprint | Late mark if after cutoff time; half-day if only in or only out |
| Student gate entry/exit | Face recognition | Anti-passback (one entry, one exit per cycle); mass scan at bell time |
| Library entry | RFID/card or fingerprint | Per-session log |
| Lab entry | Fingerprint or RFID | Per-session log |

### 5.5 DPDP Act 2023 Compliance for Biometrics

- Biometric data (fingerprint templates, facial geometry) = **sensitive personal data** under DPDP Act 2023
- **Parental consent mandatory** before enrolling any minor (under 18) in biometric system
- Templates must be **stored encrypted on-device and in any cloud backup**; raw templates must never be exportable
- **Right to erasure:** On student leaving/TC issued, biometric template must be deleted from all systems within reasonable time
- Audit log of who accessed biometric matching results
- **SMS stores only:** matched/unmatched event records (timestamp, device ID, person ID, match result) — never raw templates

---

## 6. Simple Payroll Model

### 6.1 Scope (as defined in brief)

- Staff master with flat monthly salary amount
- Monthly payroll run: days present (from biometric or manual), LOP calculation
- Manual additions/deductions (advance recovery, bonus, arrears)
- Payment record with mode and reference
- Marathi salary slip (PDF)
- Reports: per-unit monthly register, Sanstha-consolidated, annual summary per staff

### 6.2 No statutory engine in Phase 1

Not in scope for this SMS:
- EPF/ESIC ECR
- PT challan
- Form 24Q / Form 16 / TDS returns
- Shalarth export (Phase 2+ for aided units)
- 7th Pay Commission calculation engine

### 6.3 Leave Types to Track

| Type | Marathi | Paid/LOP |
|------|---------|----------|
| Casual Leave (CL) | किरकोळ रजा | Paid (no LOP) |
| Sick Leave (SL) | वैद्यकीय रजा | Paid (no LOP) |
| Earned Leave (EL) | अर्जित रजा | Paid (no LOP) |
| Maternity Leave (ML) | प्रसूती रजा | Paid (statutory 26 weeks) |
| Leave Without Pay (LOP) | वेतनाशिवाय रजा | LOP — deducts from salary |
| Duty Leave | कर्तव्य रजा | Paid |

---

## 7. Year Management

### 7.1 Academic Year (शैक्षणिक वर्ष)

- Start: ~June 15 (schools reopen; exact date per school calendar)
- Annual exams: April 8–25 (Std 1–9 confirmed for 2024-25)
- Results: May 1 target
- Effective end: April 30
- SSC/HSC board years: held open until board results (May–June); then promote-out

### 7.2 Financial Year (आर्थिक वर्ष)

- April 1 – March 31 (India standard)
- FY and AY overlap but do not align:
  - April 1–June 14: FY open, AY in close/transition
  - June 15–March 31: both FY and AY open simultaneously

### 7.3 Promotion Rules (confirmed from Maharashtra policy)

| Class | Promotion Logic |
|-------|----------------|
| Std 1–4 | Auto-promote (no exams, no detention — RTE) |
| Std 5 | Pass/fail annual exam; fail → retest → fail → detain |
| Std 6–7 | ⚠️ Likely auto-promote (CCE); confirm |
| Std 8 | Pass/fail annual exam (new 2025); fail → retest → detain |
| Std 9 | Pass/fail (35%); fail → detain |
| Std 10 | Hold until SSC board result; pass → Std 11 (or alumni); fail → detain |
| Std 11 | Pass/fail school annual exam (35%); fail → detain in Std 11 |
| Std 12 | Hold until HSC board result; pass → alumni; fail → detain |

---

## 8. Maharashtra Reservation Categories

| Category | Marathi Name | Abbrev. | Reservation % |
|----------|-------------|---------|--------------|
| Open / General | खुला | Open | — |
| Scheduled Castes | अनुसूचित जाती | SC | 13% |
| Scheduled Tribes | अनुसूचित जमाती | ST | 7% |
| Vimukta Jati / De-notified Tribes | विमुक्त जाती (NT-A) | VJ/DT-A | 3% |
| Nomadic Tribes-B | भटक्या जमाती - ब | NT-B | 2.5% |
| Nomadic Tribes-C (Dhangar) | भटक्या जमाती - क (धनगर) | NT-C | 3.5% |
| Nomadic Tribes-D (Vanjari) | भटक्या जमाती - ड (वंजारी) | NT-D | 2% |
| Other Backward Classes | इतर मागासवर्ग | OBC | 19% |
| Special Backward Classes | विशेष मागास प्रवर्ग | SBC | 2% |
| SEBC (Maratha) | सामाजिक व शैक्षणिकदृष्ट्या मागासवर्ग | SEBC | ⚠️ 10% (stayed by SC) |
| Economically Weaker Section | आर्थिकदृष्ट्या दुर्बल घटक | EWS | 10% |

**Additional flags per student record:**
- RTE 25% quota admission: Yes / No
- BPL card holder: Yes / No (Below Poverty Line)
- APL: Above Poverty Line (for scholarship exclusion)
- Divyang (differently abled): Yes / No; if Yes: disability type + % disability
- Single girl child: Yes / No (for scholarship eligibility)
- Ex-serviceman ward: Yes / No
- Orphan: Yes / No

---

## 9. eMarksheet & DigiLocker

- MSBSHSE issues digital marksheets via `boardmarksheet.maharashtra.gov.in`
- From 2026: marksheet and certificate **merged into one document** with student photo + QR code
- Student name on marksheet now follows Aadhaar format (First Middle Last instead of Surname First)
- QR code enables instant authenticity verification via MSBSHSE mobile app
- DigiLocker integration: students can fetch HSC/SSC marksheets directly

---

## Sources

- [Maharashtra SARAL Portal](https://education.maharashtra.gov.in/about_saral.php)
- [SARAL Student DB](https://student.maharashtra.gov.in/stud_db)
- [SARAL Offline Entry Help](http://saralhelp.blogspot.com/2015/09/saral-students-offline-data-entry-tricks.html)
- [UDISE+ Portal](https://udiseplus.gov.in/)
- [Shalarth Portal](https://shalarth.maharashtra.gov.in)
- [Shalarth Pay Slip Guide](https://www.egovtschemes.com/shalarth-pay-slip/)
- [MSCE Pune Scholarship](https://sabscholarship.com/msce-pune-scholarship-for-class-4th-7th/)
- [FYJC Admissions Portal](https://mahafyjcadmissions.in/)
- [FYJC 2026-27 Process](https://targetpublications.org/blog/maharashtra-fyjc-admission-process-for-2026-27)
- [MSBSHSE HSC Board](https://www.mahahsscboard.in/en)
- [HSC Subject Codes](https://sschscaurangabad.in/hsc-subject-code/)
- [HSC Bifocal Computer Science](https://techniyojan.com/2020/11/12th-hsc-computer-science-paper-pattern-maharashtra-board.html)
- [HSC Electronics Pattern](https://techniyojan.com/2020/10/hsc-electronics-paper-pattern-class-11th-12th.html)
- [Maharashtra No-Detention Policy Change](https://targetpublications.org/blog/maharashtra-government-reintroduces-annual-exams-for-standard-5-and-8)
- [Maharashtra Common Exam Timetable 2025](https://targetpublications.org/blog/maharashtra-implements-common-exam-timetable-for-classes-1-to-9-for-the-year-2025)
- [Maharashtra Reservation Categories](https://www.collegedekho.com/articles/reservation-quota-in-maharashtra/)
- [Migration Certificate](https://school.careers360.com/boards/msbshse/maharashtra-board-migration-certificate-2025)
- [AEBAS Maharashtra](https://attendance.maharashtra.gov.in/)
- [ESSL Biometric Integration](https://camsbiometrics.com)
- [eMarksheet Portal](https://boardmarksheet.maharashtra.gov.in/)
- [SSC Registration via SARAL](https://www.thebridgechronicle.com/news/ssc-exam-online-application-process-via-saral-begins-october-7)
- [Bombay Public Trusts Act](https://prsindia.org/files/bills_acts/acts_states/maharashtra/1950/1950Maharashtra29.pdf)
