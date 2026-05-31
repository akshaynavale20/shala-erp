import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Modal, Form, Input, Select, Space, Tag, message,
  Typography, InputNumber, Row, Col, Tabs, Alert,
} from 'antd';
import {
  PlusOutlined, CheckOutlined, DollarOutlined,
  FileTextOutlined, SettingOutlined, FilePdfOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { salaryApi, staffApi, financialYearApi, sansthaApi, unitApi } from '../../api/client';
import { downloadSalarySlip } from '../../pdf/SalarySlip';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { MrInput } from '../../components/common/MrInput';

const { Text, Title } = Typography;

const STATUS_COLORS: Record<string, string> = { draft: 'default', approved: 'blue', paid: 'green', cancelled: 'red' };

export default function SalaryPage() {
  const { t } = useTranslation();
  const { user: me } = useAuthStore();
  const { selectedUnitId: globalUnit, setSelectedUnitId: setGlobalUnit } = useAppStore();
  const qc = useQueryClient();
  const [filterUnit, setFilterUnit] = useState<string | undefined>(globalUnit ?? undefined);

  const MONTH_NAMES = t('salary.months', { returnObjects: true }) as string[];

  const { data: sansthaData } = useQuery({
    queryKey: ['sanstha', me?.sansthaId],
    queryFn: () => sansthaApi.findOne(me!.sansthaId),
    enabled: !!me?.sansthaId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
    staleTime: 10 * 60 * 1000,
  });
  const [activeTab, setActiveTab] = useState('slips');
  const [createOpen, setCreateOpen] = useState(false);
  const [compOpen, setCompOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<any>(null);
  const [earnings, setEarnings] = useState<{ nameMr: string; amount: number }[]>([{ nameMr: '', amount: 0 }]);
  const [deductions, setDeductions] = useState<{ nameMr: string; amount: number }[]>([]);
  const [form] = Form.useForm();
  const [compForm] = Form.useForm();
  const [payForm] = Form.useForm();

  // Auto-populate from previous month
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [autoFilledFrom, setAutoFilledFrom] = useState<string | null>(null);

  const { data: staffSlips = [] } = useQuery({
    queryKey: ['salary-slips-staff', me?.sansthaId, selectedStaffId],
    queryFn: () => salaryApi.findSlips(me!.sansthaId, selectedStaffId!),
    enabled: !!selectedStaffId,
    staleTime: 0,
  });

  // When staffSlips loads/changes, auto-fill from latest slip
  useEffect(() => {
    if (staffSlips.length > 0 && createOpen) handleAutofillFromSlips(staffSlips);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffSlips]);

  const handleStaffChange = (staffId: string) => {
    setSelectedStaffId(staffId);
    setAutoFilledFrom(null);
  };

  const handleAutofillFromSlips = (slips: any[]) => {
    if (!slips.length) return;
    const sorted = [...slips].sort((a, b) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month
    );
    const latest = sorted[0];
    if (!latest) return;

    const newEarnings = (latest.earnings || []).map((e: any) => ({ nameMr: e.nameMr, amount: e.amount }));
    const newDeductions = (latest.deductions || []).map((d: any) => ({ nameMr: d.nameMr, amount: d.amount }));

    if (newEarnings.length > 0) setEarnings(newEarnings);
    if (newDeductions.length > 0) setDeductions(newDeductions);
    setAutoFilledFrom(`${MONTH_NAMES[latest.month - 1]} ${latest.year}`);
  };

  const { data: slips = [], isLoading } = useQuery({
    queryKey: ['salary-slips', me?.sansthaId],
    queryFn: () => salaryApi.findSlips(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });
  const { data: staff = [] } = useQuery({
    queryKey: ['staff', me?.sansthaId],
    queryFn: () => staffApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });
  const { data: components = [] } = useQuery({
    queryKey: ['salary-components', me?.sansthaId],
    queryFn: () => salaryApi.findComponents(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });
  const { data: financialYears = [] } = useQuery({
    queryKey: ['financial-years', me?.sansthaId],
    queryFn: () => financialYearApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['salary-slips'] });

  const createMutation = useMutation({
    mutationFn: (v: any) => salaryApi.createSlip({
      ...v, sansthaId: me!.sansthaId,
      earnings: earnings.filter(e => e.nameMr && e.amount),
      deductions: deductions.filter(d => d.nameMr && d.amount),
    }),
    onSuccess: () => {
      message.success(t('salary.slipCreated')); invalidate();
      setCreateOpen(false); form.resetFields();
      setEarnings([{ nameMr: '', amount: 0 }]); setDeductions([]);
      setSelectedStaffId(null); setAutoFilledFrom(null);
    },
    onError: () => message.error(t('app.error')),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => salaryApi.approve(id),
    onSuccess: () => { message.success(t('salary.approved')); invalidate(); },
  });

  const payMutation = useMutation({
    mutationFn: (v: any) => salaryApi.markPaid(payOpen.id, v),
    onSuccess: () => {
      message.success(t('salary.paid'));
      invalidate();
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setPayOpen(null); payForm.resetFields();
    },
  });

  const compMutation = useMutation({
    mutationFn: (v: any) => salaryApi.createComponent({ ...v, sansthaId: me!.sansthaId }),
    onSuccess: () => {
      message.success(t('salary.componentSaved'));
      qc.invalidateQueries({ queryKey: ['salary-components'] });
      setCompOpen(false); compForm.resetFields();
    },
  });

  const gross = earnings.reduce((s, e) => s + (+e.amount || 0), 0);
  const totalDed = deductions.reduce((s, d) => s + (+d.amount || 0), 0);

  const slipColumns = [
    {
      title: t('salary.columns.staff'), key: 'staff',
      render: (_: any, rec: any) => {
        const s = (staff as any[]).find(s => s.id === rec.staffId);
        return s?.nameMr || '—';
      },
    },
    { title: t('salary.columns.period'), key: 'period', render: (_: any, rec: any) => `${MONTH_NAMES[rec.month - 1]} ${rec.year}` },
    { title: t('salary.columns.netSalary'), dataIndex: 'netSalary', key: 'net', render: (v: number) => `₹ ${(+v).toLocaleString('mr-IN')}` },
    {
      title: t('salary.columns.status'), dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag color={STATUS_COLORS[v]}>{t(`salary.status.${v}`, { defaultValue: v })}</Tag>,
    },
    {
      title: t('salary.columns.actions'), key: 'actions', width: 160,
      render: (_: any, rec: any) => (
        <Space>
          {rec.status === 'draft' && (
            <Button size="small" icon={<CheckOutlined />} onClick={() => approveMutation.mutate(rec.id)}>{t('salary.approveBtn')}</Button>
          )}
          {rec.status === 'approved' && (
            <Button size="small" icon={<DollarOutlined />} type="primary"
              onClick={() => setPayOpen(rec)}>{t('salary.payBtn')}</Button>
          )}
          {rec.status === 'paid' && (
            <Button size="small" icon={<FilePdfOutlined />}
              onClick={() => {
                const s = (staff as any[]).find(s => s.id === rec.staffId);
                const u = (units as any[]).find((u: any) => u.id === rec.unitId);
                downloadSalarySlip({ slip: rec, staff: s || null, sanstha: sansthaData, unit: u, userName: me?.nameMr || me?.email });
              }}>
              PDF
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const compColumns = [
    { title: t('salary.columns.componentName'), dataIndex: 'nameMr', key: 'name' },
    {
      title: t('salary.columns.componentType'), dataIndex: 'isEarning', key: 'type',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('salary.earnings') : t('salary.deductions')}</Tag>,
    },
  ];

  const paymentModeOpts = [
    { value: 'cash', label: t('salary.paymentModes.cash') },
    { value: 'cheque', label: t('salary.paymentModes.cheque') },
    { value: 'neft', label: t('salary.paymentModes.neft') },
    { value: 'upi', label: t('salary.paymentModes.upi') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <DollarOutlined style={{ fontSize: 18, color: '#1A3A5C' }} />
        <Title level={4} style={{ margin: 0, color: '#1A3A5C', fontSize: 16 }}>{t('salary.title')}</Title>
      </div>

      {/* Body with Tabs */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff', padding: '0 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginTop: 4 }}
          items={[
            {
              key: 'slips',
              label: <span><FileTextOutlined /> {t('salary.tabs.slips')}</span>,
              children: (
                <div>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Select
                      placeholder={t('salary.schoolFilter')}
                      allowClear
                      style={{ width: 220 }}
                      value={filterUnit}
                      onChange={(v) => { setFilterUnit(v); setGlobalUnit(v ?? null); }}
                      options={(units as any[]).map((u: any) => ({ value: u.id, label: u.nameMr || u.nameEn }))}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                      {t('salary.newSlip')}
                    </Button>
                  </div>
                  <Table
                    dataSource={filterUnit ? (slips as any[]).filter((s: any) => s.unitId === filterUnit) : slips as any[]}
                    columns={slipColumns} rowKey="id" loading={isLoading}
                    scroll={{ x: 700 }}
                  />
                </div>
              ),
            },
            {
              key: 'components',
              label: <span><SettingOutlined /> {t('salary.tabs.components')}</span>,
              children: (
                <div>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCompOpen(true)}>
                      {t('salary.newComponent')}
                    </Button>
                  </div>
                  <Table dataSource={components} columns={compColumns} rowKey="id" size="small" />
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Create slip modal */}
      <Modal title={t('salary.createSlipTitle')} open={createOpen} onCancel={() => {
        setCreateOpen(false); form.resetFields();
        setEarnings([{ nameMr: '', amount: 0 }]); setDeductions([]);
        setSelectedStaffId(null); setAutoFilledFrom(null);
      }} footer={null} width={640}>
        <Form form={form} layout="vertical" onFinish={createMutation.mutate}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="staffId" label={t('salary.fields.staff')} rules={[{ required: true }]}>
              <Select
                showSearch optionFilterProp="label"
                options={(staff as any[]).map(s => ({ value: s.id, label: s.nameMr }))}
                onChange={(val) => {
                  handleStaffChange(val);
                  setTimeout(() => {
                    qc.fetchQuery({
                      queryKey: ['salary-slips-staff', me?.sansthaId, val],
                      queryFn: () => salaryApi.findSlips(me!.sansthaId, val),
                    }).then((fetchedSlips: any) => {
                      handleAutofillFromSlips(fetchedSlips as any[]);
                    });
                  }, 0);
                }}
              />
            </Form.Item></Col>
            <Col span={6}><Form.Item name="month" label={t('salary.fields.month')} rules={[{ required: true }]}>
              <Select options={MONTH_NAMES.map((m, i) => ({ value: i + 1, label: m }))} showSearch={false} />
            </Form.Item></Col>
            <Col span={6}><Form.Item name="year" label={t('salary.fields.year')} rules={[{ required: true }]} initialValue={dayjs().year()}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}><Form.Item name="financialYearId" label={t('salary.fields.financialYear')} rules={[{ required: true }]}>
              <Select options={(financialYears as any[]).map((fy: any) => ({ value: fy.id, label: fy.labelMr || fy.labelEn }))} placeholder={t('salary.fields.selectFinancialYear')} />
            </Form.Item></Col>
          </Row>

          {/* Auto-fill notice */}
          {autoFilledFrom && (
            <Alert
              type="info"
              showIcon
              message={t('salary.autoFillNotice', { month: autoFilledFrom })}
              style={{ marginBottom: 12 }}
              closable
              onClose={() => setAutoFilledFrom(null)}
            />
          )}

          <Text strong>{t('salary.earnings')}</Text>
          {earnings.map((e, i) => (
            <Row gutter={8} key={i} style={{ marginBottom: 4 }}>
              <Col span={14}><MrInput placeholder={t('salary.earningNamePlaceholder')} value={e.nameMr}
                onChange={(ev: any) => { const a = [...earnings]; a[i].nameMr = ev.target.value; setEarnings(a); }} /></Col>
              <Col span={8}><InputNumber placeholder={t('salary.amountPlaceholder')} value={e.amount} style={{ width: '100%' }}
                onChange={v => { const a = [...earnings]; a[i].amount = v || 0; setEarnings(a); }} /></Col>
              <Col span={2}><Button danger size="small" onClick={() => setEarnings(earnings.filter((_, j) => j !== i))}>×</Button></Col>
            </Row>
          ))}
          <Button size="small" onClick={() => setEarnings([...earnings, { nameMr: '', amount: 0 }])} style={{ marginBottom: 12 }}>{t('salary.addEarning')}</Button>
          <Text strong style={{ display: 'block', marginTop: 8 }}>{t('salary.deductions')}</Text>
          {deductions.map((d, i) => (
            <Row gutter={8} key={i} style={{ marginBottom: 4 }}>
              <Col span={14}><MrInput placeholder={t('salary.deductionNamePlaceholder')} value={d.nameMr}
                onChange={(ev: any) => { const a = [...deductions]; a[i].nameMr = ev.target.value; setDeductions(a); }} /></Col>
              <Col span={8}><InputNumber placeholder={t('salary.amountPlaceholder')} value={d.amount} style={{ width: '100%' }}
                onChange={v => { const a = [...deductions]; a[i].amount = v || 0; setDeductions(a); }} /></Col>
              <Col span={2}><Button danger size="small" onClick={() => setDeductions(deductions.filter((_, j) => j !== i))}>×</Button></Col>
            </Row>
          ))}
          <Button size="small" onClick={() => setDeductions([...deductions, { nameMr: '', amount: 0 }])} style={{ marginBottom: 12 }}>{t('salary.addDeduction')}</Button>
          <div style={{ padding: '8px 0', borderTop: '1px solid #eee', marginBottom: 12 }}>
            <Text>{t('salary.grossSummary', { gross: gross.toLocaleString('mr-IN'), ded: totalDed.toLocaleString('mr-IN') })} </Text>
            <Text strong>{t('salary.netSalary', { net: (gross - totalDed).toLocaleString('mr-IN') })}</Text>
          </div>
          <Space>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>{t('app.save')}</Button>
            <Button onClick={() => setCreateOpen(false)}>{t('app.cancel')}</Button>
          </Space>
        </Form>
      </Modal>

      {/* Mark paid modal */}
      <Modal title={t('salary.markPaidTitle')} open={!!payOpen} onCancel={() => setPayOpen(null)} footer={null}>
        <Form form={payForm} layout="vertical" onFinish={payMutation.mutate}>
          <Form.Item name="paymentDate" label={t('salary.fields.paymentDate')} rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item name="paymentMode" label={t('salary.fields.paymentMode')} initialValue="cash">
            <Select options={paymentModeOpts} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={payMutation.isPending}>{t('app.confirm')}</Button>
            <Button onClick={() => setPayOpen(null)}>{t('app.cancel')}</Button>
          </Space>
        </Form>
      </Modal>

      {/* Salary component modal */}
      <Modal title={t('salary.componentTitle')} open={compOpen} onCancel={() => setCompOpen(false)} footer={null}>
        <Form form={compForm} layout="vertical" onFinish={compMutation.mutate}>
          <Form.Item name="nameMr" label={t('salary.fields.componentName')} rules={[{ required: true }]}><MrInput /></Form.Item>
          <Form.Item name="isEarning" label={t('salary.fields.componentType')} initialValue={true}>
            <Select options={[{ value: true, label: t('salary.earnings') }, { value: false, label: t('salary.deductions') }]} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={compMutation.isPending}>{t('app.save')}</Button>
            <Button onClick={() => setCompOpen(false)}>{t('app.cancel')}</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
