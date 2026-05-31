import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space, Tooltip,
  Popconfirm, message, Row, Col, DatePicker, Avatar, Upload, Typography,
  Alert, Progress, Divider, Radio,
} from 'antd';
import { MrInput, MrTextArea } from '../../components/common/MrInput';
import {
  PlusOutlined, EditOutlined, StopOutlined, UserOutlined,
  UploadOutlined, DownloadOutlined, SearchOutlined, TeamOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { studentApi, unitApi, gradeApi, sansthaApi } from '../../api/client';
import { downloadIdentityCards } from '../../pdf/IdentityCard';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { useUnitAccess } from '../../hooks/useUnitAccess';
import { useCurrentYear } from '../../hooks/useCurrentYear';
import AcademicYearSelect from '../../components/common/AcademicYearSelect';


const { Text } = Typography;
import { mediaUrl } from '../../api/client';

const GENDER_OPTS   = [{ value: 'male', label: 'पुरुष' }, { value: 'female', label: 'स्त्री' }, { value: 'other', label: 'इतर' }];
const CATEGORY_OPTS = ['खुला','SC','ST','VJ','NT-A','NT-B','NT-C','NT-D','OBC','SBC','SEBC','EWS'].map(v => ({ value: v, label: v }));
const STATUS_COLORS: Record<string, string> = { active: 'green', transferred: 'blue', left: 'red', passed_out: 'purple' };

// ── Cascading Grade → Division select used inside form ────────────────────────
function GradeDivisionFields({ form }: { form: any; units?: any[]; academicYears?: any[] }) {
  const unitId       = Form.useWatch('unitId', form);
  const academicYearId = Form.useWatch('academicYearId', form);
  const gradeConfigId  = Form.useWatch('gradeConfigId', form);

  const { data: grades = [] } = useQuery({
    queryKey: ['grades', unitId, academicYearId],
    queryFn: () => gradeApi.findByUnit(unitId, academicYearId),
    enabled: !!unitId && !!academicYearId,
  });

  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions', unitId, academicYearId, gradeConfigId],
    queryFn: () => gradeApi.findDivisions(unitId, academicYearId, gradeConfigId),
    enabled: !!unitId && !!academicYearId && !!gradeConfigId,
  });

  const { t } = useTranslation();
  return (
    <>
      <Col span={12}>
        <Form.Item name="gradeConfigId" label={t('students.fields.grade')} rules={[{ required: true, message: t('students.fields.selectGrade') }]}>
          <Select
            options={(grades as any[]).map(g => ({ value: g.id, label: g.gradeLabelMr }))}
            placeholder={t('students.fields.selectGrade')}
            allowClear
            disabled={!unitId || !academicYearId}
            onChange={() => form.setFieldValue('divisionId', undefined)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="divisionId" label={t('students.fields.division')}>
          <Select
            options={(divisions as any[]).map(d => ({ value: d.id, label: d.nameMr }))}
            placeholder={t('students.fields.selectDivision')}
            allowClear
            disabled={!gradeConfigId}
          />
        </Form.Item>
      </Col>
    </>
  );
}

export default function StudentsPage() {
  const { t } = useTranslation();
  const { user: me } = useAuthStore();
  const { selectedAcademicYearId, setSelectedAcademicYearId } = useAppStore();
  const { years: academicYears, yearId: currentYearId } = useCurrentYear();
  const { unitId: lockedUnitId, canSwitch: canSwitchUnit } = useUnitAccess();
  const qc = useQueryClient();

  // ── Modal state ───────────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [form]     = Form.useForm();
  const [editForm] = Form.useForm();

  // ── Filter / search state ─────────────────────────────────────────────────────
  const [searchText,     setSearchText]     = useState('');
  // Unit-scoped users: locked to their unit; sanstha-level: free to pick
  const [filterUnitId,   setFilterUnitId]   = useState<string | undefined>(lockedUnitId ?? undefined);
  const [filterAcYear,   setFilterAcYear]   = useState<string | undefined>(() => selectedAcademicYearId ?? currentYearId ?? undefined);
  // Auto-populate year once the hook resolves (first load where store was empty)
  useEffect(() => { if (currentYearId && !filterAcYear) setFilterAcYear(currentYearId); }, [currentYearId]);
  const [filterGradeId,  setFilterGradeId]  = useState<string>();
  const [filterDivId,    setFilterDivId]    = useState<string>();
  const [filterCategory, setFilterCategory] = useState<string>();
  const [filterStatus,   setFilterStatus]   = useState<string>();

  // ── ID Card selection ─────────────────────────────────────────────────────────
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [idCardLoading,   setIdCardLoading]   = useState(false);
  const [langModalOpen,   setLangModalOpen]   = useState(false);
  const [idCardLang,      setIdCardLang]      = useState<'mr' | 'en'>('mr');

  const doDownloadIDCards = async (lang: 'mr' | 'en') => {
    const selected = (filtered as any[]).filter((s: any) => selectedRowKeys.includes(s.id));
    const noPhoto = selected.filter((s: any) => !s.photoUrl);
    if (noPhoto.length > 0) {
      message.warning(`${noPhoto.length} विद्यार्थ्यांचा Photo नाही — तरी ID Card तयार होईल.`);
    }
    setIdCardLoading(true);
    try {
      const unit = (units as any[]).find((u: any) => u.id === filterUnitId);
      const acYear = (academicYears as any[]).find((y: any) => y.id === filterAcYear);
      await downloadIdentityCards({
        persons: selected.map((s: any) => ({
          type: 'student' as const,
          nameMr: s.nameMr,
          nameEn: s.nameEn,
          grNumber: s.grNumber,
          gradeLabelMr: gradeMap[s.gradeConfigId] || '',
          divisionName: divMap[s.divisionId] || '',
          bloodGroup: s.bloodGroup,
          fatherNameMr: s.fatherNameMr,
          motherNameMr: s.motherNameMr,
          dob: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined,
          addressMr: s.addressMr,
          phone: s.phone,
          photoUrl: s.photoUrl,
        })),
        sanstha: sansthaData,
        unit,
        academicYear: acYear?.labelMr || acYear?.labelEn,
        language: lang,
      });
    } catch {
      message.error('ID Card PDF तयार करताना त्रुटी आली');
    } finally {
      setIdCardLoading(false);
    }
  };

  const handlePrintIDCards = () => {
    if (!selectedRowKeys.length) { message.warning('ID Card साठी विद्यार्थी निवडा'); return; }
    setLangModalOpen(true);
  };

  // ── Import state ──────────────────────────────────────────────────────────────
  const [importOpen,   setImportOpen]   = useState(false);
  const [importUnitId, setImportUnitId] = useState<string>();
  const [importAcYear, setImportAcYear] = useState<string>();
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: any[] } | null>(null);
  const [importing,    setImporting]    = useState(false);

  // ── Data queries ──────────────────────────────────────────────────────────────
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', me?.sansthaId, filterUnitId],
    queryFn: () => studentApi.findBySanstha(me!.sansthaId, { unitId: filterUnitId }),
    enabled: !!me?.sansthaId,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const { data: sansthaData } = useQuery({
    queryKey: ['sanstha', me?.sansthaId],
    queryFn: () => sansthaApi.findOne(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  // academicYears from useCurrentYear hook (already fetches + seeds current year)

  // Grades for filter bar (uses filterUnitId + filterAcYear)
  const { data: filterGrades = [] } = useQuery({
    queryKey: ['grades', filterUnitId, filterAcYear],
    queryFn: () => gradeApi.findByUnit(filterUnitId!, filterAcYear),
    enabled: !!filterUnitId,
  });

  // ALL divisions for this unit+year — used to build divMap for table display
  // When no unit filter, fetch all divisions for the sanstha using sansthaId param
  const { data: allDivisionsWithGrade = [] } = useQuery({
    queryKey: ['all-divisions-with-grade', filterUnitId, filterAcYear, me?.sansthaId],
    queryFn: () => filterUnitId
      ? gradeApi.findDivisionsWithGrade(filterUnitId, filterAcYear ?? undefined)
      : gradeApi.findDivisionsWithGrade(undefined, filterAcYear ?? undefined, me!.sansthaId),
    enabled: !!me?.sansthaId,
    staleTime: 5 * 60 * 1000,
  });

  // Divisions for filter bar (specific grade filter)
  const { data: filterDivisions = [] } = useQuery({
    queryKey: ['divisions', filterUnitId, filterAcYear, filterGradeId],
    queryFn: () => gradeApi.findDivisions(filterUnitId!, filterAcYear, filterGradeId),
    enabled: !!filterUnitId && !!filterGradeId,
  });

  // ── Client-side filtered list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchText.toLowerCase();
    return (students as any[]).filter(s => {
      if (q && ![s.nameMr, s.nameEn, s.fatherNameMr, s.grNumber].some(v => v?.toLowerCase().includes(q))) return false;
      if (filterGradeId  && s.gradeConfigId !== filterGradeId)  return false;
      if (filterDivId    && s.divisionId    !== filterDivId)     return false;
      if (filterCategory && s.category      !== filterCategory)  return false;
      if (filterStatus   && s.status        !== filterStatus)    return false;
      if (filterAcYear   && s.academicYearId !== filterAcYear)   return false;
      return true;
    });
  }, [students, searchText, filterGradeId, filterDivId, filterCategory, filterStatus, filterAcYear]);

  // Grade label lookup map — built from ALL grades (filterGrades) + allDivisionsWithGrade
  const gradeMap = useMemo(() => {
    const m: Record<string, string> = {};
    (filterGrades as any[]).forEach(g => { m[g.id] = g.gradeLabelMr; });
    // Also populate from allDivisionsWithGrade which includes gradeConfig relation
    (allDivisionsWithGrade as any[]).forEach(d => {
      if (d.gradeConfig) m[d.gradeConfig.id] = d.gradeConfig.gradeLabelMr;
      if (d.gradeConfigId && d.gradeConfig) m[d.gradeConfigId] = d.gradeConfig.gradeLabelMr;
    });
    return m;
  }, [filterGrades, allDivisionsWithGrade]);

  const divMap = useMemo(() => {
    const m: Record<string, string> = {};
    // All divisions (for table display) — gradeConfig.gradeLabelMr + nameMr
    (allDivisionsWithGrade as any[]).forEach(d => {
      m[d.id] = d.nameMr;
    });
    // Also from filter-bar divisions
    (filterDivisions as any[]).forEach(d => { m[d.id] = d.nameMr; });
    return m;
  }, [allDivisionsWithGrade, filterDivisions]);

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ['students'] });

  const createMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values, sansthaId: me!.sansthaId };
      if (payload.dateOfBirth)   payload.dateOfBirth   = payload.dateOfBirth.format('YYYY-MM-DD');
      if (payload.admissionDate) payload.admissionDate = payload.admissionDate.format('YYYY-MM-DD');
      return studentApi.create(payload);
    },
    onSuccess: () => { message.success(t('students.registered')); invalidate(); setCreateOpen(false); form.resetFields(); },
    onError: (e: any) => message.error(e.response?.data?.message || t('students.error')),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values };
      if (payload.dateOfBirth?.format) payload.dateOfBirth = payload.dateOfBirth.format('YYYY-MM-DD');
      return studentApi.update(editStudent.id, payload);
    },
    onSuccess: () => { message.success(t('students.saved')); invalidate(); setEditStudent(null); },
    onError: () => message.error(t('students.error')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => studentApi.deactivate(id),
    onSuccess: () => { message.success(t('students.deactivated')); invalidate(); },
  });

  // ── Import ────────────────────────────────────────────────────────────────────
  const handleImport = async (file: File) => {
    if (!importUnitId || !importAcYear) { message.error(t('students.selectSchoolYear')); return false; }
    setImporting(true); setImportResult(null);
    try {
      const result = await studentApi.importExcel(file, importUnitId, importAcYear);
      setImportResult(result);
      if (result.imported > 0) invalidate();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'आयात अयशस्वी');
    } finally { setImporting(false); }
    return false;
  };

  // ── Photo upload ──────────────────────────────────────────────────────────────
  const photoProps = (studentId: string): UploadProps => ({
    accept: '.png,.jpg,.jpeg', showUploadList: false,
    beforeUpload: async (file) => {
      try { await studentApi.uploadPhoto(studentId, file); invalidate(); message.success(t('students.photoUploaded')); }
      catch { message.error(t('students.uploadFailed')); }
      return false;
    },
  });

  // ── Table columns ─────────────────────────────────────────────────────────────
  const STATUS_LABELS: Record<string, string> = {
    active: t('students.status.active'),
    transferred: t('students.status.transferred'),
    left: t('students.status.left'),
    passed_out: t('students.status.passed_out'),
  };

  const columns = [
    {
      title: t('students.columns.photo'), key: 'photo', width: 60,
      render: (_: any, rec: any) => (
        <Upload {...photoProps(rec.id)}>
          {rec.photoUrl
            ? <img src={mediaUrl(rec.photoUrl)!} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} alt="" />
            : <Avatar size={36} icon={<UserOutlined />} style={{ background: '#1A5276', cursor: 'pointer' }} />}
        </Upload>
      ),
    },
    {
      title: t('students.columns.name'), dataIndex: 'nameMr', key: 'nameMr',
      render: (v: string, rec: any) => (
        <div>
          <Text strong>{v}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{rec.nameEn || ''}{rec.grNumber ? ` · GR: ${rec.grNumber}` : ''}</Text>
        </div>
      ),
    },
    { title: t('students.columns.fatherName'), dataIndex: 'fatherNameMr', key: 'father', responsive: ['md' as const] },
    {
      title: t('students.columns.gradeDivision'), key: 'grade',
      render: (_: any, rec: any) => {
        const grade = gradeMap[rec.gradeConfigId] || rec.gradeConfigId || '—';
        const div   = divMap[rec.divisionId]     || rec.divisionId     || '';
        return div ? <Tag color="blue">{grade} — {div}</Tag> : <span>{grade}</span>;
      },
    },
    { title: t('students.columns.category'), dataIndex: 'category', key: 'category', render: (v: string) => v ? <Tag>{v}</Tag> : '—', responsive: ['lg' as const] },
    { title: t('students.columns.phone'), dataIndex: 'phone', key: 'phone', responsive: ['lg' as const] },
    {
      title: t('students.columns.status'), dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: t('students.columns.actions'), key: 'actions', width: 80,
      render: (_: any, rec: any) => (
        <Space size={4}>
          <Tooltip title={t('students.edit')}>
            <Button size="small" icon={<EditOutlined />}
              onClick={() => { setEditStudent(rec); editForm.setFieldsValue({ ...rec, dateOfBirth: rec.dateOfBirth ? dayjs(rec.dateOfBirth) : undefined, admissionDate: rec.admissionDate ? dayjs(rec.admissionDate) : undefined }); }} />
          </Tooltip>
          <Popconfirm title={t('students.deactivateConfirm')} onConfirm={() => deactivateMutation.mutate(rec.id)} okText={t('app.yes')} cancelText={t('app.no')}>
            <Button size="small" icon={<StopOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Shared student form ───────────────────────────────────────────────────────
  const StudentForm = ({ formInst, onFinish, loading }: { formInst: any; onFinish: any; loading: boolean }) => (
    <Form form={formInst} layout="vertical" onFinish={onFinish}>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="nameMr" label={t('students.fields.nameMr')} rules={[{ required: true }]}><MrInput placeholder="e.g. ramesh suresh patil" /></Form.Item></Col>
        <Col span={12}><Form.Item name="nameEn" label={t('students.fields.nameEn')}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="fatherNameMr" label={t('students.fields.fatherNameMr')}><MrInput placeholder="e.g. suresh" /></Form.Item></Col>
        <Col span={12}><Form.Item name="motherNameMr" label={t('students.fields.motherNameMr')}><MrInput placeholder="e.g. sunita" /></Form.Item></Col>
        <Col span={12}><Form.Item name="gender" label={t('students.fields.gender')}><Select options={GENDER_OPTS} /></Form.Item></Col>
        <Col span={12}><Form.Item name="dateOfBirth" label={t('students.fields.dateOfBirth')}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>

        {/* Unit + Year first — grade/division depend on them */}
        <Col span={12}>
          <Form.Item name="unitId" label={t('students.fields.school')} rules={[{ required: true }]}>
            <Select
              disabled={!canSwitchUnit}
              options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))}
              onChange={() => { formInst.setFieldValue('gradeConfigId', undefined); formInst.setFieldValue('divisionId', undefined); }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="academicYearId" label={t('students.fields.academicYear')} rules={[{ required: true }]}>
            <AcademicYearSelect
              onChange={() => { formInst.setFieldValue('gradeConfigId', undefined); formInst.setFieldValue('divisionId', undefined); }}
            />
          </Form.Item>
        </Col>

        {/* Cascading grade + division */}
        <GradeDivisionFields form={formInst} units={units} academicYears={academicYears} />

        <Col span={12}><Form.Item name="grNumber" label={t('students.fields.grNumber')}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="saralId" label={t('students.fields.saralId')}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="admissionDate" label={t('students.fields.admissionDate')}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
        <Col span={12}><Form.Item name="category" label={t('students.fields.category')}><Select options={CATEGORY_OPTS} allowClear /></Form.Item></Col>
        <Col span={12}><Form.Item name="casteMr" label={t('students.fields.caste')}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="religionMr" label={t('students.fields.religion')}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="phone" label={t('students.fields.phone')}><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name="aadhaarLast4" label={t('students.fields.aadhaarLast4')} rules={[{ len: 4, message: '४ अंक' }]}><Input maxLength={4} /></Form.Item></Col>
        <Col span={12}>
          <Form.Item name="bloodGroup" label="रक्तगट (Blood Group)">
            <Select allowClear options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => ({ value: g, label: g }))} placeholder="रक्तगट निवडा" />
          </Form.Item>
        </Col>
        <Col span={24}><Form.Item name="addressMr" label={t('students.fields.address')}><MrTextArea rows={2} placeholder="e.g. pune" /></Form.Item></Col>
      </Row>
      <Space>
        <Button type="primary" htmlType="submit" loading={loading}>{t('app.save')}</Button>
        <Button onClick={() => { setCreateOpen(false); setEditStudent(null); }}>{t('app.cancel')}</Button>
      </Space>
    </Form>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <TeamOutlined style={{ fontSize: 18, color: '#1A3A5C' }} />
        <Text strong style={{ fontSize: 16, color: '#1A3A5C' }}>{t('students.title')}</Text>
        <Divider type="vertical" />
        <Text type="secondary" style={{ fontSize: 12 }}>{t('students.count', { count: filtered.length })}</Text>
        <div style={{ marginLeft: 'auto' }}>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button
                icon={<IdcardOutlined />}
                size="small"
                loading={idCardLoading}
                onClick={handlePrintIDCards}
                style={{ borderColor: '#1A5276', color: '#1A5276' }}
              >
                ID Card Print ({selectedRowKeys.length})
              </Button>
            )}
            <Button icon={<UploadOutlined />} size="small" onClick={() => { setImportOpen(true); setImportResult(null); }}>
              {t('students.importExcel')}
            </Button>
            <Button type="primary" size="small" icon={<PlusOutlined />}
              onClick={() => { setCreateOpen(true); if (!canSwitchUnit && lockedUnitId) form.setFieldValue('unitId', lockedUnitId); }}
             >
              {t('students.addNew')}
            </Button>
          </Space>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
        <div style={{ padding: '16px 20px' }}>
      {/* ── Search + Filter bar ── */}
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Input
            prefix={<SearchOutlined />}
            placeholder={t('students.search.placeholder')}
            allowClear
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </Col>
        {canSwitchUnit && (
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('students.search.schoolPlaceholder')}
              allowClear
              value={filterUnitId}
              options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))}
              onChange={v => { setFilterUnitId(v); setFilterGradeId(undefined); setFilterDivId(undefined); }}
            />
          </Col>
        )}
        <Col xs={12} sm={6} md={3}>
          <AcademicYearSelect
            style={{ width: '100%' }}
            allowClear
            value={filterAcYear ?? null}
            onChange={(id) => { setFilterAcYear(id); setSelectedAcademicYearId(id); }}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Select
            style={{ width: '100%' }}
            placeholder={t('students.search.gradePlaceholder')}
            allowClear
            disabled={!filterUnitId}
            options={(filterGrades as any[]).map(g => ({ value: g.id, label: g.gradeLabelMr }))}
            onChange={v => { setFilterGradeId(v); setFilterDivId(undefined); }}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Select
            style={{ width: '100%' }}
            placeholder={t('students.search.divisionPlaceholder')}
            allowClear
            disabled={!filterGradeId}
            options={(filterDivisions as any[]).map(d => ({ value: d.id, label: d.nameMr }))}
            onChange={setFilterDivId}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Select
            style={{ width: '100%' }}
            placeholder={t('students.search.categoryPlaceholder')}
            allowClear
            options={CATEGORY_OPTS}
            onChange={setFilterCategory}
          />
        </Col>
        <Col xs={12} sm={6} md={2}>
          <Select
            style={{ width: '100%' }}
            placeholder={t('students.search.statusPlaceholder')}
            allowClear
            options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            onChange={setFilterStatus}
          />
        </Col>
      </Row>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 700 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          preserveSelectedRowKeys: true,
        }}
      />

      {/* ── Create modal ── */}
      <Modal title={t('students.createTitle')} open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} width={720}>
        <StudentForm formInst={form} onFinish={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>

      {/* ── Edit modal ── */}
      <Modal title={t('students.editTitle')} open={!!editStudent} onCancel={() => setEditStudent(null)} footer={null} width={720}>
        <StudentForm formInst={editForm} onFinish={updateMutation.mutate} loading={updateMutation.isPending} />
      </Modal>

      {/* ── Bulk Excel Import ── */}
      <Modal
        title={t('students.import.title')}
        open={importOpen}
        onCancel={() => { setImportOpen(false); setImportResult(null); }}
        footer={null}
        width={580}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            type="info" showIcon message={t('students.import.formatTitle')}
            description={
              <span>
                {t('students.import.columnsRequired')}:{' '}
                <b>nameMr, nameEn, fatherNameMr, motherNameMr, gender, dateOfBirth, grNumber, category, phone, address</b>
                <br />
                <Button size="small" icon={<DownloadOutlined />} style={{ marginTop: 8 }}
                  onClick={() => {
                    const h = 'nameMr,nameEn,fatherNameMr,motherNameMr,gender,dateOfBirth,grNumber,category,phone,address\n';
                    const s = 'रमेश सुरेश पाटील,Ramesh Suresh Patil,सुरेश पाटील,सुनिता पाटील,male,2010-04-15,GR001,खुला,9876543210,पुणे\n';
                    const blob = new Blob(['﻿' + h + s], { type: 'text/csv;charset=utf-8;' });
                    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'student-import-template.csv' });
                    a.click();
                  }}>
                  {t('students.import.downloadTemplate')}
                </Button>
              </span>
            }
          />
          <Row gutter={12}>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>{t('students.fields.school')} <span style={{ color: 'red' }}>*</span></div>
              <Select style={{ width: '100%' }} placeholder={t('fees.schoolPlaceholder')}
                options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))}
                onChange={setImportUnitId} />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>{t('students.fields.academicYear')} <span style={{ color: 'red' }}>*</span></div>
              <AcademicYearSelect
                style={{ width: '100%' }}
                value={importAcYear ?? null}
                onChange={setImportAcYear}
              />
            </Col>
          </Row>
          <Upload.Dragger accept=".xlsx,.xls,.csv" showUploadList={false} beforeUpload={handleImport}
            disabled={importing || !importUnitId || !importAcYear}>
            <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize: 32, color: '#1A5276' }} /></p>
            <p className="ant-upload-text">{t('students.import.dragOrClick')}</p>
            <p className="ant-upload-hint">{t('students.import.maxSize')}</p>
          </Upload.Dragger>
          {importing && <Progress percent={99} status="active" strokeColor="#1A5276" />}
          {importResult && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert type={importResult.failed === 0 ? 'success' : 'warning'} showIcon
                message={importResult.failed === 0 ? t('students.importResult', { imported: importResult.imported }) : t('students.importResultFailed', { imported: importResult.imported, failed: importResult.failed })} />
              {importResult.errors?.length > 0 && (
                <Table size="small" dataSource={importResult.errors.map((e, i) => ({ key: i, ...e }))}
                  columns={[
                    { title: t('students.import.errorRow'), dataIndex: 'row', width: 60 },
                    { title: t('students.import.errorField'), dataIndex: 'field', width: 120 },
                    { title: t('students.import.errorMessage'), dataIndex: 'message' },
                  ]}
                  pagination={{ pageSize: 5 }} scroll={{ y: 200 }} />
              )}
            </Space>
          )}
        </Space>
      </Modal>

      {/* ── Language picker modal for ID cards */}
      <Modal
        title="ID Card भाषा निवडा"
        open={langModalOpen}
        onOk={async () => { setLangModalOpen(false); await doDownloadIDCards(idCardLang); }}
        onCancel={() => setLangModalOpen(false)}
        okText="PDF तयार करा"
        cancelText="रद्द करा"
        okButtonProps={{ loading: idCardLoading }}
        width={360}
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 12, color: '#555' }}>
            ID Card वर नावे व मजकूर कोणत्या भाषेत असावेत?
          </div>
          <Radio.Group
            value={idCardLang}
            onChange={e => setIdCardLang(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <Radio value="mr">
              <span style={{ fontWeight: 600 }}>मराठी</span>
              <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>— नावे, शाळा, संस्था मराठीत</span>
            </Radio>
            <Radio value="en">
              <span style={{ fontWeight: 600 }}>English</span>
              <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>— Names, School & Sanstha in English</span>
            </Radio>
          </Radio.Group>
        </div>
      </Modal>

        </div>
      </div>
    </div>
  );
}
