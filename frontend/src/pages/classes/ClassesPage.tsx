import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space, message,
  Typography, Popconfirm, Row, Col, Tag, InputNumber,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradeApi, unitApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { useCurrentYear } from '../../hooks/useCurrentYear';
import { MrInput } from '../../components/common/MrInput';


const { Text } = Typography;

const GRADE_LEVEL_OPTS = [
  { value: 'pre_primary', label: 'पूर्व प्राथमिक' },
  { value: 'primary',     label: 'प्राथमिक (१-४)' },
  { value: 'upper_primary', label: 'उच्च प्राथमिक (५-८)' },
  { value: 'secondary',  label: 'माध्यमिक (९-१०)' },
  { value: 'hsc',        label: 'उच्च माध्यमिक (११-१२)' },
];

const PROMOTION_OPTS = [
  { value: 'auto',         label: 'स्वयंचलित (RTE)' },
  { value: 'manual',       label: 'हस्तचलित' },
  { value: 'board_result', label: 'बोर्ड निकाल' },
];


// ── Division Modal ────────────────────────────────────────────────────────────
function DivisionModal({
  open, onClose, onSave, editRecord, grade, loading,
}: {
  open: boolean; onClose: () => void; onSave: (v: any) => void;
  editRecord: any; grade: any; loading: boolean;
}) {
  const [form] = Form.useForm();

  return (
    <Modal
      title={editRecord ? 'तुकडी संपादित' : `${grade?.gradeLabelMr || 'इयत्ता'} — नवीन तुकडी`}
      open={open} onCancel={onClose} footer={null} width={400} forceRender
      afterOpenChange={v => { if (!v) form.resetFields(); }}
    >
      <Form form={form} layout="vertical" initialValues={editRecord || {}} onFinish={onSave}>
        <Form.Item name="nameMr" label="तुकडीचे नाव" rules={[{ required: true }]}>
          <MrInput placeholder="तुकडी अ, तुकडी ब..." />
        </Form.Item>
        <Form.Item name="roomNumber" label="खोली क्रमांक">
          <Input />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editRecord ? 'अद्यतन' : 'जोडा'}
          </Button>
          <Button onClick={onClose}>रद्द करा</Button>
        </Space>
      </Form>
    </Modal>
  );
}

// ── Grade Modal ───────────────────────────────────────────────────────────────
function GradeModal({
  open, onClose, onSave, editRecord, loading,
}: {
  open: boolean; onClose: () => void; onSave: (v: any) => void; editRecord: any; loading: boolean;
}) {
  const [form] = Form.useForm();

  return (
    <Modal
      title={editRecord ? 'इयत्ता संपादित करा' : 'नवीन इयत्ता जोडा'}
      open={open} onCancel={onClose} footer={null} width={460} forceRender
      afterOpenChange={v => { if (!v) form.resetFields(); }}
    >
      <Form form={form} layout="vertical" initialValues={editRecord || { promotionMode: 'manual' }} onFinish={onSave}>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name="gradeNumber" label="इयत्ता क्र." rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} max={12} placeholder="5" />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item name="gradeLabelMr" label="इयत्तेचे नाव (मराठी)" rules={[{ required: true }]}>
              <MrInput placeholder="इयत्ता पाचवी" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="level" label="स्तर" rules={[{ required: true }]}>
              <Select options={GRADE_LEVEL_OPTS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="promotionMode" label="प्रोत्साहन पद्धत">
              <Select options={PROMOTION_OPTS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="passMarksPct" label="उत्तीर्ण गुण (%)">
              <InputNumber style={{ width: '100%' }} min={0} max={100} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="minAttendancePct" label="किमान उपस्थिती (%)">
              <InputNumber style={{ width: '100%' }} min={0} max={100} />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editRecord ? 'अद्यतन' : 'जोडा'}
          </Button>
          <Button onClick={onClose}>रद्द करा</Button>
        </Space>
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClassesPage() {
  const { user: me } = useAuthStore();
  const { selectedUnitId: globalUnit, setSelectedUnitId: setGlobalUnit } = useAppStore();
  const qc = useQueryClient();
  const { years: academicYears, yearId: currentYearId } = useCurrentYear();
  const [unitId, setUnitId] = useState<string | undefined>(globalUnit ?? undefined);
  const [academicYearId, setAcademicYearId] = useState<string | undefined>(undefined);
  useEffect(() => { if (currentYearId && !academicYearId) setAcademicYearId(currentYearId); }, [currentYearId]);
  const [expandedGrade, setExpandedGrade] = useState<string[]>([]);

  const [gradeModal, setGradeModal] = useState(false);
  const [editGrade, setEditGrade] = useState<any>(null);
  const [divModal, setDivModal] = useState<{ open: boolean; grade: any; edit: any }>({ open: false, grade: null, edit: null });
  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  // academicYears from useCurrentYear (already fetched + current year seeded)

  const { data: grades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['grades', unitId, academicYearId],
    queryFn: () => gradeApi.findByUnit(unitId!, academicYearId),
    enabled: !!unitId,
  });

  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions', unitId, academicYearId],
    queryFn: () => gradeApi.findDivisions(unitId!, academicYearId),
    enabled: !!unitId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['grades', unitId, academicYearId] });
    qc.invalidateQueries({ queryKey: ['divisions', unitId, academicYearId] });
  };

  const createGradeMutation = useMutation({
    mutationFn: (dto: any) => gradeApi.create({ ...dto, unitId, academicYearId, sansthaId: me?.sansthaId }),
    onSuccess: () => { message.success('इयत्ता जोडली'); invalidate(); setGradeModal(false); },
    onError: () => message.error('त्रुटी'),
  });

  const updateGradeMutation = useMutation({
    mutationFn: ({ id, ...dto }: any) => gradeApi.update(id, dto),
    onSuccess: () => { message.success('अद्यतन झाले'); invalidate(); setGradeModal(false); setEditGrade(null); },
    onError: () => message.error('त्रुटी'),
  });

  const deleteGradeMutation = useMutation({
    mutationFn: gradeApi.delete,
    onSuccess: () => { message.success('इयत्ता काढली'); invalidate(); },
  });

  const createDivMutation = useMutation({
    mutationFn: (dto: any) => gradeApi.createDivision({
      ...dto,
      gradeConfigId: divModal.grade?.id,
      unitId, academicYearId, sansthaId: me?.sansthaId,
    }),
    onSuccess: () => { message.success('तुकडी जोडली'); invalidate(); setDivModal({ open: false, grade: null, edit: null }); },
    onError: () => message.error('त्रुटी'),
  });

  const updateDivMutation = useMutation({
    mutationFn: ({ id, ...dto }: any) => gradeApi.updateDivision(id, dto),
    onSuccess: () => { message.success('तुकडी अद्यतन झाली'); invalidate(); setDivModal({ open: false, grade: null, edit: null }); },
    onError: () => message.error('त्रुटी'),
  });

  const deleteDivMutation = useMutation({
    mutationFn: gradeApi.deleteDivision,
    onSuccess: () => { message.success('तुकडी काढली'); invalidate(); },
  });

  // Group divisions by gradeConfigId
  const divsByGrade = (divisions as any[]).reduce((acc: any, d: any) => {
    if (!acc[d.gradeConfigId]) acc[d.gradeConfigId] = [];
    acc[d.gradeConfigId].push(d);
    return acc;
  }, {} as Record<string, any[]>);

  const gradeColumns = [
    { title: 'क्र.', dataIndex: 'gradeNumber', key: 'num', width: 60, render: (v: number) => `${v}` },
    { title: 'इयत्ता', dataIndex: 'gradeLabelMr', key: 'label' },
    { title: 'स्तर', dataIndex: 'level', key: 'level', width: 140,
      render: (v: string) => GRADE_LEVEL_OPTS.find(o => o.value === v)?.label || v },
    { title: 'तुकड्या', key: 'divs', width: 120, render: (_: any, r: any) => {
      const divs = divsByGrade[r.id] || [];
      return divs.length > 0
        ? <Space size={4}>{divs.map((d: any) => <Tag key={d.id}>{d.nameMr}</Tag>)}</Space>
        : <Tag color="warning">तुकडी नाही</Tag>;
    }},
    { title: 'कृती', key: 'actions', width: 200, render: (_: any, rec: any) => (
      <Space size={4}>
        <Button size="small" icon={<PlusOutlined />}
          disabled={!academicYearId}
          title={!academicYearId ? 'आधी शैक्षणिक वर्ष निवडा' : undefined}
          onClick={() => setDivModal({ open: true, grade: rec, edit: null })}>
          तुकडी
        </Button>
        <Button size="small" icon={<EditOutlined />}
          onClick={() => { setEditGrade(rec); setGradeModal(true); }} />
        <Popconfirm title="इयत्ता काढायची?" onConfirm={() => deleteGradeMutation.mutate(rec.id)} okText="होय" cancelText="नाही">
          <Button size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <TeamOutlined style={{ fontSize: 18, color: '#1A3A5C' }} />
        <Text strong style={{ fontSize: 16, color: '#1A3A5C' }}>इयत्ता व तुकड्या</Text>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#fff' }}>
      {/* Filters */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={7}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>शाळा</div>
          <Select
            placeholder="शाळा निवडा"
            style={{ width: '100%' }}
            options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))}
            onChange={v => { setUnitId(v); setGlobalUnit(v); setAcademicYearId(undefined); }}
            value={unitId}
          />
        </Col>
        <Col span={7}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>शैक्षणिक वर्ष</div>
          <Select
            placeholder="वर्ष निवडा"
            style={{ width: '100%' }}
            options={(academicYears as any[]).map(y => ({ value: y.id, label: y.labelMr || y.labelEn }))}
            onChange={setAcademicYearId}
            value={academicYearId}
            disabled={!unitId}
          />
        </Col>
        <Col span={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!unitId || !academicYearId}
            onClick={() => { setEditGrade(null); setGradeModal(true); }}
           
          >
            इयत्ता जोडा
          </Button>
        </Col>
      </Row>

      <Table
        dataSource={grades as any[]}
        columns={gradeColumns}
        rowKey="id"
        loading={gradesLoading}
        pagination={false}
        locale={{ emptyText: unitId ? 'इयत्ता नाहीत — वर जोडा' : 'शाळा निवडा' }}
        expandable={{
          expandedRowKeys: expandedGrade,
          onExpand: (expanded, record) => {
            setExpandedGrade(expanded ? [record.id] : []);
          },
          expandedRowRender: (record: any) => {
            const divs = divsByGrade[record.id] || [];
            return (
              <div style={{ padding: '8px 24px' }}>
                <Space style={{ marginBottom: 8 }}>
                  <Text strong>तुकड्या:</Text>
                  {divs.map((d: any) => (
                    <Tag key={d.id} closable
                      onClose={(e) => { e.preventDefault(); deleteDivMutation.mutate(d.id); }}>
                      {d.nameMr}
                      {d.roomNumber ? ` (खोली ${d.roomNumber})` : ''}
                    </Tag>
                  ))}
                </Space>
              </div>
            );
          },
        }}
      />

      {/* Grade modal */}
      <GradeModal
        open={gradeModal}
        onClose={() => { setGradeModal(false); setEditGrade(null); }}
        onSave={editGrade ? (v) => updateGradeMutation.mutate({ ...v, id: editGrade.id }) : createGradeMutation.mutate}
        editRecord={editGrade}
        loading={createGradeMutation.isPending || updateGradeMutation.isPending}
      />

      {/* Division modal */}
      <DivisionModal
        open={divModal.open}
        onClose={() => setDivModal({ open: false, grade: null, edit: null })}
        onSave={divModal.edit
          ? (v) => updateDivMutation.mutate({ ...v, id: divModal.edit.id })
          : createDivMutation.mutate}
        editRecord={divModal.edit}
        grade={divModal.grade}
        loading={createDivMutation.isPending || updateDivMutation.isPending}
      />

      </div>
    </div>
  );
}
