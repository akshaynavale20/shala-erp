import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Modal, Form, Select, InputNumber, DatePicker, Space, Tag,
  Switch, Row, Col, Typography, Alert, Divider, Tooltip, Popconfirm, message,
  Card, Badge,
} from 'antd';
import {
  PlusOutlined, LinkOutlined, EditOutlined, CopyOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { feeApi, gradeApi } from '../../api/client';
import { MrInput } from '../../components/common/MrInput';

const { Text, Title } = Typography;

const FEE_TYPE_COLORS: Record<string, string> = {
  tuition: 'blue', exam: 'orange', library: 'green', sports: 'cyan',
  computer: 'purple', transport: 'gold', hostel: 'volcano', misc: 'default',
};

interface Props {
  me: any;
  units: any[];
  academicYears: any[];
  pageUnit?: string;
  pageYear?: string;
}

// ─── Attach-to-grades modal ───────────────────────────────────────────────────
interface GradeOverride {
  gradeConfigId: string;
  gradeLabelMr: string;
  checked: boolean;
  amount: number;
  dueDate: string;
  installmentCount: number;
}

function AttachModal({
  template,
  unitId,
  academicYearId,
  onClose,
}: {
  template: any;
  unitId: string;
  academicYearId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: gradeConfigs = [] } = useQuery({
    queryKey: ['grade-configs', unitId, academicYearId],
    queryFn: () => gradeApi.findByUnit(unitId, academicYearId),
    enabled: !!unitId && !!academicYearId,
  });

  const { data: attachedStructures = [] } = useQuery({
    queryKey: ['fee-structures-by-template', template.id],
    queryFn: () => feeApi.findStructures(template.sansthaId, { unitId, academicYearId }),
    enabled: !!unitId && !!academicYearId,
  });

  // Build initial overrides — one row per grade config
  const [overrides, setOverrides] = useState<GradeOverride[]>(() =>
    (gradeConfigs as any[]).map((g: any) => ({
      gradeConfigId: g.id,
      gradeLabelMr: g.gradeLabelMr,
      checked: false,
      amount: Number(template.amount),
      dueDate: template.dueDate || '',
      installmentCount: template.installmentCount || 1,
    }))
  );

  // Refresh overrides when gradeConfigs loads
  const derivedOverrides = useMemo(() => {
    const alreadyAttached = new Set(
      (attachedStructures as any[])
        .filter((s: any) => s.sourceTemplateId === template.id)
        .map((s: any) => s.gradeConfigId)
    );
    return (gradeConfigs as any[]).map((g: any) => {
      const existing = overrides.find(o => o.gradeConfigId === g.id);
      return existing ?? {
        gradeConfigId: g.id,
        gradeLabelMr: g.gradeLabelMr,
        checked: false,
        amount: Number(template.amount),
        dueDate: template.dueDate || '',
        installmentCount: template.installmentCount || 1,
        alreadyAttached: alreadyAttached.has(g.id),
      };
    }).map(o => ({ ...o, alreadyAttached: alreadyAttached.has(o.gradeConfigId) }));
  }, [gradeConfigs, attachedStructures, template, overrides]);

  const updateOverride = (gradeConfigId: string, field: keyof GradeOverride, value: any) => {
    setOverrides(prev => {
      const idx = prev.findIndex(o => o.gradeConfigId === gradeConfigId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: value };
        return next;
      }
      // add new entry from derived
      const g = derivedOverrides.find(o => o.gradeConfigId === gradeConfigId);
      if (g) return [...prev, { ...g, [field]: value }];
      return prev;
    });
  };

  const getOverride = (gradeConfigId: string): GradeOverride & { alreadyAttached?: boolean } => {
    return derivedOverrides.find(o => o.gradeConfigId === gradeConfigId) ?? {
      gradeConfigId, gradeLabelMr: '', checked: false,
      amount: Number(template.amount), dueDate: template.dueDate || '',
      installmentCount: template.installmentCount || 1,
    };
  };

  const attachMutation = useMutation({
    mutationFn: () => {
      const selected = derivedOverrides.filter(o => o.checked);
      if (!selected.length) throw new Error(t('fees.structure.selectAtLeastOneGrade'));
      return feeApi.attachTemplateToGrades(
        template.id,
        selected.map(o => ({
          gradeConfigId: o.gradeConfigId,
          amount: o.amount,
          dueDate: o.dueDate || undefined,
          installmentCount: o.installmentCount,
        })),
      );
    },
    onSuccess: (result: any[]) => {
      message.success(t('fees.structure.attachSuccess', { count: result.length }));
      qc.invalidateQueries({ queryKey: ['fee-structures'] });
      onClose();
    },
    onError: (e: any) => message.error(e.message || e.response?.data?.message || t('app.error')),
  });

  const allChecked = derivedOverrides.every(o => o.checked);
  const toggleAll = () => {
    const next = !allChecked;
    setOverrides(derivedOverrides.map(o => ({ ...o, checked: next })));
  };

  const cols = [
    {
      title: (
        <Switch
          size="small"
          checked={allChecked}
          onChange={toggleAll}
          checkedChildren={t('fees.structure.columns.allGrades')}
          unCheckedChildren="—"
        />
      ),
      key: 'sel', width: 60,
      render: (_: any, rec: any) => {
        const o = getOverride(rec.id);
        return (
          <Switch
            size="small"
            checked={o.checked}
            onChange={v => updateOverride(rec.id, 'checked', v)}
          />
        );
      },
    },
    {
      title: t('fees.structure.columns.grade'), dataIndex: 'gradeLabelMr', key: 'grade', width: 90,
      render: (v: string, rec: any) => {
        const o = getOverride(rec.id);
        return (
          <Space>
            <Text strong>{v}</Text>
            {(o as any).alreadyAttached && (
              <Tooltip title={t('fees.structure.alreadyAttachedTooltip')}>
                <Tag color="blue" style={{ fontSize: 10 }}>{t('fees.structure.alreadyAttached')}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: t('fees.structure.fields.baseAmount'), key: 'amount', width: 130,
      render: (_: any, rec: any) => {
        const o = getOverride(rec.id);
        return (
          <InputNumber
            size="small"
            min={0}
            precision={2}
            value={o.amount}
            disabled={!o.checked}
            onChange={v => updateOverride(rec.id, 'amount', v ?? 0)}
            style={{ width: 110 }}
          />
        );
      },
    },
    {
      title: t('fees.structure.columns.installments'), key: 'inst', width: 90,
      render: (_: any, rec: any) => {
        const o = getOverride(rec.id);
        return (
          <InputNumber
            size="small" min={1} max={12}
            value={o.installmentCount}
            disabled={!o.checked}
            onChange={v => updateOverride(rec.id, 'installmentCount', v ?? 1)}
            style={{ width: 70 }}
          />
        );
      },
    },
    {
      title: t('fees.structure.columns.dueDate'), key: 'due', width: 140,
      render: (_: any, rec: any) => {
        const o = getOverride(rec.id);
        return (
          <DatePicker
            size="small"
            format="DD/MM/YYYY"
            value={o.dueDate ? dayjs(o.dueDate) : null}
            disabled={!o.checked}
            onChange={d => updateOverride(rec.id, 'dueDate', d ? d.format('YYYY-MM-DD') : '')}
            style={{ width: 120 }}
          />
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined />
          <span>{t('fees.structure.attachTitle', { name: template.nameMr })}</span>
        </Space>
      }
      open
      onCancel={onClose}
      width={700}
      footer={
        <Space>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            loading={attachMutation.isPending}
            onClick={() => attachMutation.mutate()}
           
          >
            {t('fees.structure.attachBtn', { count: derivedOverrides.filter(o => o.checked).length })}
          </Button>
          <Button onClick={onClose}>{t('app.cancel')}</Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={t('fees.structure.attachInfo')}
      />
      <Table
        dataSource={gradeConfigs as any[]}
        columns={cols}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: 340 }}
      />
    </Modal>
  );
}

// ─── Main FeeStructureTab ─────────────────────────────────────────────────────
export default function FeeStructureTab({ me, units, academicYears, pageUnit, pageYear }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [attachTemplate, setAttachTemplate] = useState<any>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const sansthaId = me?.sansthaId;

  const feeTypeOpts = [
    { value: 'tuition', label: t('fees.feeTypes.tuition') },
    { value: 'exam', label: t('fees.feeTypes.exam') },
    { value: 'library', label: t('fees.feeTypes.library') },
    { value: 'sports', label: t('fees.feeTypes.sports') },
    { value: 'computer', label: t('fees.feeTypes.computer') },
    { value: 'transport', label: t('fees.feeTypes.transport') },
    { value: 'hostel', label: t('fees.feeTypes.hostel') },
    { value: 'misc', label: t('fees.feeTypes.misc') },
  ];

  // Templates — fee_structures with is_template=true
  const { data: templates = [], isLoading: tplLoading } = useQuery({
    queryKey: ['fee-structures', sansthaId, pageUnit, pageYear, 'templates'],
    queryFn: () => feeApi.findStructures(sansthaId, { unitId: pageUnit, academicYearId: pageYear, isTemplate: true }),
    enabled: !!sansthaId,
  });

  // Attached structures — fee_structures with is_template=false
  const { data: attachedStructures = [], isLoading: strLoading } = useQuery({
    queryKey: ['fee-structures', sansthaId, pageUnit, pageYear, 'attached'],
    queryFn: () => feeApi.findStructures(sansthaId, { unitId: pageUnit, academicYearId: pageYear, isTemplate: false }),
    enabled: !!sansthaId,
  });

  // Grade config name map
  const { data: gradeConfigs = [] } = useQuery({
    queryKey: ['grade-configs', pageUnit, pageYear],
    queryFn: () => gradeApi.findByUnit(pageUnit!, pageYear ?? undefined),
    enabled: !!pageUnit,
  });
  const gradeMap = useMemo(() =>
    Object.fromEntries((gradeConfigs as any[]).map((g: any) => [g.id, g.gradeLabelMr])),
    [gradeConfigs]
  );
  const unitMap = useMemo(() =>
    Object.fromEntries((units as any[]).map((u: any) => [u.id, u.nameMr])),
    [units]
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['fee-structures'] });
  };

  const createMutation = useMutation({
    mutationFn: (vals: any) => {
      const payload = {
        ...vals,
        sansthaId,
        dueDate: vals.dueDate ? vals.dueDate.format('YYYY-MM-DD') : undefined,
        isTemplate: true,
      };
      return feeApi.createStructure(payload);
    },
    onSuccess: () => {
      message.success(t('fees.structure.templateCreated'));
      invalidate();
      setCreateOpen(false);
      form.resetFields();
    },
    onError: (e: any) => message.error(e.response?.data?.message || t('app.error')),
  });

  const updateMutation = useMutation({
    mutationFn: (vals: any) => {
      const payload = {
        ...vals,
        dueDate: vals.dueDate ? vals.dueDate.format('YYYY-MM-DD') : undefined,
      };
      return feeApi.updateStructure(editRecord.id, payload);
    },
    onSuccess: () => {
      message.success(t('app.saved'));
      invalidate();
      setEditRecord(null);
    },
    onError: (e: any) => message.error(e.response?.data?.message || t('app.error')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => feeApi.updateStructure(id, { isActive: false }),
    onSuccess: () => { message.success(t('fees.structure.deactivated')); invalidate(); },
    onError: () => message.error(t('app.error')),
  });

  const openEdit = (rec: any) => {
    setEditRecord(rec);
    editForm.setFieldsValue({
      ...rec,
      dueDate: rec.dueDate ? dayjs(rec.dueDate) : null,
    });
  };

  // Template columns
  const tplCols = [
    {
      title: t('fees.structure.columns.templateName'), dataIndex: 'nameMr', key: 'name',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: t('fees.structure.columns.type'), dataIndex: 'feeType', key: 'type',
      render: (v: string) => {
        const lbl = t(`fees.feeTypes.${v}`, { defaultValue: v });
        return <Tag color={FEE_TYPE_COLORS[v]}>{lbl}</Tag>;
      },
    },
    {
      title: t('fees.structure.columns.amount'), dataIndex: 'amount', key: 'amount',
      render: (v: number) => <Text>₹{Number(v).toLocaleString('mr-IN')}</Text>,
    },
    {
      title: t('fees.structure.columns.installments'), dataIndex: 'installmentCount', key: 'inst',
      render: (v: number) => <Tag>{v > 1 ? t('fees.structure.installmentLabelPlural', { count: v }) : t('fees.structure.installmentLabel', { count: v })}</Tag>,
    },
    {
      title: t('fees.structure.columns.attachedGrades'), key: 'attached',
      render: (_: any, rec: any) => {
        const count = (attachedStructures as any[]).filter((s: any) => s.sourceTemplateId === rec.id).length;
        return count > 0 ? <Badge count={count} color="#1A5276" overflowCount={20} /> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: t('fees.structure.columns.actions'), key: 'actions', width: 150,
      render: (_: any, rec: any) => (
        <Space>
          <Tooltip title={t('fees.structure.attachTitle', { name: '' }).trim()}>
            <Button
              size="small" type="primary" icon={<LinkOutlined />}
             
              onClick={() => setAttachTemplate(rec)}
              disabled={!pageUnit || !pageYear}
            >
              {t('app.add')}
            </Button>
          </Tooltip>
          <Tooltip title={t('app.edit')}>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Attached structure columns
  const attachedCols = [
    {
      title: t('fees.structure.columns.feeName'), dataIndex: 'nameMr', key: 'name',
      render: (v: string, rec: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{v}</Text>
          {rec.sourceTemplateId && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              <CopyOutlined /> {t('fees.structure.templates')}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: t('fees.structure.columns.type'), dataIndex: 'feeType', key: 'type',
      render: (v: string) => <Tag color={FEE_TYPE_COLORS[v]}>{t(`fees.feeTypes.${v}`, { defaultValue: v })}</Tag>,
    },
    {
      title: t('fees.structure.columns.grade'), dataIndex: 'gradeConfigId', key: 'grade',
      render: (v: string) => v ? <Tag color="geekblue">{gradeMap[v] || v}</Tag> : <Tag color="default">{t('fees.structure.columns.allGrades')}</Tag>,
    },
    {
      title: t('fees.structure.columns.school'), dataIndex: 'unitId', key: 'unit',
      render: (v: string) => <Text type="secondary">{unitMap[v] || v}</Text>,
    },
    {
      title: t('fees.structure.columns.amount'), dataIndex: 'amount', key: 'amount',
      render: (v: number) => <Text strong>₹{Number(v).toLocaleString('mr-IN')}</Text>,
    },
    {
      title: t('fees.structure.columns.installments'), dataIndex: 'installmentCount', key: 'inst',
      render: (v: number) => v > 1 ? <Tag color="blue">{t('fees.structure.installmentLabelPlural', { count: v })}</Tag> : <Tag>{t('fees.structure.oneTime')}</Tag>,
    },
    {
      title: t('fees.structure.columns.dueDate'), dataIndex: 'dueDate', key: 'due',
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: t('fees.structure.columns.actions'), key: 'actions', width: 100,
      render: (_: any, rec: any) => (
        <Space>
          <Tooltip title={t('app.edit')}>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)} />
          </Tooltip>
          <Popconfirm
            title={t('fees.structure.deactivateConfirm')}
            onConfirm={() => deactivateMutation.mutate(rec.id)}
            okText={t('app.yes')} cancelText={t('app.no')}
          >
            <Button size="small" danger>{t('fees.structure.deactivate')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const feeFormFields = (
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item name="nameMr" label={t('fees.structure.fields.feeName')} rules={[{ required: true }]}>
          <MrInput />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="unitId" label={t('fees.structure.fields.school')} rules={[{ required: true }]}>
          <Select options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="academicYearId" label={t('fees.structure.fields.academicYear')} rules={[{ required: true }]}>
          <Select options={(academicYears as any[]).map(y => ({ value: y.id, label: y.labelMr || y.labelEn }))} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="feeType" label={t('fees.structure.fields.feeType')} rules={[{ required: true }]}>
          <Select options={feeTypeOpts} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="amount" label={t('fees.structure.fields.baseAmount')} rules={[{ required: true }]}>
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="installmentCount" label={t('fees.structure.fields.installmentCount')} initialValue={1}>
          <InputNumber min={1} max={12} style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="dueDate" label={t('fees.structure.fields.dueDate')}>
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="isMandatory" label={t('fees.structure.fields.mandatory')} valuePropName="checked" initialValue={true}>
          <Switch checkedChildren={t('app.yes')} unCheckedChildren={t('app.no')} />
        </Form.Item>
      </Col>
    </Row>
  );

  return (
    <div>
      {(!pageUnit || !pageYear) && (
        <Alert
          type="info"
          showIcon
          message={t('fees.structure.selectInfo')}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* ── Templates ── */}
      <Card
        size="small"
        title={<Title level={5} style={{ margin: 0 }}>{t('fees.structure.templates')}</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('fees.structure.newTemplate')}
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Alert
          type="info" showIcon style={{ marginBottom: 10 }}
          message={t('fees.structure.templateInfo')}
        />
        <Table
          dataSource={templates as any[]}
          columns={tplCols}
          rowKey="id"
          loading={tplLoading}
          size="small"
          pagination={false}
          locale={{ emptyText: t('fees.structure.noTemplates') }}
        />
      </Card>

      <Divider />

      {/* ── Attached fee structures ── */}
      <Card
        size="small"
        title={<Title level={5} style={{ margin: 0 }}>{t('fees.structure.attachedTitle')}</Title>}
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('fees.structure.attachedInfo')}
          </Text>
        }
      >
        <Table
          dataSource={attachedStructures as any[]}
          columns={attachedCols}
          rowKey="id"
          loading={strLoading}
          size="small"
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: t('fees.structure.noAttached') }}
        />
      </Card>

      {/* Create template modal */}
      <Modal
        title={t('fees.structure.createTemplate')}
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        footer={null}
        width={620}
      >
        <Form form={form} layout="vertical" onFinish={createMutation.mutate}>
          {feeFormFields}
          <Space style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              {t('fees.structure.templateSave')}
            </Button>
            <Button onClick={() => { setCreateOpen(false); form.resetFields(); }}>{t('app.cancel')}</Button>
          </Space>
        </Form>
      </Modal>

      {/* Edit modal (works for both templates and attached structures) */}
      <Modal
        title={t('fees.structure.editTitle', { name: editRecord?.nameMr })}
        open={!!editRecord}
        onCancel={() => setEditRecord(null)}
        footer={null}
        width={620}
      >
        <Form form={editForm} layout="vertical" onFinish={updateMutation.mutate}>
          {feeFormFields}
          <Space style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              {t('app.save')}
            </Button>
            <Button onClick={() => setEditRecord(null)}>{t('app.cancel')}</Button>
          </Space>
        </Form>
      </Modal>

      {/* Attach-to-grades modal */}
      {attachTemplate && pageUnit && pageYear && (
        <AttachModal
          template={attachTemplate}
          unitId={pageUnit}
          academicYearId={pageYear}
          onClose={() => setAttachTemplate(null)}
        />
      )}
    </div>
  );
}
