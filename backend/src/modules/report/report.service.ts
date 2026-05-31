import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReportTemplate } from './report-template.entity';

@Injectable()
export class ReportService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(ReportTemplate)
    private readonly templateRepo: Repository<ReportTemplate>,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // Existing summary reports
  // ═══════════════════════════════════════════════════════════════

  async sansthaSummary(sansthaId: string) {
    const units = await this.ds.query(
      `SELECT id, name_mr as "nameMr" FROM unit WHERE sanstha_id = $1 AND is_active = true`,
      [sansthaId],
    );
    const studentCounts = await this.ds.query(
      `SELECT unit_id as "unitId", gender, COUNT(*) as cnt
       FROM student WHERE sanstha_id = $1 AND status = 'active'
       GROUP BY unit_id, gender`,
      [sansthaId],
    );
    const staffCounts = await this.ds.query(
      `SELECT unit_id as "unitId", COUNT(*) as cnt
       FROM staff WHERE sanstha_id = $1 AND is_active = true
       GROUP BY unit_id`,
      [sansthaId],
    );
    const catCounts = await this.ds.query(
      `SELECT COALESCE(category, 'अनिर्दिष्ट') as category, COUNT(*) as cnt
       FROM student WHERE sanstha_id = $1 AND status = 'active'
       GROUP BY category`,
      [sansthaId],
    );

    let totalStudents = 0, male = 0, female = 0, totalStaff = 0;
    const unitStudentMap: Record<string, number> = {};
    const unitStaffMap: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const r of studentCounts) {
      const n = parseInt(r.cnt);
      totalStudents += n;
      if (r.gender === 'male') male += n;
      if (r.gender === 'female') female += n;
      unitStudentMap[r.unitId] = (unitStudentMap[r.unitId] || 0) + n;
    }
    for (const r of staffCounts) {
      const n = parseInt(r.cnt);
      totalStaff += n;
      unitStaffMap[r.unitId] = n;
    }
    for (const r of catCounts) {
      byCategory[r.category] = parseInt(r.cnt);
    }

    return {
      totalUnits: units.length,
      totalStudents, maleStudents: male, femaleStudents: female, totalStaff,
      byUnit: units.map((u: any) => ({
        unitId: u.id, nameMr: u.nameMr,
        students: unitStudentMap[u.id] || 0,
        staff: unitStaffMap[u.id] || 0,
      })),
      byCategory,
    };
  }

  async unitSummary(unitId: string, academicYearId?: string) {
    const params: any[] = [unitId];
    let ayFilter = '';
    if (academicYearId) { params.push(academicYearId); ayFilter = ` AND academic_year_id = $${params.length}`; }

    const [[{ total_students, male, female }], staffRows] = await Promise.all([
      this.ds.query(
        `SELECT COUNT(*) as total_students,
                SUM(CASE WHEN gender='male' THEN 1 ELSE 0 END) as male,
                SUM(CASE WHEN gender='female' THEN 1 ELSE 0 END) as female
         FROM student WHERE unit_id = $1 AND status = 'active'${ayFilter}`,
        params,
      ),
      this.ds.query(
        `SELECT employee_type, COUNT(*) as cnt FROM staff WHERE unit_id = $1 AND is_active = true GROUP BY employee_type`,
        [unitId],
      ),
    ]);
    const staffByType: Record<string, number> = {};
    let totalStaff = 0;
    for (const r of staffRows) { staffByType[r.employee_type] = parseInt(r.cnt); totalStaff += parseInt(r.cnt); }
    return {
      totalStudents: parseInt(total_students) || 0,
      maleStudents: parseInt(male) || 0,
      femaleStudents: parseInt(female) || 0,
      totalStaff, staffByType,
    };
  }

  async attendanceReport(unitId: string, startDate: string, endDate: string) {
    const rows = await this.ds.query(
      `SELECT status, COUNT(*) as cnt, student_id as "studentId"
       FROM student_attendance
       WHERE unit_id = $1 AND date BETWEEN $2 AND $3
       GROUP BY status, student_id`,
      [unitId, startDate, endDate],
    );
    let total = 0, present = 0, absent = 0, halfDay = 0, leave = 0, holiday = 0;
    const byStudent: Record<string, any> = {};
    for (const r of rows) {
      const n = parseInt(r.cnt);
      total += n;
      if (r.status === 'present') present += n;
      if (r.status === 'absent') absent += n;
      if (r.status === 'half_day') halfDay += n;
      if (r.status === 'late') leave += n;
      if (r.status === 'holiday') holiday += n;
      if (!byStudent[r.studentId]) byStudent[r.studentId] = { present: 0, absent: 0, total: 0 };
      byStudent[r.studentId].total += n;
      if (r.status === 'present') byStudent[r.studentId].present += n;
      if (r.status === 'absent') byStudent[r.studentId].absent += n;
    }
    return { total, present, absent, halfDay, leave, holiday, percentage: total ? Math.round(present / total * 100) : 0, byStudent };
  }

  async feeCollection(sansthaId: string, unitId?: string, academicYearId?: string) {
    const params: any[] = [sansthaId];
    let filters = 'WHERE sanstha_id = $1 AND is_cancelled = false';
    if (unitId) { params.push(unitId); filters += ` AND unit_id = $${params.length}`; }
    if (academicYearId) { params.push(academicYearId); filters += ` AND academic_year_id = $${params.length}`; }

    const [[totals], modeRows, unitRows] = await Promise.all([
      this.ds.query(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as cnt FROM fee_payment ${filters}`, params),
      this.ds.query(`SELECT "paymentMode" as payment_mode, COALESCE(SUM(amount),0) as amt FROM fee_payment ${filters} GROUP BY "paymentMode"`, params),
      this.ds.query(`SELECT unit_id, COALESCE(SUM(amount),0) as amt FROM fee_payment ${filters} GROUP BY unit_id`, params),
    ]);
    const byMode: Record<string, number> = {};
    const byUnit: Record<string, number> = {};
    for (const r of modeRows) byMode[r.payment_mode] = parseFloat(r.amt);
    for (const r of unitRows) byUnit[r.unit_id] = parseFloat(r.amt);
    return { totalCollected: parseFloat(totals.total), count: parseInt(totals.cnt), byMode, byUnit };
  }

  async salaryReport(sansthaId: string, month?: string, year?: string) {
    const params: any[] = [sansthaId];
    let filters = 'WHERE sanstha_id = $1';
    if (month) { params.push(month); filters += ` AND month = $${params.length}`; }
    if (year) { params.push(year); filters += ` AND year = $${params.length}`; }

    const [[totals], statusRows] = await Promise.all([
      this.ds.query(
        `SELECT COUNT(*) as cnt, COALESCE(SUM(gross_salary),0) as gross, COALESCE(SUM(total_deduction),0) as deductions, COALESCE(SUM(net_salary),0) as net FROM salary_slip ${filters}`,
        params,
      ),
      this.ds.query(`SELECT status, COUNT(*) as cnt FROM salary_slip ${filters} GROUP BY status`, params),
    ]);
    const paid = statusRows.find((r: any) => r.status === 'paid')?.cnt || 0;
    const pending = statusRows.filter((r: any) => r.status !== 'paid' && r.status !== 'cancelled').reduce((s: number, r: any) => s + parseInt(r.cnt), 0);
    return {
      count: parseInt(totals.cnt), totalGross: parseFloat(totals.gross),
      totalDeductions: parseFloat(totals.deductions), totalNet: parseFloat(totals.net),
      paid: parseInt(paid), pending,
    };
  }

  async certReport(sansthaId: string, unitId?: string) {
    const params: any[] = [sansthaId];
    let filters = 'WHERE sanstha_id = $1';
    if (unitId) { params.push(unitId); filters += ` AND unit_id = $${params.length}`; }

    const [totals, typeRows] = await Promise.all([
      this.ds.query(`SELECT COUNT(*) as total, SUM(CASE WHEN status='issued' THEN 1 ELSE 0 END) as issued, SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled FROM certificate ${filters}`, params),
      this.ds.query(`SELECT "certificateType" as certificate_type, COUNT(*) as cnt FROM certificate ${filters} GROUP BY "certificateType"`, params),
    ]);
    const byType: Record<string, number> = {};
    for (const r of typeRows) byType[r.certificate_type] = parseInt(r.cnt);
    return { total: parseInt(totals[0].total), issued: parseInt(totals[0].issued), cancelled: parseInt(totals[0].cancelled), byType };
  }

  // ═══════════════════════════════════════════════════════════════
  // Raw data queries — for data tables + report builder
  // ═══════════════════════════════════════════════════════════════

  async fetchStudents(sansthaId: string, filters: Record<string, any>) {
    const params: any[] = [sansthaId];
    let where = `s.sanstha_id = $1::text AND s.status = 'active'`;

    if (filters.unitId)         { params.push(filters.unitId);         where += ` AND s.unit_id = $${params.length}`; }
    if (filters.academicYearId) { params.push(filters.academicYearId); where += ` AND s.academic_year_id = $${params.length}`; }
    if (filters.gradeId)        { params.push(filters.gradeId);        where += ` AND s.grade_config_id = $${params.length}`; }
    if (filters.divisionId)     { params.push(filters.divisionId);     where += ` AND s.division_id = $${params.length}`; }
    if (filters.gender)         { params.push(filters.gender);         where += ` AND s.gender = $${params.length}`; }
    if (filters.category)       { params.push(filters.category);       where += ` AND s.category = $${params.length}`; }

    return this.ds.query(
      `SELECT
        s.name_mr          AS student_name,
        s.father_name_mr,
        s.mother_name_mr,
        s.gr_number        AS gr_no,
        s.roll_number      AS roll_no,
        s.gender,
        s.date_of_birth,
        s.category,
        s.phone,
        s.address_mr,
        gc.grade_label_mr,
        gc.grade_number,
        d.name_mr          AS division_name,
        u.name_mr          AS unit_name,
        s.admission_date,
        s.status
       FROM student s
       LEFT JOIN grade_config gc ON s.grade_config_id = gc.id::text
       LEFT JOIN division d      ON s.division_id = d.id::text
       LEFT JOIN unit u          ON s.unit_id = u.id::text
       WHERE ${where}
       ORDER BY gc.grade_number NULLS LAST, s.roll_number NULLS LAST, s.name_mr`,
      params,
    );
  }

  async fetchFeeDemands(sansthaId: string, filters: Record<string, any>) {
    const params: any[] = [sansthaId];
    let where = `fd.sanstha_id = $1`;

    if (filters.unitId)         { params.push(filters.unitId);         where += ` AND fd.unit_id = $${params.length}`; }
    if (filters.academicYearId) { params.push(filters.academicYearId); where += ` AND fd.academic_year_id = $${params.length}`; }
    if (filters.gradeId)        { params.push(filters.gradeId);        where += ` AND s.grade_config_id = $${params.length}`; }
    if (filters.divisionId)     { params.push(filters.divisionId);     where += ` AND s.division_id = $${params.length}`; }
    // fd has no status column; filter on computed outstanding instead
    if (filters.status === 'paid')    { where += ` AND (fd.net_amount - fd.paid_amount) <= 0`; }
    else if (filters.status === 'partial') { where += ` AND fd.paid_amount > 0 AND (fd.net_amount - fd.paid_amount) > 0`; }
    else if (filters.status === 'pending') { where += ` AND fd.paid_amount = 0`; }

    return this.ds.query(
      `SELECT
        s.name_mr          AS student_name,
        s.gr_number        AS gr_no,
        s.roll_number      AS roll_no,
        gc.grade_label_mr,
        d.name_mr          AS division_name,
        u.name_mr          AS unit_name,
        fs.name_mr         AS fee_name,
        fs.fee_type,
        fd.installment_label,
        fd.net_amount,
        fd.paid_amount,
        (fd.net_amount - fd.paid_amount) AS outstanding,
        fd.due_date,
        CASE WHEN (fd.net_amount - fd.paid_amount) <= 0 THEN 'paid'
             WHEN fd.paid_amount > 0 THEN 'partial'
             ELSE 'pending' END AS status
       FROM fee_demand fd
       JOIN student s           ON fd.student_id = s.id::text
       LEFT JOIN grade_config gc ON s.grade_config_id = gc.id::text
       LEFT JOIN division d      ON s.division_id = d.id::text
       LEFT JOIN fee_structure fs ON fd.fee_structure_id = fs.id::text
       LEFT JOIN unit u          ON fd.unit_id = u.id::text
       WHERE ${where}
       ORDER BY gc.grade_number NULLS LAST, s.roll_number NULLS LAST, s.name_mr`,
      params,
    );
  }

  async fetchFeePayments(sansthaId: string, filters: Record<string, any>) {
    const params: any[] = [sansthaId];
    let where = `fp.sanstha_id = $1 AND fp.is_cancelled = false`;

    if (filters.unitId)         { params.push(filters.unitId);         where += ` AND fp.unit_id = $${params.length}`; }
    if (filters.academicYearId) { params.push(filters.academicYearId); where += ` AND fp.academic_year_id = $${params.length}`; }
    if (filters.dateFrom)       { params.push(filters.dateFrom);       where += ` AND fp.payment_date >= $${params.length}`; }
    if (filters.dateTo)         { params.push(filters.dateTo);         where += ` AND fp.payment_date <= $${params.length}`; }
    if (filters.paymentMode)    { params.push(filters.paymentMode);    where += ` AND fp."paymentMode" = $${params.length}`; }
    if (filters.gradeId)        { params.push(filters.gradeId);        where += ` AND s.grade_config_id = $${params.length}`; }

    return this.ds.query(
      `SELECT
        fp.receipt_number,
        s.name_mr          AS student_name,
        s.gr_number        AS gr_no,
        gc.grade_label_mr,
        d.name_mr          AS division_name,
        u.name_mr          AS unit_name,
        fp.payment_date,
        fp.amount,
        fp."paymentMode" AS payment_mode,
        fp.cheque_number,
        fp.utr_number,
        fp.bank_name_mr,
        fp.remarks
       FROM fee_payment fp
       JOIN student s           ON fp.student_id = s.id::text
       LEFT JOIN grade_config gc ON s.grade_config_id = gc.id::text
       LEFT JOIN division d      ON s.division_id = d.id::text
       LEFT JOIN unit u          ON fp.unit_id = u.id::text
       WHERE ${where}
       ORDER BY fp.payment_date DESC, fp.receipt_number`,
      params,
    );
  }

  async fetchStaff(sansthaId: string, filters: Record<string, any>) {
    const params: any[] = [sansthaId];
    let where = `st.sanstha_id = $1 AND st.is_active = true`;

    if (filters.unitId)       { params.push(filters.unitId);       where += ` AND st.unit_id = $${params.length}`; }
    if (filters.employeeType) { params.push(filters.employeeType); where += ` AND st.employee_type = $${params.length}`; }

    return this.ds.query(
      `SELECT
        st.name_mr,
        st.designation_mr,
        st.qualification_mr,
        st.subject_mr,
        st.employee_type,
        st.phone,
        st.email,
        st.joining_date,
        u.name_mr AS unit_name
       FROM staff st
       LEFT JOIN unit u ON st.unit_id = u.id::text
       WHERE ${where}
       ORDER BY st.name_mr`,
      params,
    );
  }

  async fetchExamMarks(sansthaId: string, filters: Record<string, any>) {
    const params: any[] = [sansthaId];
    let where = `e.sanstha_id = $1`;

    if (filters.unitId)         { params.push(filters.unitId);         where += ` AND e.unit_id = $${params.length}`; }
    if (filters.academicYearId) { params.push(filters.academicYearId); where += ` AND e.academic_year_id = $${params.length}`; }
    if (filters.examId)         { params.push(filters.examId);         where += ` AND em.exam_id = $${params.length}`; }
    if (filters.gradeId)        { params.push(filters.gradeId);        where += ` AND s.grade_config_id = $${params.length}`; }
    if (filters.divisionId)     { params.push(filters.divisionId);     where += ` AND s.division_id = $${params.length}`; }

    return this.ds.query(
      `SELECT
        s.name_mr          AS student_name,
        s.gr_number        AS gr_no,
        s.roll_number      AS roll_no,
        gc.grade_label_mr,
        d.name_mr          AS division_name,
        e.name_mr          AS exam_name,
        em.theory_marks,
        em.internal_marks,
        em.practical_marks,
        em.total_marks,
        em.grade_letter,
        em."resultStatus" AS status
       FROM exam_marks em
       JOIN exam e              ON em.exam_id = e.id::text
       JOIN student s           ON em.student_id = s.id::text
       LEFT JOIN grade_config gc ON s.grade_config_id = gc.id::text
       LEFT JOIN division d      ON s.division_id = d.id::text
       WHERE ${where}
       ORDER BY gc.grade_number NULLS LAST, s.roll_number NULLS LAST, s.name_mr`,
      params,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ERP-style named reports
  // ═══════════════════════════════════════════════════════════════

  async classStrength(unitId: string, academicYearId?: string) {
    const params: any[] = [unitId];
    let ayFilter = '';
    if (academicYearId) { params.push(academicYearId); ayFilter = ` AND s.academic_year_id = $${params.length}`; }

    return this.ds.query(
      `SELECT
          gc.grade_number,
          gc.grade_label_mr,
          COUNT(*) AS total,
          SUM(CASE WHEN s.gender = 'male'   THEN 1 ELSE 0 END) AS boys,
          SUM(CASE WHEN s.gender = 'female' THEN 1 ELSE 0 END) AS girls,
          SUM(CASE WHEN s.gender = 'other'  THEN 1 ELSE 0 END) AS other_gender
       FROM student s
       LEFT JOIN grade_config gc ON s.grade_config_id = gc.id::text
       WHERE s.unit_id = $1 AND s.status = 'active'${ayFilter}
       GROUP BY gc.grade_number, gc.grade_label_mr
       ORDER BY gc.grade_number NULLS LAST`,
      params,
    );
  }

  async defaultersList(sansthaId: string, unitId?: string, academicYearId?: string) {
    const params: any[] = [sansthaId];
    let where = `s.sanstha_id = $1::text AND s.status = 'active'`;
    if (unitId)         { params.push(unitId);         where += ` AND s.unit_id = $${params.length}`; }
    if (academicYearId) { params.push(academicYearId); where += ` AND fd.academic_year_id = $${params.length}`; }

    return this.ds.query(
      `SELECT
          s.name_mr          AS student_name,
          s.father_name_mr,
          s.gr_number        AS gr_no,
          s.roll_number      AS roll_no,
          gc.grade_label_mr,
          gc.grade_number,
          d.name_mr          AS division_name,
          s.phone,
          u.name_mr          AS unit_name,
          COALESCE(SUM(fd.net_amount), 0)             AS total_demand,
          COALESCE(SUM(fd.paid_amount), 0)            AS total_paid,
          COALESCE(SUM(fd.net_amount - fd.paid_amount), 0) AS outstanding
       FROM student s
       JOIN fee_demand fd      ON fd.student_id = s.id::text
       LEFT JOIN grade_config gc ON s.grade_config_id = gc.id::text
       LEFT JOIN division d      ON s.division_id = d.id::text
       LEFT JOIN unit u          ON s.unit_id = u.id::text
       WHERE ${where}
       GROUP BY s.id, s.name_mr, s.father_name_mr, s.gr_number, s.roll_number,
                gc.grade_label_mr, gc.grade_number, d.name_mr, s.phone, u.name_mr
       HAVING COALESCE(SUM(fd.net_amount - fd.paid_amount), 0) > 0
       ORDER BY outstanding DESC`,
      params,
    );
  }

  async dayBook(unitId: string, date: string) {
    const rows = await this.ds.query(
      `SELECT
          fp.receipt_number,
          fp.payment_date,
          s.name_mr     AS student_name,
          s.gr_number   AS gr_no,
          gc.grade_label_mr,
          d.name_mr     AS division_name,
          fp.amount,
          fp."paymentMode" AS payment_mode,
          fp.cheque_number,
          fp.utr_number,
          fp.bank_name_mr,
          fp.remarks
       FROM fee_payment fp
       JOIN student s           ON fp.student_id = s.id::text
       LEFT JOIN grade_config gc ON s.grade_config_id = gc.id::text
       LEFT JOIN division d      ON s.division_id = d.id::text
       WHERE fp.unit_id = $1 AND fp.payment_date = $2 AND fp.is_cancelled = false
       ORDER BY fp.receipt_number`,
      [unitId, date],
    );
    const total = rows.reduce((s: number, r: any) => s + parseFloat(r.amount || 0), 0);
    return { rows, total, date, count: rows.length };
  }

  async newAdmissions(unitId: string, academicYearId: string) {
    return this.ds.query(
      `SELECT
          s.gr_number        AS gr_no,
          s.name_mr          AS student_name,
          s.father_name_mr,
          s.gender,
          s.date_of_birth,
          s.category,
          s.admission_date,
          gc.grade_label_mr,
          d.name_mr          AS division_name,
          s.phone
       FROM student s
       LEFT JOIN grade_config gc ON s.grade_config_id = gc.id::text
       LEFT JOIN division d      ON s.division_id = d.id::text
       WHERE s.unit_id = $1 AND s.academic_year_id = $2 AND s.status = 'active'
       ORDER BY s.admission_date NULLS LAST, gc.grade_number NULLS LAST, s.name_mr`,
      [unitId, academicYearId],
    );
  }

  async passFailAnalysis(unitId: string, academicYearId: string, examId?: string) {
    const params: any[] = [unitId, academicYearId];
    let examFilter = '';
    if (examId) { params.push(examId); examFilter = ` AND e.id = $${params.length}::text`; }

    return this.ds.query(
      `SELECT
          gc.grade_number,
          gc.grade_label_mr,
          e.name_mr          AS exam_name,
          COUNT(em.id)       AS total,
          SUM(CASE WHEN em."resultStatus" = 'pass' THEN 1 ELSE 0 END) AS passed,
          SUM(CASE WHEN em."resultStatus" = 'fail' THEN 1 ELSE 0 END) AS failed,
          ROUND(AVG(em.total_marks)::numeric, 1)   AS avg_marks,
          MAX(em.total_marks)                      AS max_marks,
          MIN(em.total_marks)                      AS min_marks
       FROM exam_marks em
       JOIN exam e              ON em.exam_id = e.id::text
       JOIN student s           ON em.student_id = s.id::text
       LEFT JOIN grade_config gc ON s.grade_config_id = gc.id::text
       WHERE e.unit_id = $1 AND e.academic_year_id = $2${examFilter}
       GROUP BY gc.grade_number, gc.grade_label_mr, e.id, e.name_mr
       ORDER BY gc.grade_number NULLS LAST`,
      params,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Report Template CRUD
  // ═══════════════════════════════════════════════════════════════

  async createTemplate(dto: Partial<ReportTemplate>): Promise<ReportTemplate> {
    return this.templateRepo.save(this.templateRepo.create(dto));
  }

  async findTemplates(sansthaId: string): Promise<ReportTemplate[]> {
    return this.templateRepo.find({
      where: { sansthaId, isActive: true },
      order: { createdAt: 'DESC' } as any,
    });
  }

  async updateTemplate(id: string, dto: Partial<ReportTemplate>): Promise<ReportTemplate> {
    await this.templateRepo.update(id, dto);
    const updated = await this.templateRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Template not found');
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepo.update(id, { isActive: false });
  }

  async executeTemplate(id: string, sansthaId: string, runtimeFilters: Record<string, any>) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    const filters = { ...template.defaultFilters, ...runtimeFilters };
    let rows: any[];

    switch (template.dataSource) {
      case 'students':     rows = await this.fetchStudents(sansthaId, filters);    break;
      case 'fee_demands':  rows = await this.fetchFeeDemands(sansthaId, filters);  break;
      case 'fee_payments': rows = await this.fetchFeePayments(sansthaId, filters); break;
      case 'staff':        rows = await this.fetchStaff(sansthaId, filters);       break;
      case 'exam_marks':   rows = await this.fetchExamMarks(sansthaId, filters);   break;
      default:             rows = [];
    }

    return { template, rows };
  }
}
