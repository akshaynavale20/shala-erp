import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/** Resolve a logo/photo URL that may be:
 *  - a full S3 URL: https://shala-erp-uploads-prod.s3...  → return as-is
 *  - a legacy relative path: /uploads/logo-xxx.png        → prepend API_BASE
 *  - null/undefined                                        → return null
 */
export function mediaUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ── API functions

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/api/v1/auth/login', { email, password }).then((r) => r.data),
};

export const sansthaApi = {
  create: (data: any) => apiClient.post('/api/v1/sanstha', data).then((r) => r.data),
  findAll: () => apiClient.get('/api/v1/sanstha').then((r) => r.data),
  findOne: (id: string) => apiClient.get(`/api/v1/sanstha/${id}`).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/sanstha/${id}`, data).then((r) => r.data),
  uploadLogo: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return apiClient.post(`/api/v1/sanstha/${id}/logo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export const roleApi = {
  findBySanstha: (sansthaId: string) =>
    apiClient.get('/api/v1/roles', { params: { sansthaId } }).then((r) => r.data),
  create: (data: any) => apiClient.post('/api/v1/roles', data).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/roles/${id}`, data).then((r) => r.data),
};

export const unitApi = {
  create: (data: any) => apiClient.post('/api/v1/units', data).then((r) => r.data),
  findBySanstha: (sansthaId: string) =>
    apiClient.get('/api/v1/units', { params: { sansthaId } }).then((r) => r.data),
  findOne: (id: string) => apiClient.get(`/api/v1/units/${id}`).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/units/${id}`, data).then((r) => r.data),
};

export const staffApi = {
  create: (data: any) => apiClient.post('/api/v1/staff', data).then((r) => r.data),
  findBySanstha: (sansthaId: string, unitId?: string) =>
    apiClient.get('/api/v1/staff', { params: { sansthaId, ...(unitId ? { unitId } : {}) } }).then((r) => r.data),
  findOne: (id: string) => apiClient.get(`/api/v1/staff/${id}`).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/staff/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => apiClient.delete(`/api/v1/staff/${id}`).then((r) => r.data),
  uploadPhoto: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('photo', file);
    return apiClient.post(`/api/v1/staff/${id}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export const studentApi = {
  create: (data: any) => apiClient.post('/api/v1/students', data).then((r) => r.data),
  findBySanstha: (sansthaId: string, params?: { unitId?: string; academicYearId?: string; divisionId?: string }) =>
    apiClient.get('/api/v1/students', { params: { sansthaId, ...params } }).then((r) => r.data),
  findOne: (id: string) => apiClient.get(`/api/v1/students/${id}`).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/students/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => apiClient.delete(`/api/v1/students/${id}`).then((r) => r.data),
  uploadPhoto: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('photo', file);
    return apiClient.post(`/api/v1/students/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  importExcel: (file: File, unitId: string, academicYearId: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('unitId', unitId);
    fd.append('academicYearId', academicYearId);
    return apiClient.post('/api/v1/students/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
};

export const attendanceApi = {
  markBulk: (data: any) => apiClient.post('/api/v1/attendance/bulk', data).then((r) => r.data),
  getByUnit: (unitId: string, date: string) =>
    apiClient.get('/api/v1/attendance/by-unit', { params: { unitId, date } }).then((r) => r.data),
  getByDivision: (divisionId: string, date: string) =>
    apiClient.get('/api/v1/attendance/division', { params: { divisionId, date } }).then((r) => r.data),
  monthly: (params: any) => apiClient.get('/api/v1/attendance/monthly', { params }).then((r) => r.data),
};

export const examApi = {
  create: (data: any) => apiClient.post('/api/v1/exams', data).then((r) => r.data),
  findBySanstha: (sansthaId: string, params?: any) =>
    apiClient.get('/api/v1/exams', { params: { sansthaId, ...params } }).then((r) => r.data),
  findOne: (id: string) => apiClient.get(`/api/v1/exams/${id}`).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/exams/${id}`, data).then((r) => r.data),
  saveMarks: (examId: string, marks: any[]) =>
    apiClient.post(`/api/v1/exams/${examId}/marks`, { marks }).then((r) => r.data),
  getMarks: (examId: string) => apiClient.get(`/api/v1/exams/${examId}/marks`).then((r) => r.data),
};

export const feeApi = {
  // Structures
  createStructure: (data: any) => apiClient.post('/api/v1/fees/structures', data).then((r) => r.data),
  findStructures: (sansthaId: string, params?: any) =>
    apiClient.get('/api/v1/fees/structures', { params: { sansthaId, ...params } }).then((r) => r.data),
  updateStructure: (id: string, data: any) => apiClient.put(`/api/v1/fees/structures/${id}`, data).then((r) => r.data),
  attachTemplateToGrades: (templateId: string, assignments: any[]) =>
    apiClient.post(`/api/v1/fees/structures/${templateId}/attach-to-grades`, { assignments }).then((r) => r.data),
  // Installments
  saveInstallments: (structureId: string, installments: any[]) =>
    apiClient.post(`/api/v1/fees/structures/${structureId}/installments`, { installments }).then((r) => r.data),
  getInstallments: (structureId: string) =>
    apiClient.get(`/api/v1/fees/structures/${structureId}/installments`).then((r) => r.data),
  // Concession templates
  createConcessionTemplate: (data: any) => apiClient.post('/api/v1/fees/concession-templates', data).then((r) => r.data),
  findConcessionTemplates: (sansthaId: string) =>
    apiClient.get('/api/v1/fees/concession-templates', { params: { sansthaId } }).then((r) => r.data),
  updateConcessionTemplate: (id: string, data: any) =>
    apiClient.put(`/api/v1/fees/concession-templates/${id}`, data).then((r) => r.data),
  // Demands
  generateDemands: (data: any) => apiClient.post('/api/v1/fees/demands/generate', data).then((r) => r.data),
  studentDemands: (studentId: string, academicYearId?: string) =>
    apiClient.get(`/api/v1/fees/demands/student/${studentId}`, { params: { academicYearId } }).then((r) => r.data),
  updateConcession: (demandId: string, data: any) =>
    apiClient.put(`/api/v1/fees/demands/${demandId}/concession`, data).then((r) => r.data),
  applyConcessionTemplate: (data: any) =>
    apiClient.post('/api/v1/fees/demands/apply-template', data).then((r) => r.data),
  // Collection
  collect: (data: any) => apiClient.post('/api/v1/fees/collect', data).then((r) => r.data),
  nextReceiptNumber: (unitId: string) =>
    apiClient.get(`/api/v1/fees/receipt-number/${unitId}`).then((r) => r.data),
  cancelPayment: (id: string, reason?: string) =>
    apiClient.put(`/api/v1/fees/payments/${id}/cancel`, { reason }).then((r) => r.data),
  // History
  studentPayments: (studentId: string, academicYearId?: string) =>
    apiClient.get(`/api/v1/fees/student/${studentId}`, { params: { academicYearId } }).then((r) => r.data),
  unitPayments: (unitId: string, academicYearId: string) =>
    apiClient.get(`/api/v1/fees/unit/${unitId}`, { params: { academicYearId } }).then((r) => r.data),
  // Outstanding & defaulters
  studentOutstanding: (studentId: string, academicYearId: string) =>
    apiClient.get(`/api/v1/fees/outstanding/student/${studentId}`, { params: { academicYearId } }).then((r) => r.data),
  unitOutstanding: (unitId: string, academicYearId: string) =>
    apiClient.get(`/api/v1/fees/outstanding/unit/${unitId}`, { params: { academicYearId } }).then((r) => r.data),
  defaulters: (unitId: string, academicYearId: string) =>
    apiClient.get(`/api/v1/fees/defaulters/${unitId}`, { params: { academicYearId } }).then((r) => r.data),
  divisionDemands: (divisionId: string, unitId: string, academicYearId: string) =>
    apiClient.get(`/api/v1/fees/demands/division/${divisionId}`, { params: { unitId, academicYearId } }).then((r) => r.data),
  feeMetrics: (unitId: string, academicYearId: string) =>
    apiClient.get(`/api/v1/fees/metrics/${unitId}`, { params: { academicYearId } }).then((r) => r.data),
};

export const salaryApi = {
  createComponent: (data: any) => apiClient.post('/api/v1/salary/components', data).then((r) => r.data),
  findComponents: (sansthaId: string) =>
    apiClient.get('/api/v1/salary/components', { params: { sansthaId } }).then((r) => r.data),
  createSlip: (data: any) => apiClient.post('/api/v1/salary/slips', data).then((r) => r.data),
  findSlips: (sansthaId: string, params?: any) =>
    apiClient.get('/api/v1/salary/slips', { params: { sansthaId, ...params } }).then((r) => r.data),
  findOne: (id: string) => apiClient.get(`/api/v1/salary/slips/${id}`).then((r) => r.data),
  approve: (id: string) => apiClient.put(`/api/v1/salary/slips/${id}/approve`, {}).then((r) => r.data),
  markPaid: (id: string, data: any) => apiClient.put(`/api/v1/salary/slips/${id}/paid`, data).then((r) => r.data),
};

export const certificateApi = {
  issue: (data: any) => apiClient.post('/api/v1/certificates', data).then((r) => r.data),
  findBySanstha: (sansthaId: string, unitId?: string) =>
    apiClient.get('/api/v1/certificates', { params: { sansthaId, unitId } }).then((r) => r.data),
  byStudent: (studentId: string) =>
    apiClient.get(`/api/v1/certificates/student/${studentId}`).then((r) => r.data),
  findOne: (id: string) => apiClient.get(`/api/v1/certificates/${id}`).then((r) => r.data),
  cancel: (id: string) => apiClient.put(`/api/v1/certificates/${id}/cancel`, {}).then((r) => r.data),
  nextNumber: (unitId: string, type: string) =>
    apiClient.get(`/api/v1/certificates/next-number/${unitId}/${type}`).then((r) => r.data),
};

export const academicYearApi = {
  findBySanstha: (sansthaId: string) =>
    apiClient.get('/api/v1/academic-years', { params: { sansthaId } }).then((r) => r.data),
  create: (data: any) => apiClient.post('/api/v1/academic-years', data).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/academic-years/${id}`, data).then((r) => r.data),
};

export const financialYearApi = {
  findBySanstha: (sansthaId: string) =>
    apiClient.get('/api/v1/financial-years', { params: { sansthaId } }).then((r) => r.data),
};

export const accountsApi = {
  create: (data: any) => apiClient.post('/api/v1/accounts', data).then((r) => r.data),
  findAll: (sansthaId: string, params?: any) =>
    apiClient.get('/api/v1/accounts', { params: { sansthaId, ...params } }).then((r) => r.data),
  summary: (sansthaId: string, params?: any) =>
    apiClient.get('/api/v1/accounts/summary', { params: { sansthaId, ...params } }).then((r) => r.data),
  nextVoucher: (sansthaId: string, type: string) =>
    apiClient.get(`/api/v1/accounts/next-voucher/${type}`, { params: { sansthaId } }).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/accounts/${id}`, data).then((r) => r.data),
  approve: (id: string) => apiClient.put(`/api/v1/accounts/${id}/approve`, {}).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/api/v1/accounts/${id}`).then((r) => r.data),
};


export const reportApi = {
  sansthaSummary: (sansthaId: string) =>
    apiClient.get('/api/v1/reports/sanstha-summary', { params: { sansthaId } }).then((r) => r.data),
  unitSummary: (unitId: string, academicYearId?: string) =>
    apiClient.get('/api/v1/reports/unit-summary', { params: { unitId, academicYearId } }).then((r) => r.data),
  attendance: (unitId: string, startDate: string, endDate: string) =>
    apiClient.get('/api/v1/reports/attendance', { params: { unitId, startDate, endDate } }).then((r) => r.data),
  feeCollection: (sansthaId: string, params?: any) =>
    apiClient.get('/api/v1/reports/fee-collection', { params: { sansthaId, ...params } }).then((r) => r.data),
  salary: (sansthaId: string, params?: any) =>
    apiClient.get('/api/v1/reports/salary', { params: { sansthaId, ...params } }).then((r) => r.data),
  certificates: (sansthaId: string, unitId?: string) =>
    apiClient.get('/api/v1/reports/certificates', { params: { sansthaId, unitId } }).then((r) => r.data),

  // Raw data endpoints
  dataStudents: (params: any) =>
    apiClient.get('/api/v1/reports/data/students', { params }).then((r) => r.data),
  dataFeeDemands: (params: any) =>
    apiClient.get('/api/v1/reports/data/fee-demands', { params }).then((r) => r.data),
  dataFeePayments: (params: any) =>
    apiClient.get('/api/v1/reports/data/fee-payments', { params }).then((r) => r.data),
  dataStaff: (params: any) =>
    apiClient.get('/api/v1/reports/data/staff', { params }).then((r) => r.data),
  dataExamMarks: (params: any) =>
    apiClient.get('/api/v1/reports/data/exam-marks', { params }).then((r) => r.data),

  // ERP named reports
  classStrength: (unitId: string, academicYearId?: string) =>
    apiClient.get('/api/v1/reports/class-strength', { params: { unitId, academicYearId } }).then((r) => r.data),
  defaulters: (params: any) =>
    apiClient.get('/api/v1/reports/defaulters', { params }).then((r) => r.data),
  dayBook: (unitId: string, date: string) =>
    apiClient.get('/api/v1/reports/day-book', { params: { unitId, date } }).then((r) => r.data),
  newAdmissions: (unitId: string, academicYearId: string) =>
    apiClient.get('/api/v1/reports/new-admissions', { params: { unitId, academicYearId } }).then((r) => r.data),
  passFailAnalysis: (unitId: string, academicYearId: string, examId?: string) =>
    apiClient.get('/api/v1/reports/pass-fail', { params: { unitId, academicYearId, examId } }).then((r) => r.data),

  // Template CRUD
  createTemplate: (data: any) =>
    apiClient.post('/api/v1/reports/templates', data).then((r) => r.data),
  findTemplates: () =>
    apiClient.get('/api/v1/reports/templates').then((r) => r.data),
  updateTemplate: (id: string, data: any) =>
    apiClient.put(`/api/v1/reports/templates/${id}`, data).then((r) => r.data),
  deleteTemplate: (id: string) =>
    apiClient.delete(`/api/v1/reports/templates/${id}`).then((r) => r.data),
  executeTemplate: (id: string, filters: any) =>
    apiClient.post(`/api/v1/reports/templates/${id}/execute`, filters).then((r) => r.data),
};

export const gradeApi = {
  // Grade configs
  create: (data: any) => apiClient.post('/api/v1/grades', data).then((r) => r.data),
  findByUnit: (unitId: string, academicYearId?: string) =>
    apiClient.get('/api/v1/grades', { params: { unitId, academicYearId } }).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/grades/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/api/v1/grades/${id}`).then((r) => r.data),
  // Divisions
  createDivision: (data: any) => apiClient.post('/api/v1/grades/divisions', data).then((r) => r.data),
  findDivisions: (unitId: string, academicYearId?: string, gradeConfigId?: string) =>
    apiClient.get('/api/v1/grades/divisions', { params: { unitId, academicYearId, gradeConfigId } }).then((r) => r.data),
  findDivisionsWithGrade: (unitId?: string, academicYearId?: string, sansthaId?: string) =>
    apiClient.get('/api/v1/grades/divisions/with-grade', { params: { unitId, academicYearId, sansthaId } }).then((r) => r.data),
  updateDivision: (id: string, data: any) => apiClient.put(`/api/v1/grades/divisions/${id}`, data).then((r) => r.data),
  deleteDivision: (id: string) => apiClient.delete(`/api/v1/grades/divisions/${id}`).then((r) => r.data),
};

export const timetableApi = {
  getByDivision: (unitId: string, divisionId: string, academicYearId: string) =>
    apiClient.get('/api/v1/timetable/division', { params: { unitId, divisionId, academicYearId } }).then((r) => r.data),
  getByUnit: (unitId: string, academicYearId: string) =>
    apiClient.get('/api/v1/timetable/unit', { params: { unitId, academicYearId } }).then((r) => r.data),
  saveBulk: (entries: any[]) => apiClient.post('/api/v1/timetable/bulk', { entries }).then((r) => r.data),
  saveEntry: (dto: any) => apiClient.post('/api/v1/timetable', dto).then((r) => r.data),
  deleteEntry: (id: string) => apiClient.delete(`/api/v1/timetable/${id}`).then((r) => r.data),
};

export const libraryApi = {
  addBook: (dto: any) => apiClient.post('/api/v1/library/books', dto).then((r) => r.data),
  findBooks: (unitId: string, search?: string) =>
    apiClient.get('/api/v1/library/books', { params: { unitId, search } }).then((r) => r.data),
  updateBook: (id: string, dto: any) => apiClient.put(`/api/v1/library/books/${id}`, dto).then((r) => r.data),
  getStats: (unitId: string) => apiClient.get('/api/v1/library/stats', { params: { unitId } }).then((r) => r.data),
  issueBook: (dto: any) => apiClient.post('/api/v1/library/issue', dto).then((r) => r.data),
  returnBook: (id: string, data: any) => apiClient.put(`/api/v1/library/issue/${id}/return`, data).then((r) => r.data),
  activeIssues: (unitId: string) =>
    apiClient.get('/api/v1/library/issues/active', { params: { unitId } }).then((r) => r.data),
  overdueBooks: (unitId: string) =>
    apiClient.get('/api/v1/library/issues/overdue', { params: { unitId } }).then((r) => r.data),
  memberIssues: (memberId: string) =>
    apiClient.get(`/api/v1/library/issues/member/${memberId}`).then((r) => r.data),
};

export const userApi = {
  create: (data: any) => apiClient.post('/api/v1/users', data).then((r) => r.data),
  findBySanstha: (sansthaId: string) =>
    apiClient.get('/api/v1/users', { params: { sansthaId } }).then((r) => r.data),
  findOne: (id: string) => apiClient.get(`/api/v1/users/${id}`).then((r) => r.data),
  update: (id: string, data: any) => apiClient.put(`/api/v1/users/${id}`, data).then((r) => r.data),
  assignRole: (userId: string, data: any) =>
    apiClient.post(`/api/v1/users/${userId}/roles`, data).then((r) => r.data),
  removeRole: (userId: string, uurId: string) =>
    apiClient.delete(`/api/v1/users/${userId}/roles/${uurId}`).then((r) => r.data),
  deactivate: (id: string) => apiClient.delete(`/api/v1/users/${id}`).then((r) => r.data),
  reactivate: (id: string) => apiClient.put(`/api/v1/users/${id}/reactivate`, {}).then((r) => r.data),
  resetPassword: (id: string) => apiClient.post(`/api/v1/users/${id}/reset-password`, {}).then((r) => r.data),
};
