/**
 * ReportsPage — ERP-style school report centre
 * Left sidebar with 14 named reports grouped by domain.
 * Each report: filter bar → KPI summary → data table → print/Excel.
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Row, Col, Select, Table, Typography, Tag, Spin, DatePicker,
  Button, Space, Statistic, Card, Alert, Divider,
  Progress, message, Empty,
} from 'antd';
import {
  PrinterOutlined, DownloadOutlined, TeamOutlined, DollarOutlined,
  CalendarOutlined, FileTextOutlined, BarChartOutlined, BookOutlined,
  UserOutlined, AuditOutlined, BankOutlined, CheckCircleOutlined,
  CloseCircleOutlined, RiseOutlined, CodeOutlined, SaveOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import { Checkbox, Input, Form, Modal } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  unitApi, reportApi, examApi, certificateApi, sansthaApi, studentApi,
} from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { useCurrentYear } from '../../hooks/useCurrentYear';
import { printGenericTable, exportToExcel } from '../../utils/erp-print';
import { downloadReportPDF } from '../../pdf/ReportTable';
import { downloadFeeSummary } from '../../pdf';
import ClassDivisionSelect from '../../components/common/ClassDivisionSelect';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'; // reserved for future image URLs

// ── Label maps ─────────────────────────────────────────────────────────────────
const GENDER_LABEL: Record<string, string> = { male: 'मुले', female: 'मुली', other: 'इतर' };
const PAY_MODE_LABEL: Record<string, string> = {
  cash: 'रोख', cheque: 'चेक', dd: 'DD', online: 'ऑनलाइन', upi: 'UPI', neft: 'NEFT',
};
const EMP_TYPE_LABEL: Record<string, string> = {
  permanent: 'कायमस्वरूपी', temporary: 'तात्पुरते', contract: 'कंत्राटी', volunteer: 'स्वयंसेवक',
};
const CERT_TYPE_LABEL: Record<string, string> = {
  bonafide: 'बोनाफाईड', leaving: 'शाळा सोडल्याचा (TC)', character: 'चारित्र्य',
  study: 'अध्ययन', migration: 'स्थलांतर', medium: 'माध्यम', caste_validity: 'जात वैधता',
};
const STATUS_COLOR: Record<string, string> = {
  paid: 'green', partial: 'orange', pending: 'red', issued: 'green', cancelled: 'red',
};

// ── Sidebar groups + report manifest ───────────────────────────────────────────
const SIDEBAR_GROUPS = [
  {
    key: 'students', icon: <TeamOutlined />, label: 'विद्यार्थी',
    reports: [
      { id: 'gr-register',    label: 'नामनिर्देशिका / GR नोंदवही', icon: <BookOutlined /> },
      { id: 'class-strength', label: 'वर्गनिहाय शक्ती',            icon: <BarChartOutlined /> },
      { id: 'category',       label: 'प्रवर्गनिहाय सारांश',        icon: <AuditOutlined /> },
      { id: 'new-admissions', label: 'नवीन प्रवेश',                 icon: <UserOutlined /> },
    ],
  },
  {
    key: 'fees', icon: <DollarOutlined />, label: 'शुल्क',
    reports: [
      { id: 'fee-summary',      label: 'शुल्क संकलन सारांश',   icon: <RiseOutlined /> },
      { id: 'defaulters',       label: 'थकबाकी यादी',          icon: <CloseCircleOutlined /> },
      { id: 'receipt-register', label: 'पावती नोंदवही',         icon: <FileTextOutlined /> },
      { id: 'day-book',         label: 'दैनिक रोखवही (Day Book)', icon: <BankOutlined /> },
    ],
  },
  {
    key: 'staff', icon: <UserOutlined />, label: 'कर्मचारी',
    reports: [
      { id: 'staff-register', label: 'कर्मचारी नोंदवही', icon: <TeamOutlined /> },
      { id: 'salary-summary', label: 'वेतन सारांश',       icon: <DollarOutlined /> },
    ],
  },
  {
    key: 'exams', icon: <AuditOutlined />, label: 'परीक्षा',
    reports: [
      { id: 'exam-marks', label: 'गुणपत्रक',           icon: <FileTextOutlined /> },
      { id: 'pass-fail',  label: 'निकाल विश्लेषण',     icon: <CheckCircleOutlined /> },
    ],
  },
  {
    key: 'attendance', icon: <CalendarOutlined />, label: 'हजेरी',
    reports: [
      { id: 'attendance', label: 'हजेरी सारांश', icon: <CalendarOutlined /> },
    ],
  },
  {
    key: 'certificates', icon: <FileTextOutlined />, label: 'प्रमाणपत्रे',
    reports: [
      { id: 'cert-register', label: 'प्रमाणपत्र नोंदवही', icon: <AuditOutlined /> },
    ],
  },
  {
    key: 'custom', icon: <CodeOutlined />, label: 'Custom अहवाल',
    reports: [
      { id: 'custom-report', label: 'Custom अहवाल तयार करा', icon: <CodeOutlined /> },
    ],
  },
];

// printERP and exportToExcel are imported from '../../utils/erp-print'
// printERP — unified print helper for all 14 report types
function printERP(
  title: string,
  cols: { title: string; key: string; align?: string }[],
  rows: any[],
  sanstha?: any,
  extra?: { label: string; value: string }[],
  unit?: any,
  footerNote?: string,
  userName?: string,
) {
  // Use react-pdf for rich PDF, fallback to legacy HTML print
  const pdfCols = cols.map(c => ({
    key: c.key,
    header: c.title,
    align: (c.align as 'left' | 'right' | 'center') || 'left',
  }));
  const filters = (extra || []).map(e => ({ label: e.label, value: e.value }));
  downloadReportPDF({
    title,
    cols: pdfCols,
    rows,
    sanstha,
    unit,
    userName,
    filters,
    footerNote,
  }).catch(() => printGenericTable(title, cols, rows, sanstha, unit, extra, footerNote, userName));
}

// ── Shared: filter bar wrapper ───────────────────────────────────────────────
function FilterBar({ children, count, onPrint, onExcel, printDisabled }:
  { children: React.ReactNode; count?: number; title?: string; onPrint?: () => void; onExcel?: () => void; printDisabled?: boolean }) {
  return (
    <div style={{ background: '#EEF4F9', border: '1px solid #BCD4E8', borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
      <Row gutter={[8, 8]} align="middle" wrap>
        <Col flex="auto">
          <Space size={8} wrap>{children}</Space>
        </Col>
        <Col>
          <Space>
            {count !== undefined && (
              <Tag color="blue" style={{ fontSize: 12 }}>नोंदी: {count}</Tag>
            )}
            {onPrint && (
              <Button icon={<PrinterOutlined />} size="small" type="primary" ghost disabled={printDisabled}
                onClick={onPrint}>मुद्रित करा</Button>
            )}
            {onExcel && (
              <Button icon={<DownloadOutlined />} size="small" disabled={printDisabled}
                onClick={onExcel}>Excel</Button>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
}

// ── Unit state synced with global store ─────────────────────────────────────
function useUnitState() {
  const { selectedUnitId: globalUnit, setSelectedUnitId: setGlobalUnit } = useAppStore();
  const [unitId, _setUnitId] = useState<string | undefined>(globalUnit ?? undefined);
  const setUnitId = useCallback((v: string | undefined) => {
    _setUnitId(v);
    setGlobalUnit(v ?? null);
  }, [setGlobalUnit]);
  return [unitId, setUnitId] as const;
}

// ── Report: GR Register ──────────────────────────────────────────────────────
function GRRegisterReport({ units, academicYears, sanstha, defaultYearId }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId]  = useState<string | undefined>(() => defaultYearId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (defaultYearId && !yearId) setYearId(defaultYearId); }, [defaultYearId]);
  const [gradeId, setGradeId] = useState<string>();
  const [divId, setDivId]    = useState<string>();
  const [gender, setGender]  = useState<string>();

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['rpt-gr', unitId, yearId, gradeId, divId, gender],
    queryFn: () => reportApi.dataStudents({ unitId, academicYearId: yearId, gradeId, divisionId: divId, gender }),
    enabled: !!unitId,
  });

  const unit = units.find((u: any) => u.id === unitId);
  const COLS = [
    { title: 'GR क्र.', key: 'gr_no', align: 'left' as const },
    { title: 'विद्यार्थ्याचे नाव', key: 'student_name' },
    { title: 'वडिलांचे नाव', key: 'father_name_mr' },
    { title: 'लिंग', key: 'gender', render: (v: string) => GENDER_LABEL[v] || v },
    { title: 'जन्मतारीख', key: 'date_of_birth', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'प्रवर्ग', key: 'category' },
    { title: 'इयत्ता', key: 'grade_label_mr' },
    { title: 'तुकडी', key: 'division_name' },
    { title: 'रोल', key: 'roll_no' },
    { title: 'प्रवेश दिनांक', key: 'admission_date', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'फोन', key: 'phone' },
    { title: 'पत्ता', key: 'address_mr' },
  ];
  const printRows = (rows as any[]).map(r => ({
    ...r,
    gender: GENDER_LABEL[r.gender] || r.gender,
    date_of_birth: r.date_of_birth ? dayjs(r.date_of_birth).format('DD/MM/YYYY') : '—',
    admission_date: r.admission_date ? dayjs(r.admission_date).format('DD/MM/YYYY') : '—',
  }));

  return (
    <div>
      <FilterBar
        count={(rows as any[]).length}
        onPrint={() => printERP('विद्यार्थी नामनिर्देशिका / GR नोंदवही', COLS, printRows, sanstha, [], unit)}
        onExcel={() => exportToExcel(COLS, printRows, 'gr-register')}
        printDisabled={!(rows as any[]).length}
      >
        <Select placeholder="शाळा *" style={{ width: 200 }} value={unitId} onChange={v => { setUnitId(v); setGradeId(undefined); setDivId(undefined); }}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="शैक्षणिक वर्ष" allowClear style={{ width: 160 }} value={yearId} onChange={setYearId}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
        {unitId && (
          <ClassDivisionSelect unitId={unitId} academicYearId={yearId}
            gradeValue={gradeId} divisionValue={divId}
            onGradeChange={v => { setGradeId(v); setDivId(undefined); }}
            onDivisionChange={v => setDivId(v || undefined)} />
        )}
        <Select placeholder="लिंग (सर्व)" allowClear style={{ width: 130 }} value={gender} onChange={setGender}
          options={Object.entries(GENDER_LABEL).map(([k, v]) => ({ value: k, label: v }))} />
      </FilterBar>

      {!unitId
        ? <Alert type="info" showIcon message="शाळा निवडा" />
        : (
          <Table
            dataSource={rows as any[]}
            loading={isFetching}
            columns={COLS.map(c => ({ title: c.title, dataIndex: c.key, key: c.key, render: (c as any).render }))}
            rowKey={(r: any, i?: number) => `gr_${r.gr_no}_${i}`}
            size="small" pagination={{ pageSize: 50, showTotal: t => `एकूण ${t}` }}
            scroll={{ x: 1200 }}
            summary={() => (rows as any[]).length > 0 ? (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={12}>
                  <Text strong style={{ fontSize: 12 }}>एकूण विद्यार्थी: {(rows as any[]).length}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            ) : null}
          />
        )
      }
    </div>
  );
}

// ── Report: Class Strength ───────────────────────────────────────────────────
function ClassStrengthReport({ units, academicYears, sanstha, defaultYearId }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId]  = useState<string | undefined>(() => defaultYearId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (defaultYearId && !yearId) setYearId(defaultYearId); }, [defaultYearId]);

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['rpt-class-strength', unitId, yearId],
    queryFn: () => reportApi.classStrength(unitId!, yearId),
    enabled: !!unitId,
  });

  const unit = units.find((u: any) => u.id === unitId);
  const totalBoys  = (rows as any[]).reduce((s: number, r: any) => s + parseInt(r.boys || 0), 0);
  const totalGirls = (rows as any[]).reduce((s: number, r: any) => s + parseInt(r.girls || 0), 0);
  const total      = (rows as any[]).reduce((s: number, r: any) => s + parseInt(r.total || 0), 0);

  const COLS = [
    { title: 'इयत्ता', key: 'grade_label_mr' },
    { title: 'मुले', key: 'boys', align: 'right' as const },
    { title: 'मुली', key: 'girls', align: 'right' as const },
    { title: 'इतर', key: 'other_gender', align: 'right' as const },
    { title: 'एकूण', key: 'total', align: 'right' as const },
  ];

  return (
    <div>
      <FilterBar
        count={total > 0 ? total : undefined}
        onPrint={() => printERP('वर्गनिहाय विद्यार्थी शक्ती', COLS, rows as any[], sanstha, [], unit)}
        onExcel={() => exportToExcel(COLS, rows as any[], 'class-strength')}
        printDisabled={!(rows as any[]).length}
      >
        <Select placeholder="शाळा *" style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="शैक्षणिक वर्ष" allowClear style={{ width: 160 }} value={yearId} onChange={setYearId}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
      </FilterBar>

      {(rows as any[]).length > 0 && (
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col xs={8}><Statistic title="एकूण मुले" value={totalBoys} valueStyle={{ color: '#2980B9', fontSize: 22 }} /></Col>
          <Col xs={8}><Statistic title="एकूण मुली" value={totalGirls} valueStyle={{ color: '#E91E63', fontSize: 22 }} /></Col>
          <Col xs={8}><Statistic title="एकूण विद्यार्थी" value={total} valueStyle={{ color: '#27AE60', fontSize: 22, fontWeight: 700 }} /></Col>
        </Row>
      )}

      {!unitId
        ? <Alert type="info" showIcon message="शाळा निवडा" />
        : (
          <Table
            dataSource={rows as any[]}
            loading={isFetching}
            columns={[
              { title: 'इयत्ता', dataIndex: 'grade_label_mr', key: 'grade' },
              { title: 'मुले', dataIndex: 'boys', key: 'boys', align: 'right' as const,
                render: (v: any) => <Text style={{ color: '#2980B9' }}>{v}</Text> },
              { title: 'मुली', dataIndex: 'girls', key: 'girls', align: 'right' as const,
                render: (v: any) => <Text style={{ color: '#E91E63' }}>{v}</Text> },
              { title: 'इतर', dataIndex: 'other_gender', key: 'other', align: 'right' as const },
              { title: 'एकूण', dataIndex: 'total', key: 'total', align: 'right' as const,
                render: (v: any) => <Text strong style={{ color: '#27AE60' }}>{v}</Text> },
            ]}
            rowKey="grade_label_mr"
            size="small"
            pagination={false}
            summary={() => total > 0 ? (
              <Table.Summary.Row style={{ background: '#EEF4F9', fontWeight: 700 }}>
                <Table.Summary.Cell index={0}><b>एकूण</b></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right"><Text style={{ color: '#2980B9' }}><b>{totalBoys}</b></Text></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right"><Text style={{ color: '#E91E63' }}><b>{totalGirls}</b></Text></Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right"></Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right"><Text strong style={{ color: '#27AE60' }}><b>{total}</b></Text></Table.Summary.Cell>
              </Table.Summary.Row>
            ) : null}
          />
        )
      }
    </div>
  );
}

// ── Report: Category Summary ─────────────────────────────────────────────────
function CategoryReport({ units, academicYears, sanstha, defaultYearId }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId]  = useState<string | undefined>(() => defaultYearId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (defaultYearId && !yearId) setYearId(defaultYearId); }, [defaultYearId]);

  const { data: allStudents = [], isFetching } = useQuery({
    queryKey: ['rpt-category', unitId, yearId],
    queryFn: () => reportApi.dataStudents({ unitId, academicYearId: yearId }),
    enabled: !!unitId,
  });

  const categoryMap = useMemo(() => {
    const m: Record<string, { total: number; boys: number; girls: number }> = {};
    (allStudents as any[]).forEach((s: any) => {
      const cat = s.category || 'अनिर्दिष्ट';
      if (!m[cat]) m[cat] = { total: 0, boys: 0, girls: 0 };
      m[cat].total++;
      if (s.gender === 'male') m[cat].boys++;
      if (s.gender === 'female') m[cat].girls++;
    });
    return m;
  }, [allStudents]);

  const catRows = Object.entries(categoryMap).map(([category, c]) => ({ category, ...c }))
    .sort((a, b) => b.total - a.total);
  const total = catRows.reduce((s, r) => s + r.total, 0);

  const COLS = [
    { title: 'प्रवर्ग', key: 'category' },
    { title: 'मुले', key: 'boys', align: 'right' as const },
    { title: 'मुली', key: 'girls', align: 'right' as const },
    { title: 'एकूण', key: 'total', align: 'right' as const },
    { title: 'टक्केवारी', key: 'pct', align: 'right' as const },
  ];
  const printRows = catRows.map(r => ({
    ...r, pct: total ? `${((r.total / total) * 100).toFixed(1)}%` : '0%',
  }));

  const unit = units.find((u: any) => u.id === unitId);

  return (
    <div>
      <FilterBar
        count={catRows.length > 0 ? total : undefined}
        onPrint={() => printERP('प्रवर्गनिहाय विद्यार्थी सारांश', COLS, printRows, sanstha, [], unit)}
        onExcel={() => exportToExcel(COLS, printRows, 'category-summary')}
        printDisabled={!catRows.length}
      >
        <Select placeholder="शाळा *" style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="शैक्षणिक वर्ष" allowClear style={{ width: 160 }} value={yearId} onChange={setYearId}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
      </FilterBar>

      {!unitId ? <Alert type="info" showIcon message="शाळा निवडा" /> : (
        <Table
          dataSource={catRows}
          loading={isFetching}
          columns={[
            { title: 'प्रवर्ग', dataIndex: 'category', key: 'cat',
              render: (v: string) => <Tag color="purple">{v}</Tag> },
            { title: 'मुले', dataIndex: 'boys', key: 'boys', align: 'right' as const,
              render: (v: number) => <Text style={{ color: '#2980B9' }}>{v}</Text> },
            { title: 'मुली', dataIndex: 'girls', key: 'girls', align: 'right' as const,
              render: (v: number) => <Text style={{ color: '#E91E63' }}>{v}</Text> },
            { title: 'एकूण', dataIndex: 'total', key: 'total', align: 'right' as const,
              render: (v: number) => <Text strong>{v}</Text> },
            { title: 'टक्केवारी', key: 'pct', align: 'right' as const,
              render: (_: any, r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  <Text>{total ? ((r.total / total) * 100).toFixed(1) : 0}%</Text>
                  <Progress percent={total ? Math.round((r.total / total) * 100) : 0} size="small"
                    style={{ width: 60, margin: 0 }} showInfo={false} />
                </div>
              ) },
          ]}
          rowKey="category"
          size="small"
          pagination={false}
          summary={() => total > 0 ? (
            <Table.Summary.Row style={{ background: '#EEF4F9' }}>
              <Table.Summary.Cell index={0}><b>एकूण</b></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right"><b>{catRows.reduce((s, r) => s + r.boys, 0)}</b></Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right"><b>{catRows.reduce((s, r) => s + r.girls, 0)}</b></Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right"><Text strong>{total}</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right"><b>100%</b></Table.Summary.Cell>
            </Table.Summary.Row>
          ) : null}
        />
      )}
    </div>
  );
}

// ── Report: New Admissions ───────────────────────────────────────────────────
function NewAdmissionsReport({ units, academicYears, sanstha, defaultYearId }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId]  = useState<string | undefined>(() => defaultYearId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (defaultYearId && !yearId) setYearId(defaultYearId); }, [defaultYearId]);

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['rpt-new-admissions', unitId, yearId],
    queryFn: () => reportApi.newAdmissions(unitId!, yearId!),
    enabled: !!unitId && !!yearId,
  });

  const unit = units.find((u: any) => u.id === unitId);
  const COLS = [
    { title: 'GR क्र.', key: 'gr_no' },
    { title: 'नाव', key: 'student_name' },
    { title: 'वडिलांचे नाव', key: 'father_name_mr' },
    { title: 'लिंग', key: 'gender', render: (v: string) => GENDER_LABEL[v] || v },
    { title: 'प्रवर्ग', key: 'category' },
    { title: 'इयत्ता', key: 'grade_label_mr' },
    { title: 'तुकडी', key: 'division_name' },
    { title: 'प्रवेश दिनांक', key: 'admission_date', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'फोन', key: 'phone' },
  ];
  const printRows = (rows as any[]).map(r => ({
    ...r,
    gender: GENDER_LABEL[r.gender] || r.gender,
    admission_date: r.admission_date ? dayjs(r.admission_date).format('DD/MM/YYYY') : '—',
  }));

  return (
    <div>
      <FilterBar
        count={(rows as any[]).length}
        onPrint={() => printERP('नवीन प्रवेश नोंदवही', COLS, printRows, sanstha, [], unit)}
        onExcel={() => exportToExcel(COLS, printRows, 'new-admissions')}
        printDisabled={!(rows as any[]).length}
      >
        <Select placeholder="शाळा *" style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="शैक्षणिक वर्ष *" style={{ width: 160 }} value={yearId} onChange={setYearId}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
      </FilterBar>

      {!unitId || !yearId
        ? <Alert type="info" showIcon message="शाळा व शैक्षणिक वर्ष निवडा" />
        : (
          <Table
            dataSource={rows as any[]}
            loading={isFetching}
            columns={COLS.map(c => ({ title: c.title, dataIndex: c.key, key: c.key, render: (c as any).render }))}
            rowKey={(r: any, i?: number) => `na_${r.gr_no}_${i}`}
            size="small" pagination={{ pageSize: 50, showTotal: t => `एकूण ${t}` }}
            scroll={{ x: 900 }}
          />
        )
      }
    </div>
  );
}

// ── Report: Fee Collection Summary ──────────────────────────────────────────
function FeeCollectionReport({ me, units, academicYears, sanstha, defaultYearId }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId]  = useState<string | undefined>(() => defaultYearId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (defaultYearId && !yearId) setYearId(defaultYearId); }, [defaultYearId]);

  const { data, isFetching } = useQuery({
    queryKey: ['rpt-fee-collection', me.sansthaId, unitId, yearId],
    queryFn: () => reportApi.feeCollection(me.sansthaId, { unitId, academicYearId: yearId }),
    enabled: !!me.sansthaId,
  });

  const modeRows = data
    ? Object.entries(data.byMode).map(([mode, amt]) => ({ mode: PAY_MODE_LABEL[mode] || mode, amt }))
    : [];
  const unitRows = data
    ? Object.entries(data.byUnit).map(([uid, amt]) => ({
        unitId: uid,
        nameMr: units.find((u: any) => u.id === uid)?.nameMr || uid,
        amt,
      }))
    : [];

  const UNIT_COLS = [
    { title: 'शाळा', key: 'nameMr' },
    { title: 'संकलन (₹)', key: 'amt', align: 'right' as const },
  ];

  return (
    <div>
      <FilterBar
        onPrint={() => {
          if (!data) return;
          const selectedYear = academicYears.find((y: any) => y.id === yearId);
          const filters: { label: string; value: string }[] = [];
          if (unitId) {
            const u = units.find((u: any) => u.id === unitId);
            if (u) filters.push({ label: 'शाळा', value: u.nameMr });
          }
          downloadFeeSummary({
            totalCollected: data.totalCollected,
            count: data.count,
            byMode: data.byMode as Record<string, number>,
            byUnit: data.byUnit as Record<string, number>,
            unitNames: Object.fromEntries(units.map((u: any) => [u.id, u.nameMr])),
            sanstha,
            unit: units.find((u: any) => u.id === unitId),
            academicYearLabel: selectedYear?.labelMr || selectedYear?.labelEn,
            userName: me?.nameMr || me?.email,
            filters,
          });
        }}
        onExcel={() => exportToExcel(UNIT_COLS, unitRows.map(r => ({ ...r, amt: +(r.amt as any) })), 'fee-collection')}
        printDisabled={!data}
      >
        <Select placeholder="शाळा (सर्व)" allowClear style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="शैक्षणिक वर्ष (सर्व)" allowClear style={{ width: 160 }} value={yearId} onChange={setYearId}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
      </FilterBar>

      {isFetching ? <Spin /> : data ? (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8}>
              <Statistic title="एकूण संकलन" prefix="₹" value={data.totalCollected}
                valueStyle={{ color: '#27AE60', fontWeight: 700 }} />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="एकूण पावत्या" value={data.count} />
            </Col>
            {data.totalCollected > 0 && (
              <Col xs={12} md={8}>
                <Statistic title="सरासरी / पावती" prefix="₹"
                  value={Math.round(data.totalCollected / data.count)}
                  valueStyle={{ color: '#1A3A5C' }} />
              </Col>
            )}
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Card title="पद्धतनिहाय संकलन" size="small" style={{ marginBottom: 12 }}>
                <Table dataSource={modeRows} size="small" pagination={false}
                  columns={[
                    { title: 'पद्धत', dataIndex: 'mode', key: 'mode' },
                    { title: 'रक्कम (₹)', dataIndex: 'amt', key: 'amt', align: 'right' as const,
                      render: (v: any) => <Text strong>₹{Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text> },
                  ]}
                  rowKey="mode"
                  summary={() => modeRows.length > 0 ? (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}><b>एकूण</b></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong style={{ color: '#27AE60' }}>
                          ₹{modeRows.reduce((s, r: any) => s + Number(r.amt), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  ) : null}
                />
              </Card>
            </Col>
            <Col xs={24} md={14}>
              <Card title="शाळानिहाय संकलन" size="small">
                <Table dataSource={unitRows} size="small" pagination={false}
                  columns={[
                    { title: 'शाळा', dataIndex: 'nameMr', key: 'name' },
                    { title: 'रक्कम (₹)', dataIndex: 'amt', key: 'amt', align: 'right' as const,
                      render: (v: any) => <Text strong>₹{Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text> },
                  ]}
                  rowKey="unitId"
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </div>
  );
}

// ── Report: Defaulters ───────────────────────────────────────────────────────
function DefaultersReport({ me, units, academicYears, sanstha, defaultYearId }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId]  = useState<string | undefined>(() => defaultYearId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (defaultYearId && !yearId) setYearId(defaultYearId); }, [defaultYearId]);

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['rpt-defaulters', me.sansthaId, unitId, yearId],
    queryFn: () => reportApi.defaulters({ unitId, academicYearId: yearId }),
    enabled: !!me.sansthaId,
  });

  const totalOutstanding = (rows as any[]).reduce((s: number, r: any) => s + parseFloat(r.outstanding || 0), 0);
  const unit = units.find((u: any) => u.id === unitId);

  const COLS = [
    { title: 'GR क्र.', key: 'gr_no' },
    { title: 'नाव', key: 'student_name' },
    { title: 'वडिलांचे नाव', key: 'father_name_mr' },
    { title: 'इयत्ता', key: 'grade_label_mr' },
    { title: 'तुकडी', key: 'division_name' },
    { title: 'शाळा', key: 'unit_name' },
    { title: 'एकूण मागणी', key: 'total_demand', align: 'right' as const },
    { title: 'भरले', key: 'total_paid', align: 'right' as const },
    { title: 'थकबाकी', key: 'outstanding', align: 'right' as const },
    { title: 'फोन', key: 'phone' },
  ];
  const printRows = (rows as any[]).map((r: any) => ({
    ...r,
    total_demand: `₹${Number(r.total_demand).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    total_paid: `₹${Number(r.total_paid).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    outstanding: `₹${Number(r.outstanding).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
  }));

  return (
    <div>
      <FilterBar
        count={(rows as any[]).length}
        onPrint={() => printERP('शुल्क थकबाकी यादी', COLS, printRows, sanstha, [
          { label: 'एकूण थकबाकी', value: `₹${totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
        ], unit)}
        onExcel={() => exportToExcel(COLS, printRows, 'defaulters')}
        printDisabled={!(rows as any[]).length}
      >
        <Select placeholder="शाळा (सर्व)" allowClear style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="शैक्षणिक वर्ष (सर्व)" allowClear style={{ width: 160 }} value={yearId} onChange={setYearId}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
      </FilterBar>

      {(rows as any[]).length > 0 && (
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col xs={12} md={8}>
            <Statistic title="थकबाकीदार विद्यार्थी" value={(rows as any[]).length}
              valueStyle={{ color: '#E74C3C', fontWeight: 700 }} />
          </Col>
          <Col xs={12} md={8}>
            <Statistic title="एकूण थकबाकी" prefix="₹" value={Math.round(totalOutstanding)}
              valueStyle={{ color: '#E74C3C', fontWeight: 700 }} />
          </Col>
        </Row>
      )}

      <Table
        dataSource={rows as any[]}
        loading={isFetching}
        columns={[
          { title: 'GR क्र.', dataIndex: 'gr_no', key: 'gr' },
          { title: 'नाव', dataIndex: 'student_name', key: 'name' },
          { title: 'वडिलांचे नाव', dataIndex: 'father_name_mr', key: 'fname' },
          { title: 'इयत्ता', dataIndex: 'grade_label_mr', key: 'grade' },
          { title: 'तुकडी', dataIndex: 'division_name', key: 'div' },
          { title: 'शाळा', dataIndex: 'unit_name', key: 'unit' },
          { title: 'एकूण मागणी', dataIndex: 'total_demand', key: 'demand', align: 'right' as const,
            render: (v: any) => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
          { title: 'भरले', dataIndex: 'total_paid', key: 'paid', align: 'right' as const,
            render: (v: any) => <Text style={{ color: '#27AE60' }}>₹{Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text> },
          { title: 'थकबाकी', dataIndex: 'outstanding', key: 'out', align: 'right' as const,
            render: (v: any) => <Text strong style={{ color: '#E74C3C' }}>₹{Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text> },
          { title: 'फोन', dataIndex: 'phone', key: 'phone' },
        ]}
        rowKey={(r: any, i?: number) => `def_${r.gr_no}_${i}`}
        size="small"
        pagination={{ pageSize: 50, showTotal: t => `एकूण ${t} थकबाकीदार` }}
        scroll={{ x: 1100 }}
        summary={() => (rows as any[]).length > 0 ? (
          <Table.Summary.Row style={{ background: '#FEF9F9' }}>
            <Table.Summary.Cell index={0} colSpan={6}><Text strong>एकूण</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="right">
              <Text strong>₹{(rows as any[]).reduce((s: number, r: any) => s + Number(r.total_demand), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={7} align="right">
              <Text strong style={{ color: '#27AE60' }}>₹{(rows as any[]).reduce((s: number, r: any) => s + Number(r.total_paid), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={8} align="right">
              <Text strong style={{ color: '#E74C3C' }}>₹{Math.round(totalOutstanding).toLocaleString('en-IN')}</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={9} />
          </Table.Summary.Row>
        ) : null}
      />
    </div>
  );
}

// ── Report: Receipt Register ─────────────────────────────────────────────────
function ReceiptRegisterReport({ units, academicYears, sanstha, defaultYearId }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId]     = useState<string | undefined>(() => defaultYearId);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  useEffect(() => { if (defaultYearId && !yearId) setYearId(defaultYearId); }, [defaultYearId]);
  const [payMode, setPayMode]   = useState<string>();

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['rpt-receipts', unitId, yearId, dateRange, payMode],
    queryFn: () => reportApi.dataFeePayments({
      unitId, academicYearId: yearId,
      dateFrom: dateRange?.[0], dateTo: dateRange?.[1], paymentMode: payMode,
    }),
    enabled: !!unitId,
  });

  const totalAmt = (rows as any[]).reduce((s: number, r: any) => s + parseFloat(r.amount || 0), 0);
  const unit = units.find((u: any) => u.id === unitId);

  const COLS = [
    { title: 'पावती क्र.', key: 'receipt_number' },
    { title: 'दिनांक', key: 'payment_date', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'विद्यार्थी', key: 'student_name' },
    { title: 'GR क्र.', key: 'gr_no' },
    { title: 'इयत्ता', key: 'grade_label_mr' },
    { title: 'तुकडी', key: 'division_name' },
    { title: 'रक्कम', key: 'amount', align: 'right' as const },
    { title: 'पद्धत', key: 'payment_mode', render: (v: string) => PAY_MODE_LABEL[v] || v },
    { title: 'धनादेश/UTR', key: 'cheque_number' },
    { title: 'बँक', key: 'bank_name_mr' },
    { title: 'शेरा', key: 'remarks' },
  ];
  const printRows = (rows as any[]).map((r: any) => ({
    ...r,
    payment_date: r.payment_date ? dayjs(r.payment_date).format('DD/MM/YYYY') : '—',
    amount: `₹${Number(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    payment_mode: PAY_MODE_LABEL[r.payment_mode] || r.payment_mode,
  }));

  return (
    <div>
      <FilterBar
        count={(rows as any[]).length}
        onPrint={() => printERP('शुल्क पावती नोंदवही', COLS, printRows, sanstha, [
          { label: 'एकूण रक्कम', value: `₹${totalAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
        ], unit)}
        onExcel={() => exportToExcel(COLS, printRows, 'receipt-register')}
        printDisabled={!(rows as any[]).length}
      >
        <Select placeholder="शाळा *" style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="शैक्षणिक वर्ष" allowClear style={{ width: 160 }} value={yearId} onChange={setYearId}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
        <RangePicker size="small" format="DD/MM/YYYY" placeholder={['सुरुवात', 'शेवट']}
          onChange={v => setDateRange(v ? [v[0]!.format('YYYY-MM-DD'), v[1]!.format('YYYY-MM-DD')] : null)} />
        <Select placeholder="पद्धत (सर्व)" allowClear style={{ width: 130 }} value={payMode} onChange={setPayMode}
          options={Object.entries(PAY_MODE_LABEL).map(([k, v]) => ({ value: k, label: v }))} />
      </FilterBar>

      {(rows as any[]).length > 0 && (
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col xs={12} md={6}><Statistic title="पावत्यांची संख्या" value={(rows as any[]).length} /></Col>
          <Col xs={12} md={6}>
            <Statistic title="एकूण संकलन" prefix="₹" value={Math.round(totalAmt)}
              valueStyle={{ color: '#27AE60', fontWeight: 700 }} />
          </Col>
        </Row>
      )}

      {!unitId ? <Alert type="info" showIcon message="शाळा निवडा" /> : (
        <Table
          dataSource={rows as any[]}
          loading={isFetching}
          columns={COLS.map(c => ({ title: c.title, dataIndex: c.key, key: c.key, align: (c as any).align, render: (c as any).render }))}
          rowKey={(r: any, i?: number) => `rcpt_${r.receipt_number}_${i}`}
          size="small"
          pagination={{ pageSize: 50, showTotal: t => `एकूण ${t}` }}
          scroll={{ x: 1100 }}
          summary={() => (rows as any[]).length > 0 ? (
            <Table.Summary.Row style={{ background: '#EEF4F9' }}>
              <Table.Summary.Cell index={0} colSpan={6}><b>एकूण</b></Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <Text strong style={{ color: '#27AE60' }}>
                  ₹{totalAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} colSpan={4} />
            </Table.Summary.Row>
          ) : null}
        />
      )}
    </div>
  );
}

// ── Report: Day Book ─────────────────────────────────────────────────────────
function DayBookReport({ units, sanstha }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [date, setDate]     = useState<string>(dayjs().format('YYYY-MM-DD'));

  const { data, isFetching } = useQuery({
    queryKey: ['rpt-daybook', unitId, date],
    queryFn: () => reportApi.dayBook(unitId!, date),
    enabled: !!unitId && !!date,
  });

  const rows = data?.rows || [];
  const unit = units.find((u: any) => u.id === unitId);

  const COLS = [
    { title: 'पावती क्र.', key: 'receipt_number' },
    { title: 'विद्यार्थी', key: 'student_name' },
    { title: 'GR क्र.', key: 'gr_no' },
    { title: 'इयत्ता', key: 'grade_label_mr' },
    { title: 'तुकडी', key: 'division_name' },
    { title: 'रक्कम', key: 'amount', align: 'right' as const },
    { title: 'पद्धत', key: 'payment_mode', render: (v: string) => PAY_MODE_LABEL[v] || v },
    { title: 'धनादेश/UTR', key: 'cheque_number' },
    { title: 'बँक', key: 'bank_name_mr' },
    { title: 'शेरा', key: 'remarks' },
  ];
  const printRows = rows.map((r: any) => ({
    ...r,
    amount: `₹${Number(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    payment_mode: PAY_MODE_LABEL[r.payment_mode] || r.payment_mode,
  }));

  return (
    <div>
      <FilterBar
        count={rows.length}
        onPrint={() => printERP(
          `दैनिक रोखवही — ${dayjs(date).format('DD/MM/YYYY')}`,
          COLS, printRows, sanstha,
          [{ label: 'दिनांक', value: dayjs(date).format('DD/MM/YYYY') },
           { label: 'एकूण संकलन', value: `₹${(data?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` }],
          unit,
        )}
        onExcel={() => exportToExcel(COLS, printRows, `day-book-${date}`)}
        printDisabled={!rows.length}
      >
        <Select placeholder="शाळा *" style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <DatePicker value={dayjs(date)} format="DD/MM/YYYY"
          onChange={v => v && setDate(v.format('YYYY-MM-DD'))} />
      </FilterBar>

      {data && (
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col xs={12} md={6}><Statistic title="पावत्यांची संख्या" value={data.count} /></Col>
          <Col xs={12} md={6}>
            <Statistic title="आजचे एकूण संकलन" prefix="₹"
              value={Math.round(data.total || 0)}
              valueStyle={{ color: '#27AE60', fontWeight: 700 }} />
          </Col>
        </Row>
      )}

      {!unitId ? <Alert type="info" showIcon message="शाळा निवडा" /> : (
        rows.length === 0 && !isFetching
          ? <Alert type="info" showIcon message={`${dayjs(date).format('DD/MM/YYYY')} रोजी कोणतेही शुल्क संकलन नाही`} />
          : (
            <Table
              dataSource={rows}
              loading={isFetching}
              columns={COLS.map(c => ({ title: c.title, dataIndex: c.key, key: c.key, align: (c as any).align, render: (c as any).render }))}
              rowKey={(r: any, i?: number) => `db_${r.receipt_number}_${i}`}
              size="small"
              pagination={false}
              summary={() => rows.length > 0 ? (
                <Table.Summary.Row style={{ background: '#EEF4F9' }}>
                  <Table.Summary.Cell index={0} colSpan={5}><b>एकूण</b></Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong style={{ color: '#27AE60' }}>₹{(data?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} colSpan={4} />
                </Table.Summary.Row>
              ) : null}
            />
          )
      )}
    </div>
  );
}

// ── Report: Staff Register ───────────────────────────────────────────────────
function StaffRegisterReport({ units, sanstha }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [empType, setEmpType] = useState<string>();

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['rpt-staff', unitId, empType],
    queryFn: () => reportApi.dataStaff({ unitId, employeeType: empType }),
    enabled: true,
  });

  const unit = units.find((u: any) => u.id === unitId);
  const COLS = [
    { title: 'नाव', key: 'name_mr' },
    { title: 'पद', key: 'designation_mr' },
    { title: 'पात्रता', key: 'qualification_mr' },
    { title: 'विषय', key: 'subject_mr' },
    { title: 'प्रकार', key: 'employee_type', render: (v: string) => EMP_TYPE_LABEL[v] || v },
    { title: 'शाळा', key: 'unit_name' },
    { title: 'रुजू दिनांक', key: 'joining_date', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'फोन', key: 'phone' },
    { title: 'ईमेल', key: 'email' },
  ];
  const printRows = (rows as any[]).map((r: any) => ({
    ...r,
    employee_type: EMP_TYPE_LABEL[r.employee_type] || r.employee_type,
    joining_date: r.joining_date ? dayjs(r.joining_date).format('DD/MM/YYYY') : '—',
  }));

  return (
    <div>
      <FilterBar
        count={(rows as any[]).length}
        onPrint={() => printERP('कर्मचारी नोंदवही', COLS, printRows, sanstha, [], unit)}
        onExcel={() => exportToExcel(COLS, printRows, 'staff-register')}
        printDisabled={!(rows as any[]).length}
      >
        <Select placeholder="शाळा (सर्व)" allowClear style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="प्रकार (सर्व)" allowClear style={{ width: 160 }} value={empType} onChange={setEmpType}
          options={Object.entries(EMP_TYPE_LABEL).map(([k, v]) => ({ value: k, label: v }))} />
      </FilterBar>

      <Table
        dataSource={rows as any[]}
        loading={isFetching}
        columns={COLS.map(c => ({ title: c.title, dataIndex: c.key, key: c.key, render: (c as any).render }))}
        rowKey={(r: any, i?: number) => `st_${r.name_mr}_${i}`}
        size="small"
        pagination={{ pageSize: 50, showTotal: t => `एकूण ${t}` }}
        scroll={{ x: 1000 }}
      />
    </div>
  );
}

// ── Report: Salary Summary ───────────────────────────────────────────────────
function SalaryReport({ me }: any) {
  const MONTHS = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
  const [month, setMonth] = useState<number>();
  const [year, setYear]   = useState<number>(dayjs().year());

  const { data, isFetching } = useQuery({
    queryKey: ['rpt-salary', me.sansthaId, month, year],
    queryFn: () => reportApi.salary(me.sansthaId, { month, year }),
    enabled: !!me.sansthaId,
  });

  return (
    <div>
      <FilterBar printDisabled={true}>
        <Select placeholder="महिना (सर्व)" allowClear style={{ width: 150 }} value={month} onChange={setMonth}
          options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} showSearch={false} />
        <Select value={year} style={{ width: 100 }} onChange={setYear}
          options={[2024, 2025, 2026, 2027].map(y => ({ value: y, label: y }))} />
      </FilterBar>

      {isFetching ? <Spin /> : data ? (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}><Statistic title="एकूण वेतन स्लिप" value={data.count} /></Col>
          <Col xs={12} sm={8}><Statistic title="एकूण वेतन" prefix="₹" value={Math.round(data.totalGross)}
            valueStyle={{ color: '#1A3A5C' }} /></Col>
          <Col xs={12} sm={8}><Statistic title="एकूण कपात" prefix="₹" value={Math.round(data.totalDeductions)}
            valueStyle={{ color: '#E74C3C' }} /></Col>
          <Col xs={12} sm={8}><Statistic title="निव्वळ वेतन" prefix="₹" value={Math.round(data.totalNet)}
            valueStyle={{ color: '#27AE60', fontWeight: 700 }} /></Col>
          <Col xs={12} sm={8}><Statistic title="दिलेले" value={data.paid}
            valueStyle={{ color: '#27AE60' }} /></Col>
          <Col xs={12} sm={8}><Statistic title="प्रलंबित" value={data.pending}
            valueStyle={{ color: '#E67E22' }} /></Col>
        </Row>
      ) : null}
    </div>
  );
}

// ── Report: Exam Marks ───────────────────────────────────────────────────────
function ExamMarksReport({ me, units, academicYears, sanstha, defaultYearId }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId]   = useState<string | undefined>(() => defaultYearId);
  const [examId, setExamId]   = useState<string>();
  useEffect(() => { if (defaultYearId && !yearId) setYearId(defaultYearId); }, [defaultYearId]);
  const [gradeId, setGradeId] = useState<string>();
  const [divId, setDivId]     = useState<string>();

  const { data: exams = [] } = useQuery({
    queryKey: ['exams-filter', me?.sansthaId, unitId, yearId],
    queryFn: () => examApi.findBySanstha(me!.sansthaId, { unitId, academicYearId: yearId }),
    enabled: !!me?.sansthaId,
  });

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['rpt-exam-marks', unitId, yearId, examId, gradeId, divId],
    queryFn: () => reportApi.dataExamMarks({ unitId, academicYearId: yearId, examId, gradeId, divisionId: divId }),
    enabled: !!unitId,
  });

  const unit = units.find((u: any) => u.id === unitId);
  const COLS = [
    { title: 'रोल', key: 'roll_no' },
    { title: 'नाव', key: 'student_name' },
    { title: 'GR क्र.', key: 'gr_no' },
    { title: 'इयत्ता', key: 'grade_label_mr' },
    { title: 'तुकडी', key: 'division_name' },
    { title: 'परीक्षा', key: 'exam_name' },
    { title: 'लेखी', key: 'theory_marks', align: 'right' as const },
    { title: 'अंतर्गत', key: 'internal_marks', align: 'right' as const },
    { title: 'प्रात्यक्षिक', key: 'practical_marks', align: 'right' as const },
    { title: 'एकूण', key: 'total_marks', align: 'right' as const },
    { title: 'श्रेणी', key: 'grade_letter', align: 'center' as const, render: (v: string) =>
      v ? <Tag color={['A+','A'].includes(v) ? 'green' : v === 'B' ? 'blue' : v === 'C' ? 'orange' : 'red'}>{v}</Tag> : '—'
    },
    { title: 'निकाल', key: 'status', render: (v: string) =>
      v === 'pass' ? <Tag color="green">उत्तीर्ण</Tag> : v === 'fail' ? <Tag color="red">नापास</Tag> : <Tag>{v || '—'}</Tag>
    },
  ];

  return (
    <div>
      <FilterBar
        count={(rows as any[]).length}
        onPrint={() => printERP('परीक्षा गुणपत्रक', COLS, rows as any[], sanstha, [], unit)}
        onExcel={() => exportToExcel(COLS, rows as any[], 'exam-marks')}
        printDisabled={!(rows as any[]).length}
      >
        <Select placeholder="शाळा *" style={{ width: 200 }} value={unitId} onChange={v => { setUnitId(v); setGradeId(undefined); setDivId(undefined); }}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="शैक्षणिक वर्ष" allowClear style={{ width: 160 }} value={yearId} onChange={setYearId}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
        <Select placeholder="परीक्षा (सर्व)" allowClear style={{ width: 180 }} value={examId} onChange={setExamId}
          options={(exams as any[]).map((e: any) => ({ value: e.id, label: e.nameMr }))} />
        {unitId && (
          <ClassDivisionSelect unitId={unitId} academicYearId={yearId}
            gradeValue={gradeId} divisionValue={divId}
            onGradeChange={v => { setGradeId(v); setDivId(undefined); }}
            onDivisionChange={v => setDivId(v || undefined)} />
        )}
      </FilterBar>

      {!unitId ? <Alert type="info" showIcon message="शाळा निवडा" /> : (
        <Table
          dataSource={rows as any[]}
          loading={isFetching}
          columns={COLS.map(c => ({ title: c.title, dataIndex: c.key, key: c.key, align: (c as any).align, render: (c as any).render }))}
          rowKey={(r: any, i?: number) => `em_${r.gr_no}_${r.exam_name}_${i}`}
          size="small"
          pagination={{ pageSize: 50, showTotal: t => `एकूण ${t}` }}
          scroll={{ x: 1000 }}
        />
      )}
    </div>
  );
}

// ── Report: Pass/Fail Analysis ───────────────────────────────────────────────
function PassFailReport({ me, units, academicYears, sanstha, defaultYearId }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId]  = useState<string | undefined>(() => defaultYearId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (defaultYearId && !yearId) setYearId(defaultYearId); }, [defaultYearId]);
  const [examId, setExamId]  = useState<string>();

  const { data: exams = [] } = useQuery({
    queryKey: ['exams-pf', me?.sansthaId, unitId, yearId],
    queryFn: () => examApi.findBySanstha(me!.sansthaId, { unitId, academicYearId: yearId }),
    enabled: !!me?.sansthaId,
  });

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['rpt-pass-fail', unitId, yearId, examId],
    queryFn: () => reportApi.passFailAnalysis(unitId!, yearId!, examId),
    enabled: !!unitId && !!yearId,
  });

  const unit = units.find((u: any) => u.id === unitId);
  const totalStudents = (rows as any[]).reduce((s: number, r: any) => s + parseInt(r.total || 0), 0);
  const totalPassed   = (rows as any[]).reduce((s: number, r: any) => s + parseInt(r.passed || 0), 0);
  const totalFailed   = (rows as any[]).reduce((s: number, r: any) => s + parseInt(r.failed || 0), 0);

  const COLS = [
    { title: 'परीक्षा', key: 'exam_name' },
    { title: 'इयत्ता', key: 'grade_label_mr' },
    { title: 'एकूण', key: 'total', align: 'right' as const },
    { title: 'उत्तीर्ण', key: 'passed', align: 'right' as const },
    { title: 'नापास', key: 'failed', align: 'right' as const },
    { title: 'उत्तीर्ण %', key: 'pass_pct', align: 'right' as const },
    { title: 'सरासरी गुण', key: 'avg_marks', align: 'right' as const },
    { title: 'सर्वाधिक', key: 'max_marks', align: 'right' as const },
    { title: 'किमान', key: 'min_marks', align: 'right' as const },
  ];

  return (
    <div>
      <FilterBar
        count={(rows as any[]).length > 0 ? totalStudents : undefined}
        onPrint={() => printERP('निकाल विश्लेषण', COLS,
          (rows as any[]).map((r: any) => ({
            ...r,
            pass_pct: r.total ? `${Math.round((r.passed / r.total) * 100)}%` : '—',
          })), sanstha, [], unit)}
        onExcel={() => exportToExcel(COLS, (rows as any[]).map((r: any) => ({
          ...r, pass_pct: r.total ? Math.round((r.passed / r.total) * 100) : 0,
        })), 'pass-fail')}
        printDisabled={!(rows as any[]).length}
      >
        <Select placeholder="शाळा *" style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="शैक्षणिक वर्ष *" style={{ width: 160 }} value={yearId} onChange={setYearId}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
        <Select placeholder="परीक्षा (सर्व)" allowClear style={{ width: 180 }} value={examId} onChange={setExamId}
          options={(exams as any[]).map((e: any) => ({ value: e.id, label: e.nameMr }))} />
      </FilterBar>

      {(rows as any[]).length > 0 && (
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col xs={8}><Statistic title="एकूण विद्यार्थी" value={totalStudents} /></Col>
          <Col xs={8}><Statistic title="उत्तीर्ण" value={totalPassed}
            valueStyle={{ color: '#27AE60' }} /></Col>
          <Col xs={8}><Statistic title="नापास" value={totalFailed}
            valueStyle={{ color: '#E74C3C' }} /></Col>
        </Row>
      )}

      {!unitId || !yearId ? <Alert type="info" showIcon message="शाळा व शैक्षणिक वर्ष निवडा" /> : (
        <Table
          dataSource={rows as any[]}
          loading={isFetching}
          columns={[
            { title: 'परीक्षा', dataIndex: 'exam_name', key: 'exam' },
            { title: 'इयत्ता', dataIndex: 'grade_label_mr', key: 'grade' },
            { title: 'एकूण', dataIndex: 'total', key: 'total', align: 'right' as const },
            { title: 'उत्तीर्ण', dataIndex: 'passed', key: 'passed', align: 'right' as const,
              render: (v: any) => <Text style={{ color: '#27AE60' }}>{v}</Text> },
            { title: 'नापास', dataIndex: 'failed', key: 'failed', align: 'right' as const,
              render: (v: any) => <Text style={{ color: '#E74C3C' }}>{v}</Text> },
            { title: 'उत्तीर्ण %', key: 'pct', align: 'right' as const,
              render: (_: any, r: any) => {
                const pct = r.total ? Math.round((r.passed / r.total) * 100) : 0;
                return (
                  <Space>
                    <Text strong style={{ color: pct >= 80 ? '#27AE60' : pct >= 50 ? '#E67E22' : '#E74C3C' }}>{pct}%</Text>
                    <Progress percent={pct} size="small" style={{ width: 50, margin: 0 }} showInfo={false}
                      strokeColor={pct >= 80 ? '#27AE60' : pct >= 50 ? '#E67E22' : '#E74C3C'} />
                  </Space>
                );
              } },
            { title: 'सरासरी', dataIndex: 'avg_marks', key: 'avg', align: 'right' as const },
            { title: 'जास्तीत जास्त', dataIndex: 'max_marks', key: 'max', align: 'right' as const },
            { title: 'कमीत कमी', dataIndex: 'min_marks', key: 'min', align: 'right' as const },
          ]}
          rowKey={(r: any, i?: number) => `pf_${r.grade_label_mr}_${r.exam_name}_${i}`}
          size="small"
          pagination={false}
          summary={() => (rows as any[]).length > 1 ? (
            <Table.Summary.Row style={{ background: '#EEF4F9' }}>
              <Table.Summary.Cell index={0} colSpan={2}><b>एकूण / सरासरी</b></Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right"><b>{totalStudents}</b></Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right"><Text strong style={{ color: '#27AE60' }}>{totalPassed}</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right"><Text strong style={{ color: '#E74C3C' }}>{totalFailed}</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <b>{totalStudents ? Math.round((totalPassed / totalStudents) * 100) : 0}%</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} colSpan={3} />
            </Table.Summary.Row>
          ) : null}
        />
      )}
    </div>
  );
}

// ── Report: Attendance ───────────────────────────────────────────────────────
function AttendanceReport({ units }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['rpt-attendance', unitId, dateRange],
    queryFn: () => reportApi.attendance(unitId!, dateRange![0], dateRange![1]),
    enabled: !!unitId && !!dateRange,
  });

  return (
    <div>
      <FilterBar printDisabled={true}>
        <Select placeholder="शाळा *" style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <RangePicker format="DD/MM/YYYY" placeholder={['सुरुवात', 'शेवट']}
          onChange={v => setDateRange(v ? [v[0]!.format('YYYY-MM-DD'), v[1]!.format('YYYY-MM-DD')] : null)} />
      </FilterBar>

      {!unitId || !dateRange
        ? <Alert type="info" showIcon message="शाळा आणि तारखांची श्रेणी निवडा" />
        : isFetching ? <Spin />
        : data ? (
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={4}><Statistic title="एकूण नोंदी" value={data.total} /></Col>
            <Col xs={12} sm={4}><Statistic title="उपस्थित (P)" value={data.present}
              valueStyle={{ color: '#27AE60' }} /></Col>
            <Col xs={12} sm={4}><Statistic title="अनुपस्थित (A)" value={data.absent}
              valueStyle={{ color: '#E74C3C' }} /></Col>
            <Col xs={12} sm={4}><Statistic title="सुट्टी (H)" value={data.holiday} /></Col>
            <Col xs={12} sm={4}><Statistic title="रजा (L)" value={data.leave} /></Col>
            <Col xs={12} sm={4}>
              <Statistic title="उपस्थिती %" value={data.percentage} suffix="%"
                valueStyle={{ color: data.percentage >= 75 ? '#27AE60' : '#E74C3C', fontWeight: 700 }} />
            </Col>
          </Row>
        ) : null
      }
    </div>
  );
}

// ── Report: Certificate Register ─────────────────────────────────────────────
function CertRegisterReport({ me, units, sanstha }: any) {
  const [unitId, setUnitId] = useUnitState();
  const [certType, setCertType] = useState<string>();

  const { data: certs = [], isFetching } = useQuery({
    queryKey: ['rpt-certs', me.sansthaId, unitId],
    queryFn: () => certificateApi.findBySanstha(me.sansthaId, unitId),
    enabled: !!me.sansthaId,
  });

  // Fetch students to resolve UUIDs to names
  // Use sansthaId from actual cert data (cert controller uses JWT sansthaId, not me.sansthaId)
  const certSansthaId = (certs as any[])[0]?.sansthaId || me.sansthaId;
  const { data: allStudents = [] } = useQuery({
    queryKey: ['rpt-students-cert', certSansthaId, unitId],
    queryFn: () => studentApi.findBySanstha(certSansthaId, { unitId }),
    enabled: !!certSansthaId,
  });
  const studentMap = useMemo(() => {
    const m: Record<string, string> = {};
    (allStudents as any[]).forEach((s: any) => { m[s.id] = s.nameMr || s.name || s.id; });
    return m;
  }, [allStudents]);

  const rows = useMemo(() => {
    let r = certs as any[];
    if (certType) r = r.filter((c: any) => c.certificateType === certType);
    return r;
  }, [certs, certType]);

  const unit = units.find((u: any) => u.id === unitId);

  const getStudentName = (r: any) => r.student?.nameMr || studentMap[r.studentId] || r.studentId;

  const COLS = [
    { title: 'प्रमाणपत्र क्र.', key: 'certificateNumber' },
    { title: 'प्रकार', key: 'certificateType', render: (v: string) => CERT_TYPE_LABEL[v] || v },
    { title: 'विद्यार्थी', key: 'studentName', render: (_: any, r: any) => getStudentName(r) },
    { title: 'दिनांक', key: 'issueDate', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'स्थिती', key: 'status', render: (v: string) =>
      <Tag color={STATUS_COLOR[v] || 'default'}>{v === 'issued' ? 'दिलेली' : v === 'cancelled' ? 'रद्द' : v}</Tag> },
    { title: 'उद्देश', key: 'purposeMr' },
    { title: 'दिलेले', key: 'issuedBy' },
  ];

  const typeSummary = useMemo(() => {
    const m: Record<string, number> = {};
    (rows as any[]).forEach((c: any) => {
      const t = c.certificateType || 'other';
      m[t] = (m[t] || 0) + 1;
    });
    return m;
  }, [rows]);

  return (
    <div>
      <FilterBar
        count={rows.length}
        onPrint={() => printERP('प्रमाणपत्र नोंदवही', COLS.slice(0, 5),
          rows.map((r: any) => ({
            certificateNumber: r.certificateNumber,
            certificateType: CERT_TYPE_LABEL[r.certificateType] || r.certificateType,
            studentName: getStudentName(r),
            issueDate: r.issueDate ? dayjs(r.issueDate).format('DD/MM/YYYY') : '—',
            status: r.status === 'issued' ? 'दिलेली' : r.status === 'cancelled' ? 'रद्द' : r.status,
          })), sanstha, [], unit)}
        onExcel={() => exportToExcel(COLS.slice(0, 5), rows.map((r: any) => ({
          certificateNumber: r.certificateNumber,
          certificateType: CERT_TYPE_LABEL[r.certificateType] || r.certificateType,
          studentName: getStudentName(r),
          issueDate: r.issueDate ? dayjs(r.issueDate).format('DD/MM/YYYY') : '—',
          status: r.status === 'issued' ? 'दिलेली' : r.status === 'cancelled' ? 'रद्द' : r.status,
        })), 'cert-register')}
        printDisabled={!rows.length}
      >
        <Select placeholder="शाळा (सर्व)" allowClear style={{ width: 200 }} value={unitId} onChange={setUnitId}
          options={units.map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        <Select placeholder="प्रकार (सर्व)" allowClear style={{ width: 180 }} value={certType} onChange={setCertType}
          options={Object.entries(CERT_TYPE_LABEL).map(([k, v]) => ({ value: k, label: v }))} />
      </FilterBar>

      {rows.length > 0 && (
        <Row gutter={8} style={{ marginBottom: 12 }} wrap>
          {Object.entries(typeSummary).map(([type, cnt]) => (
            <Col key={type}>
              <Tag color="purple" style={{ fontSize: 12, padding: '4px 10px' }}>
                {CERT_TYPE_LABEL[type] || type}: {cnt}
              </Tag>
            </Col>
          ))}
        </Row>
      )}

      <Table
        dataSource={rows}
        loading={isFetching}
        columns={[
          { title: 'प्रमाणपत्र क्र.', dataIndex: 'certificateNumber', key: 'num' },
          { title: 'प्रकार', dataIndex: 'certificateType', key: 'type',
            render: (v: string) => <Tag color="purple">{CERT_TYPE_LABEL[v] || v}</Tag> },
          { title: 'विद्यार्थी', key: 'student', render: (_: any, r: any) => getStudentName(r) },
          { title: 'दिनांक', dataIndex: 'issueDate', key: 'date',
            render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
          { title: 'स्थिती', dataIndex: 'status', key: 'status',
            render: (v: string) => <Tag color={STATUS_COLOR[v] || 'default'}>
              {v === 'issued' ? 'दिलेली' : v === 'cancelled' ? 'रद्द' : v}
            </Tag> },
          { title: 'उद्देश', dataIndex: 'purposeMr', key: 'purpose' },
        ]}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 50, showTotal: t => `एकूण ${t}` }}
      />
    </div>
  );
}

// ── Custom Report Panel ──────────────────────────────────────────────────────
const CUSTOM_REPORT_TYPES = [
  { value: 'students',    label: 'विद्यार्थी' },
  { value: 'fee_demands', label: 'शुल्क मागण्या' },
  { value: 'fee_payments',label: 'शुल्क पावत्या' },
  { value: 'staff',       label: 'कर्मचारी' },
];

const FIELD_MAP: Record<string, { key: string; title: string; align?: string }[]> = {
  students:     [
    { key: 'gr_no',         title: 'GR क्र.' },
    { key: 'student_name',  title: 'नाव' },
    { key: 'father_name_mr',title: 'वडिलांचे नाव' },
    { key: 'mother_name_mr',title: 'आईचे नाव' },
    { key: 'gender',        title: 'लिंग' },
    { key: 'date_of_birth', title: 'जन्मतारीख' },
    { key: 'category',      title: 'प्रवर्ग' },
    { key: 'grade_label_mr',title: 'इयत्ता' },
    { key: 'division_name', title: 'तुकडी' },
    { key: 'address_mr',    title: 'पत्ता' },
    { key: 'phone',         title: 'मोबाइल' },
    { key: 'roll_no',       title: 'रोल' },
  ],
  fee_demands:  [
    { key: 'student_name',  title: 'विद्यार्थी' },
    { key: 'gr_no',         title: 'GR क्र.' },
    { key: 'grade_label_mr',title: 'इयत्ता' },
    { key: 'fee_name',      title: 'शुल्क' },
    { key: 'fee_type',      title: 'प्रकार' },
    { key: 'net_amount',    title: 'देय रक्कम', align: 'right' },
    { key: 'paid_amount',   title: 'भरले', align: 'right' },
    { key: 'outstanding',   title: 'बाकी', align: 'right' },
    { key: 'due_date',      title: 'देय तारीख' },
    { key: 'status',        title: 'स्थिती' },
  ],
  fee_payments: [
    { key: 'receipt_number',title: 'पावती क्र.' },
    { key: 'student_name',  title: 'विद्यार्थी' },
    { key: 'gr_no',         title: 'GR क्र.' },
    { key: 'grade_label_mr',title: 'इयत्ता' },
    { key: 'amount',        title: 'रक्कम', align: 'right' },
    { key: 'payment_date',  title: 'तारीख' },
    { key: 'payment_mode',  title: 'पद्धत' },
    { key: 'cheque_number', title: 'धनादेश/UTR' },
  ],
  staff:        [
    { key: 'name_mr',        title: 'नाव' },
    { key: 'designation_mr', title: 'पद' },
    { key: 'qualification_mr',title: 'पात्रता' },
    { key: 'employee_type',  title: 'प्रकार' },
    { key: 'phone',          title: 'फोन' },
    { key: 'email',          title: 'ईमेल' },
    { key: 'joining_date',   title: 'सेवाप्रारंभ' },
    { key: 'unit_name',      title: 'शाळा' },
  ],
};

function CustomReportPanel({ units, academicYears, sanstha }: any) {
  const { user: me } = useAuthStore();
  const userName = me?.nameMr || me?.email || 'वापरकर्ता';
  const [reportType, setReportType] = useState('students');
  const [selectedFields, setSelectedFields] = useState<string[]>(['student_name', 'gr_no', 'father_name_mr']);
  const [unitId, setUnitId] = useUnitState();
  const [yearId, setYearId] = useState<string>();
  const unit = (units || []).find((u: any) => u.id === unitId);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  const allFields = FIELD_MAP[reportType] || [];

  // Load saved templates
  const { data: templates = [] } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => reportApi.findTemplates(),
    staleTime: 60_000,
  });

  const runReport = async () => {
    if (!unitId) { message.warning('शाळा निवडा'); return; }
    setRunning(true);
    try {
      let data: any[] = [];
      if (reportType === 'students') {
        data = await reportApi.dataStudents({ unitId, academicYearId: yearId });
      } else if (reportType === 'fee_demands') {
        data = await reportApi.dataFeeDemands({ unitId, academicYearId: yearId });
      } else if (reportType === 'fee_payments') {
        data = await reportApi.dataFeePayments({ unitId, academicYearId: yearId });
      } else if (reportType === 'staff') {
        data = await reportApi.dataStaff({ unitId });
      }
      setRows(data);
    } catch { message.error('डेटा मिळवता आला नाही'); }
    finally { setRunning(false); }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) { message.warning('टेम्पलेटचे नाव द्या'); return; }
    try {
      await reportApi.createTemplate({ name: templateName, type: reportType, fields: selectedFields, filters: { unitId, yearId } });
      message.success('Template जतन झाले');
      setSaveModalOpen(false); setTemplateName('');
    } catch { message.error('जतन झाले नाही'); }
  };

  const loadTemplate = async (tpl: any) => {
    setReportType(tpl.type || 'students');
    setSelectedFields(tpl.fields || []);
    message.success(`"${tpl.name}" Template लोड झाले`);
  };

  const activeCols = allFields.filter(f => selectedFields.includes(f.key));

  return (
    <div>
      <Row gutter={[16, 12]}>
        {/* Left: Builder */}
        <Col span={8}>
          <div style={{ background: '#F7FAFD', border: '1px solid #DDE8F4', borderRadius: 8, padding: 14 }}>
            <Text strong style={{ color: '#1A3A5C', display: 'block', marginBottom: 10 }}>अहवाल प्रकार निवडा</Text>
            <Select
              value={reportType}
              onChange={v => { setReportType(v); setSelectedFields(FIELD_MAP[v]?.slice(0, 3).map(f => f.key) || []); }}
              options={CUSTOM_REPORT_TYPES}
              style={{ width: '100%', marginBottom: 10 }}
            />
            <Select placeholder="शाळा निवडा *" value={unitId} onChange={setUnitId}
              options={(units || []).map((u: any) => ({ value: u.id, label: u.nameMr }))}
              style={{ width: '100%', marginBottom: 8 }} allowClear />
            <Select placeholder="शैक्षणिक वर्ष" value={yearId} onChange={setYearId}
              options={(academicYears || []).map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))}
              style={{ width: '100%', marginBottom: 12 }} allowClear />

            <Text strong style={{ color: '#1A3A5C', display: 'block', marginBottom: 8 }}>स्तंभ निवडा</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allFields.map(f => (
                <Checkbox
                  key={f.key}
                  checked={selectedFields.includes(f.key)}
                  onChange={e => {
                    if (e.target.checked) setSelectedFields(prev => [...prev, f.key]);
                    else setSelectedFields(prev => prev.filter(x => x !== f.key));
                  }}
                  style={{ fontSize: 12 }}
                >
                  {f.title}
                </Checkbox>
              ))}
            </div>

            <Space style={{ marginTop: 14 }}>
              <Button type="primary" icon={<PlayCircleOutlined />} loading={running} onClick={runReport}>
                अहवाल चालवा
              </Button>
              <Button icon={<SaveOutlined />} onClick={() => setSaveModalOpen(true)}>
                Template जतन करा
              </Button>
            </Space>
          </div>

          {/* Saved templates */}
          {(templates as any[]).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ color: '#1A3A5C', fontSize: 12 }}>जतन केलेले Templates</Text>
              {(templates as any[]).map((tpl: any) => (
                <div key={tpl.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 10px', borderBottom: '1px solid #eee', fontSize: 12,
                }}>
                  <Text style={{ fontSize: 12 }}>{tpl.name}</Text>
                  <Button size="small" onClick={() => loadTemplate(tpl)}>लोड करा</Button>
                </div>
              ))}
            </div>
          )}
        </Col>

        {/* Right: Result table */}
        <Col span={16}>
          {rows.length > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>एकूण {rows.length} नोंदी</Text>
                <Space>
                  <Button size="small" icon={<PrinterOutlined />}
                    onClick={() => downloadReportPDF({
                      title: `Custom अहवाल — ${CUSTOM_REPORT_TYPES.find(t => t.value === reportType)?.label}`,
                      cols: activeCols.map(c => ({ key: c.key, header: c.title, align: (c.align as any) || 'left' })),
                      rows, sanstha, unit, userName,
                    })}>
                    मुद्रित करा
                  </Button>
                  <Button size="small" icon={<DownloadOutlined />}
                    onClick={() => exportToExcel(activeCols, rows, 'custom-report')}>
                    Excel
                  </Button>
                </Space>
              </div>
              <Table
                dataSource={rows}
                rowKey={(_r, i) => String(i)}
                columns={activeCols.map(c => ({ title: c.title, dataIndex: c.key, key: c.key, align: c.align as any }))}
                size="small"
                pagination={{ pageSize: 50 }}
                scroll={{ x: true }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
              <CodeOutlined style={{ fontSize: 40, marginBottom: 10, display: 'block' }} />
              <div>प्रकार, स्तंभ, शाळा निवडा आणि "अहवाल चालवा" दाबा</div>
            </div>
          )}
        </Col>
      </Row>

      <Modal title="Template जतन करा" open={saveModalOpen} onCancel={() => setSaveModalOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={saveTemplate}>
          <Form.Item label="Template चे नाव">
            <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="उदा. वर्ग ७ विद्यार्थी यादी" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">जतन करा</Button>
            <Button onClick={() => setSaveModalOpen(false)}>रद्द करा</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

// ── Report renderer map ──────────────────────────────────────────────────────
function ReportRenderer({ reportId, ...props }: { reportId: string; [k: string]: any }) {
  switch (reportId) {
    case 'gr-register':    return <GRRegisterReport {...props} />;
    case 'class-strength': return <ClassStrengthReport {...props} />;
    case 'category':       return <CategoryReport {...props} />;
    case 'new-admissions': return <NewAdmissionsReport {...props} />;
    case 'fee-summary':    return <FeeCollectionReport {...props} />;
    case 'defaulters':     return <DefaultersReport {...props} />;
    case 'receipt-register': return <ReceiptRegisterReport {...props} />;
    case 'day-book':       return <DayBookReport {...props} />;
    case 'staff-register': return <StaffRegisterReport {...props} />;
    case 'salary-summary': return <SalaryReport {...props} />;
    case 'exam-marks':     return <ExamMarksReport {...props} />;
    case 'pass-fail':      return <PassFailReport {...props} />;
    case 'attendance':     return <AttendanceReport {...props} />;
    case 'cert-register':  return <CertRegisterReport {...props} />;
    case 'custom-report':  return <CustomReportPanel {...props} />;
    default: return <Empty description="अहवाल आढळला नाही" />;
  }
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <div style={{
      width: 220, minWidth: 220, borderRight: '1px solid #DDE8F4',
      background: '#F7FAFD', overflowY: 'auto', height: '100%',
    }}>
      {SIDEBAR_GROUPS.map(group => (
        <div key={group.key}>
          <div style={{
            padding: '9px 14px 5px', fontSize: 11, fontWeight: 700,
            color: '#1A3A5C', letterSpacing: 0.5,
            borderBottom: '1px solid #DDE8F4',
            background: '#EEF4F9',
            textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {group.icon} {group.label}
          </div>
          {group.reports.map(r => (
            <div
              key={r.id}
              onClick={() => onSelect(r.id)}
              style={{
                padding: '8px 14px 8px 24px',
                cursor: 'pointer',
                fontSize: 12.5,
                color: activeId === r.id ? '#1A3A5C' : '#3A4A5C',
                background: activeId === r.id ? '#D6E8F7' : 'transparent',
                fontWeight: activeId === r.id ? 600 : 400,
                borderLeft: activeId === r.id ? '3px solid #1A3A5C' : '3px solid transparent',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (activeId !== r.id) (e.currentTarget as HTMLElement).style.background = '#E8F1F9'; }}
              onMouseLeave={e => { if (activeId !== r.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ opacity: 0.6, fontSize: 11 }}>{r.icon}</span>
              {r.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { user: me } = useAuthStore();
  const [activeReport, setActiveReport] = useState('gr-register');

  const { data: sanstha } = useQuery({
    queryKey: ['sanstha', me?.sansthaId],
    queryFn: () => sansthaApi.findOne(me!.sansthaId),
    enabled: !!me?.sansthaId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const { years: academicYears, yearId: defaultYearId } = useCurrentYear();

  if (!me?.sansthaId) return null;

  // Find active report label
  const activeLabel = SIDEBAR_GROUPS.flatMap(g => g.reports).find(r => r.id === activeReport)?.label || '';

  const props = { me, units: units as any[], academicYears: academicYears as any[], sanstha, defaultYearId };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Page header */}
      <div style={{
        padding: '10px 20px 10px',
        borderBottom: '1px solid #DDE8F4',
        background: '#fff',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <BarChartOutlined style={{ fontSize: 20, color: '#1A3A5C' }} />
        <Title level={4} style={{ margin: 0, color: '#1A3A5C' }}>अहवाल केंद्र</Title>
        <Divider type="vertical" />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {sanstha?.nameMr || 'संस्था'}
        </Text>
        <Text style={{ fontSize: 11, background: '#EEF4F9', padding: '2px 10px', borderRadius: 12, color: '#1A3A5C', border: '1px solid #BCD4E8' }}>
          {activeLabel}
        </Text>
      </div>

      {/* Body: sidebar + main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activeId={activeReport} onSelect={setActiveReport} />

        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#fff' }}>
          {/* Report title bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
            paddingBottom: 10, borderBottom: '2px solid #EEF4F9',
          }}>
            <div style={{
              width: 4, height: 20, background: '#1A3A5C', borderRadius: 2,
            }} />
            <Title level={5} style={{ margin: 0, color: '#1A3A5C' }}>{activeLabel}</Title>
          </div>

          <ReportRenderer reportId={activeReport} {...props} />
        </div>
      </div>
    </div>
  );
}
