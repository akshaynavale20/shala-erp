import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Modal, Form, Select, Tag, message,
  Typography, Tabs, InputNumber, Row, Col,
  Alert, Badge,
} from 'antd';
import {
  PlusOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeApi, unitApi, studentApi, sansthaApi } from '../../api/client';
import StudentSearchSelect from '../../components/common/StudentSearchSelect';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { useUnitAccess } from '../../hooks/useUnitAccess';
import { useCurrentYear } from '../../hooks/useCurrentYear';
import FeeCollectionTabNew from './FeeCollectionTab';
import ClassViewTab from './ClassViewTab';
import FeeMetricsBar from './FeeMetricsBar';
import FeeStructureTab from './FeeStructureTab';
import { MrInput } from '../../components/common/MrInput';

const { Text, Title } = Typography;
const { Option } = Select;

const CONCESSION_TYPE_LABELS_STATIC: Record<string, string> = {
  rte: 'आरटीई (RTE)', bpl: 'बीपीएल (BPL)', sibling: 'भावंड सवलत',
  staff_child: 'कर्मचारी पाल्य', merit: 'गुणवत्ता सवलत', custom: 'इतर',
};



// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2: Defaulters
// ═══════════════════════════════════════════════════════════════════════════════
function DefaultersTab({ me, units, academicYears }: any) {
  const { t } = useTranslation();
  const [filterUnit, setFilterUnit] = useState<string>();
  const [filterYear, setFilterYear] = useState<string>();

  const { data: defaulters = [], isLoading } = useQuery({
    queryKey: ['defaulters', filterUnit, filterYear],
    queryFn: () => feeApi.defaulters(filterUnit!, filterYear!),
    enabled: !!filterUnit && !!filterYear,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', me?.sansthaId, filterUnit],
    queryFn: () => studentApi.findBySanstha(me!.sansthaId, { unitId: filterUnit }),
    enabled: !!me?.sansthaId && !!filterUnit,
  });

  const totalOutstanding = (defaulters as any[]).reduce((s: number, d: any) => s + +d.outstanding, 0);

  const cols = [
    {
      title: t('fees.defaulters.columns.no'),
      key: 'no',
      width: 50,
      render: (_: any, __: any, i: number) => i + 1,
    },
    {
      title: t('fees.defaulters.columns.studentName'),
      key: 'name',
      render: (_: any, r: any) => {
        const s = (students as any[]).find((s: any) => s.id === r.studentId);
        return s ? `${s.nameMr} (${s.grNo || ''})` : r.studentId;
      },
    },
    {
      title: t('fees.defaulters.columns.outstanding'),
      dataIndex: 'outstanding',
      key: 'out',
      width: 130,
      align: 'right' as const,
      render: (v: any) => <Text type="danger" strong>₹{Number(v).toFixed(0)}</Text>,
    },
    {
      title: t('fees.defaulters.columns.daysOverdue'),
      dataIndex: 'maxDaysOverdue',
      key: 'days',
      width: 130,
      align: 'center' as const,
      render: (v: any) => v > 0 ? <Tag color={v > 30 ? 'red' : v > 15 ? 'orange' : 'gold'}>{t('fees.defaulters.days', { days: v })}</Tag> : '—',
    },
    {
      title: t('fees.defaulters.columns.installments'),
      key: 'cnt',
      width: 80,
      render: (_: any, r: any) => <Badge count={r.demands?.length || 0} color="#1A5276" />,
    },
  ];

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12} md={6}>
          <Select placeholder={t('fees.defaulters.selectSchool')} style={{ width: '100%' }} onChange={setFilterUnit}
            options={(units as any[]).map((u: any) => ({ value: u.id, label: u.nameMr }))} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select placeholder={t('fees.defaulters.selectYear')} style={{ width: '100%' }} onChange={setFilterYear}
            options={(academicYears as any[]).map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
        </Col>
        {(defaulters as any[]).length > 0 && (
          <Col xs={24} md={12}>
            <Alert
              type="warning"
              message={t('fees.defaulters.summary', { count: (defaulters as any[]).length, total: totalOutstanding.toLocaleString('mr-IN') })}
              showIcon
            />
          </Col>
        )}
      </Row>

      {filterUnit && filterYear ? (
        <Table
          dataSource={defaulters as any[]}
          columns={cols}
          rowKey="studentId"
          loading={isLoading}
          size="small"
          pagination={{ pageSize: 20, showTotal: (total) => `${t('app.total')}: ${total}` }}
          summary={() => (defaulters as any[]).length > 0 ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}><Text strong>{t('fees.defaulters.total')}</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text type="danger" strong>₹{totalOutstanding.toLocaleString('mr-IN')}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={2} />
            </Table.Summary.Row>
          ) : null}
        />
      ) : (
        <Alert type="info" message={t('fees.defaulters.selectBoth')} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 4: Concession Templates
// ═══════════════════════════════════════════════════════════════════════════════
function ConcessionTab({ me, units, academicYears }: any) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [applyModal, setApplyModal] = useState(false);
  const [applyUnit, setApplyUnit] = useState<string>();
  const [form] = Form.useForm();
  const [applyForm] = Form.useForm();

  const { data: templates = [] } = useQuery({
    queryKey: ['concession-templates', me?.sansthaId],
    queryFn: () => feeApi.findConcessionTemplates(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const createMut = useMutation({
    mutationFn: (vals: any) => feeApi.createConcessionTemplate({ ...vals, sansthaId: me.sansthaId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['concession-templates'] }); setModal(false); form.resetFields(); },
  });

  const applyMut = useMutation({
    mutationFn: (vals: any) => feeApi.applyConcessionTemplate({ ...vals, sansthaId: me.sansthaId }),
    onSuccess: () => { message.success(t('fees.concession.applySuccess')); setApplyModal(false); applyForm.resetFields(); },
    onError: (e: any) => message.error(e.response?.data?.message || t('app.error')),
  });

  const cols = [
    { title: t('fees.concession.columns.name'), dataIndex: 'nameMr', key: 'name' },
    { title: t('fees.concession.columns.type'), dataIndex: 'concessionType', key: 'type', render: (v: string) => t(`fees.concession.types.${v}`, { defaultValue: v }) },
    {
      title: t('fees.concession.columns.discount'),
      key: 'disc',
      render: (_: any, r: any) => r.discountType === 'percentage' ? `${r.discountValue}%` : `₹${r.discountValue}`,
    },
    { title: t('fees.concession.columns.status'), dataIndex: 'isActive', key: 'act', render: (v: boolean) => v ? <Tag color="green">{t('app.active')}</Tag> : <Tag>{t('app.inactive')}</Tag> },
  ];

  return (
    <div>
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal(true)}>
            {t('fees.concession.newTemplate')}
          </Button>
        </Col>
        <Col>
          <Button onClick={() => setApplyModal(true)}>{t('fees.concession.applyToStudent')}</Button>
        </Col>
      </Row>

      <Table dataSource={templates as any[]} columns={cols} rowKey="id" size="small" pagination={false} />

      {/* Create template modal */}
      <Modal open={modal} title={t('fees.concession.newTemplate')} onCancel={() => { setModal(false); form.resetFields(); }}
        onOk={() => form.validateFields().then(v => createMut.mutate(v))} okText={t('app.save')} cancelText={t('app.cancel')} confirmLoading={createMut.isPending}>
        <Form form={form} layout="vertical">
          <Form.Item name="nameMr" label={t('fees.concession.fields.name')} rules={[{ required: true }]}>
            <MrInput />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="concessionType" label={t('fees.concession.fields.type')} rules={[{ required: true }]}>
                <Select>{Object.entries(CONCESSION_TYPE_LABELS_STATIC).map(([v]) => <Option key={v} value={v}>{t(`fees.concession.types.${v}`, { defaultValue: v })}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountType" label={t('fees.concession.fields.discountMethod')} rules={[{ required: true }]}>
                <Select>
                  <Option value="percentage">{t('fees.concession.fields.percentage')}</Option>
                  <Option value="flat">{t('fees.concession.fields.flat')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="discountValue" label={t('fees.concession.fields.discountValue')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Apply template modal */}
      <Modal open={applyModal} title={t('fees.concession.applyToStudent')}
        onCancel={() => { setApplyModal(false); applyForm.resetFields(); setApplyUnit(undefined); }}
        onOk={() => applyForm.validateFields().then(v => applyMut.mutate(v))}
        okText={t('fees.concession.applyBtn')} cancelText={t('app.cancel')} confirmLoading={applyMut.isPending}>
        <Alert message={t('fees.concession.applyWarning')} type="warning" showIcon style={{ marginBottom: 12 }} />
        <Form form={applyForm} layout="vertical">
          <Form.Item label={t('fees.concession.fields.school')}>
            <Select
              placeholder={t('fees.schoolPlaceholder')}
              options={(units as any[]).map((u: any) => ({ value: u.id, label: u.nameMr }))}
              onChange={v => { setApplyUnit(v); applyForm.setFieldValue('studentId', undefined); }}
              allowClear
            />
          </Form.Item>
          <Form.Item name="studentId" label={t('fees.concession.fields.student')} rules={[{ required: true }]}>
            <StudentSearchSelect
              unitId={applyUnit}
              onChange={(id) => applyForm.setFieldValue('studentId', id)}
              placeholder={t('fees.concession.fields.searchStudent')}
            />
          </Form.Item>
          <Form.Item name="academicYearId" label={t('fees.concession.fields.academicYear')} rules={[{ required: true }]}>
            <Select options={(academicYears as any[]).map((y: any) => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
          </Form.Item>
          <Form.Item name="templateId" label={t('fees.concession.fields.template')} rules={[{ required: true }]}>
            <Select options={(templates as any[]).map((tpl: any) => ({ value: tpl.id, label: tpl.nameMr }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page — thin orchestrator
// ═══════════════════════════════════════════════════════════════════════════════
export default function FeesPage() {
  const { t } = useTranslation();
  const { user: me } = useAuthStore();
  const { unitId: lockedUnitId, canSwitch: canSwitchUnit } = useUnitAccess();
  const { years: academicYearsFromHook, yearId: currentYearId } = useCurrentYear();
  const { selectedUnitId: globalUnit, setSelectedUnitId: setGlobalUnit } = useAppStore();

  // Page-level state shared across all tabs
  const [pageUnit, setPageUnit] = useState<string | undefined>(lockedUnitId ?? globalUnit ?? undefined);
  const [pageYear, setPageYear] = useState<string | undefined>(undefined);
  // Auto-populate year once hook resolves
  useEffect(() => { if (currentYearId && !pageYear) setPageYear(currentYearId); }, [currentYearId]);
  const [activeTab, setActiveTab] = useState('collect');
  const [collectionStudent, setCollectionStudent] = useState<string>();
  const [collectionStudentObj, setCollectionStudentObj] = useState<any>(null);

  const { data: sansthaData } = useQuery({
    queryKey: ['sanstha', me?.sansthaId],
    queryFn: () => sansthaApi.findOne(me!.sansthaId),
    enabled: !!me?.sansthaId,
    staleTime: 5 * 60 * 1000,
  });
  const sansthaName = (sansthaData as any)?.nameMr || 'संस्था';

  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  // Use hook data — already fetched + cached by useCurrentYear
  const academicYears = academicYearsFromHook;

  // Class view → collection handoff
  const handleStudentSelect = (studentId: string, studentObj: any) => {
    setCollectionStudent(studentId);
    setCollectionStudentObj(studentObj);
    setActiveTab('collect');
  };

  const tabProps = { me, units, academicYears, sansthaName, sansthaData };

  return (
    <div style={{ fontFamily: 'Mukta, sans-serif' }}>
      <Row gutter={16} align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>{t('fees.title')}</Title>
        </Col>
        <Col flex="auto" />
        {canSwitchUnit && (
          <Col>
            <Select
              placeholder={t('fees.schoolPlaceholder')}
              style={{ minWidth: 200 }}
              value={pageUnit}
              onChange={v => { setPageUnit(v); setGlobalUnit(v); }}
              allowClear
              options={(units as any[]).map((u: any) => ({ value: u.id, label: u.nameMr }))}
            />
          </Col>
        )}
        <Col>
          <Select
            placeholder={t('fees.yearPlaceholder')}
            style={{ minWidth: 160 }}
            value={pageYear}
            onChange={setPageYear}
            allowClear
            options={(academicYears as any[]).map((y: any) => ({
              value: y.id,
              label: y.isCurrent ? t('fees.currentYear', { year: y.labelMr || y.labelEn }) : (y.labelMr || y.labelEn),
            }))}
          />
        </Col>
      </Row>

      {/* Metrics bar — always visible when unit+year selected */}
      <FeeMetricsBar unitId={pageUnit} academicYearId={pageYear} />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'collect',
            label: t('fees.tabs.collection'),
            children: !pageUnit ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#5b626f' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>↑</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>शाळा निवडा</div>
                <div style={{ fontSize: 14, color: '#8b94a3' }}>
                  वरील &quot;शाळा&quot; निवडल्यानंतर शुल्क संकलन सुरू होईल
                </div>
              </div>
            ) : (
              <FeeCollectionTabNew
                {...tabProps}
                pageUnit={pageUnit}
                pageYear={pageYear}
                externalStudent={collectionStudent}
                externalStudentObj={collectionStudentObj}
              />
            ),
          },
          {
            key: 'classview',
            label: t('fees.tabs.classView'),
            children: (
              <ClassViewTab
                me={me}
                units={units as any[]}
                academicYears={academicYears as any[]}
                pageUnit={pageUnit}
                pageYear={pageYear}
                onStudentSelect={handleStudentSelect}
              />
            ),
          },
          { key: 'defaulters', label: t('fees.tabs.defaulters'), children: <DefaultersTab {...tabProps} /> },
          {
            key: 'structures',
            label: t('fees.tabs.structures'),
            children: (
              <>
                <FeeStructureTab
                  me={me}
                  units={units as any[]}
                  academicYears={academicYears as any[]}
                  pageUnit={pageUnit}
                  pageYear={pageYear}
                />
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px dashed #BCD4E8' }}>
                  <Typography.Title level={5} style={{ color: '#1A3A5C', marginBottom: 12 }}>🎫 {t('fees.tabs.concession')}</Typography.Title>
                  <ConcessionTab me={me} units={units} academicYears={academicYears} />
                </div>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
