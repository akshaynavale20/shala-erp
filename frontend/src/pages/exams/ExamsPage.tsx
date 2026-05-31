import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Select, Space, Tag, message,
  Typography, InputNumber, Row, Col, DatePicker,
} from 'antd';
import {
  PlusOutlined, FileTextOutlined, AuditOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { examApi, unitApi, studentApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { useUnitAccess } from '../../hooks/useUnitAccess';
import { useCurrentYear } from '../../hooks/useCurrentYear';
import { ComingSoonBanner } from '../../components/common/ComingSoon';
import { MrInput } from '../../components/common/MrInput';

const { Text } = Typography;

const EXAM_TYPE_OPTS = [
  { value: 'unit_test',    label: 'घटक चाचणी' },
  { value: 'half_yearly',  label: 'अर्धवार्षिक' },
  { value: 'annual',       label: 'वार्षिक' },
  { value: 'preliminary',  label: 'प्राथमिक' },
  { value: 'board',        label: 'मंडळ' },
];
const EXAM_TYPE_COLORS: Record<string, string> = {
  unit_test: 'blue', half_yearly: 'orange', annual: 'green', preliminary: 'purple', board: 'red',
};


export default function ExamsPage() {
  const { user: me } = useAuthStore();
  const { unitId: lockedUnitId, canSwitch: canSwitchUnit } = useUnitAccess();
  const { selectedUnitId: globalUnit, setSelectedUnitId: setGlobalUnit } = useAppStore();
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState('list');
  const [createOpen, setCreateOpen] = useState(false);
  const [marksExam, setMarksExam] = useState<any>(null);
  const [filterUnit, setFilterUnit] = useState<string | undefined>(lockedUnitId ?? globalUnit ?? undefined);
  const [form] = Form.useForm();
  const [marksData, setMarksData] = useState<Record<string, any>>({});

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams', me?.sansthaId, filterUnit],
    queryFn: () => examApi.findBySanstha(me!.sansthaId, { unitId: filterUnit }),
    enabled: !!me?.sansthaId,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const { years: academicYears } = useCurrentYear();

  const { data: marksStudents = [] } = useQuery({
    queryKey: ['students-for-marks', marksExam?.unitId],
    queryFn: () => studentApi.findBySanstha(me!.sansthaId, { unitId: marksExam?.unitId }),
    enabled: !!marksExam?.unitId,
  });

  const { data: existingMarks = [] } = useQuery({
    queryKey: ['marks', marksExam?.id],
    queryFn: () => examApi.getMarks(marksExam!.id),
    enabled: !!marksExam?.id,
  });

  useEffect(() => {
    const marks = existingMarks as any[];
    if (marks.length > 0) {
      const md: Record<string, any> = {};
      marks.forEach((m: any) => {
        md[m.studentId] = {
          ...m,
          theoryMarks: m.theoryMarks !== null && m.theoryMarks !== undefined ? Number(m.theoryMarks) : null,
          internalMarks: m.internalMarks !== null && m.internalMarks !== undefined ? Number(m.internalMarks) : null,
        };
      });
      setMarksData(md);
    } else if (marksExam) {
      setMarksData({});
    }
  }, [(existingMarks as any[]).length, marksExam?.id]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['exams'] });

  const createMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values, sansthaId: me!.sansthaId };
      if (payload.startDate?.format) payload.startDate = payload.startDate.format('YYYY-MM-DD');
      if (payload.endDate?.format) payload.endDate = payload.endDate.format('YYYY-MM-DD');
      return examApi.create(payload);
    },
    onSuccess: () => { message.success('परीक्षा तयार झाली'); invalidate(); setCreateOpen(false); form.resetFields(); },
    onError: () => message.error('त्रुटी'),
  });

  const saveMarksMutation = useMutation({
    mutationFn: () => {
      const marks = (marksStudents as any[]).map((s: any) => ({
        studentId: s.id,
        sansthaId: me!.sansthaId,
        theoryMarks: marksData[s.id]?.theoryMarks ?? null,
        internalMarks: marksData[s.id]?.internalMarks ?? null,
        totalMarks: ((marksData[s.id]?.theoryMarks || 0) + (marksData[s.id]?.internalMarks || 0)) || null,
      }));
      return examApi.saveMarks(marksExam.id, marks);
    },
    onSuccess: () => { message.success('गुण जतन झाले'); qc.invalidateQueries({ queryKey: ['marks'] }); },
    onError: () => message.error('त्रुटी'),
  });

  const columns = [
    { title: 'परीक्षेचे नाव', dataIndex: 'nameMr', key: 'nameMr', render: (v: string) => <Text strong>{v}</Text> },
    {
      title: 'प्रकार', dataIndex: 'examType', key: 'type',
      render: (v: string) => <Tag color={EXAM_TYPE_COLORS[v]}>{EXAM_TYPE_OPTS.find(o => o.value === v)?.label || v}</Tag>,
    },
    { title: 'सुरुवात', dataIndex: 'startDate', key: 'start', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'शेवट', dataIndex: 'endDate', key: 'end', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    {
      title: 'कृती', key: 'actions', width: 120,
      render: (_: any, rec: any) => (
        <Button size="small" icon={<FileTextOutlined />} onClick={() => { setMarksExam(rec); setMarksData({}); setActiveSection('marks'); }}>
          गुण नोंद
        </Button>
      ),
    },
  ];

  const marksColumns = [
    { title: 'विद्यार्थी', dataIndex: 'nameMr', key: 'name' },
    {
      title: 'लिखित (८०)', key: 'theory', render: (_: any, rec: any) => (
        <InputNumber min={0} max={80} value={marksData[rec.id]?.theoryMarks ?? undefined} placeholder="—"
          onChange={(v) => setMarksData(prev => ({ ...prev, [rec.id]: { ...prev[rec.id], theoryMarks: v } }))} />
      ),
    },
    {
      title: 'अंतर्गत (२०)', key: 'internal', render: (_: any, rec: any) => (
        <InputNumber min={0} max={20} value={marksData[rec.id]?.internalMarks ?? undefined} placeholder="—"
          onChange={(v) => setMarksData(prev => ({ ...prev, [rec.id]: { ...prev[rec.id], internalMarks: v } }))} />
      ),
    },
    {
      title: 'एकूण', key: 'total', render: (_: any, rec: any) => {
        const t = (marksData[rec.id]?.theoryMarks || 0) + (marksData[rec.id]?.internalMarks || 0);
        return <Text strong style={{ color: t >= 60 ? '#27AE60' : t >= 35 ? '#E67E22' : t > 0 ? '#E74C3C' : undefined }}>{t || '—'}</Text>;
      },
    },
    {
      title: 'निकाल', key: 'result', render: (_: any, rec: any) => {
        const t = (marksData[rec.id]?.theoryMarks || 0) + (marksData[rec.id]?.internalMarks || 0);
        if (!marksData[rec.id]) return '—';
        return <Tag color={t >= 35 ? 'green' : 'red'}>{t >= 35 ? 'उत्तीर्ण' : 'अनुत्तीर्ण'}</Tag>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <AuditOutlined style={{ fontSize: 18, color: '#1A3A5C' }} />
        <Text strong style={{ fontSize: 16, color: '#1A3A5C' }}>
          {activeSection === 'marks' ? 'गुण नोंद' : 'परीक्षा व्यवस्थापन'}
        </Text>
        {activeSection === 'marks' && (
          <Button size="small" onClick={() => { setActiveSection('list'); setMarksExam(null); }}>
            ← परीक्षा यादी
          </Button>
        )}
        {activeSection !== 'marks' && (
          <div style={{ marginLeft: 'auto' }}>
            <Space>
              {canSwitchUnit && (
                <Select placeholder="शाळा गाळणी" allowClear size="small" style={{ width: 180 }}
                  value={filterUnit}
                  options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))}
                  onChange={(v) => { setFilterUnit(v); setGlobalUnit(v); }} />
              )}
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                नवीन परीक्षा
              </Button>
            </Space>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#fff' }}>

          {/* Exam list */}
          {activeSection !== 'marks' && (
            <Table dataSource={exams} columns={columns} rowKey="id" loading={isLoading} />
          )}

          {/* Marks entry */}
          {activeSection === 'marks' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text strong style={{ fontSize: 15, color: '#1A3A5C' }}>
                  {marksExam ? `गुण नोंद — ${marksExam.nameMr}` : 'परीक्षा यादीतून गुण नोंद निवडा'}
                </Text>
                {marksExam && (
                  <Space>
                    <Button type="primary" loading={saveMarksMutation.isPending} onClick={() => saveMarksMutation.mutate()}>
                      गुण जतन करा
                    </Button>
                    <Button onClick={() => setMarksExam(null)}>साफ करा</Button>
                  </Space>
                )}
              </div>
              {marksExam ? (
                <>
                  <Table dataSource={marksStudents as any[]} columns={marksColumns} rowKey="id" size="small" pagination={false} />
                  <ComingSoonBanner
                    title="विस्तारित परीक्षा सुविधा"
                    features={['विषयनिहाय गुणनोंद', 'गुणपत्रिका मुद्रण', 'परिणाम विश्लेषण', 'उत्तीर्ण/अनुत्तीर्ण अहवाल']}
                  />
                </>
              ) : (
                <Table dataSource={exams} columns={columns} rowKey="id" loading={isLoading} />
              )}
            </div>
          )}
      </div>

      {/* Create exam modal */}
      <Modal title="नवीन परीक्षा" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} width={560} forceRender>
        <Form form={form} layout="vertical" onFinish={createMutation.mutate}>
          <Row gutter={16}>
            <Col span={24}><Form.Item name="nameMr" label="परीक्षेचे नाव" rules={[{ required: true }]}><MrInput /></Form.Item></Col>
            <Col span={12}><Form.Item name="examType" label="प्रकार" rules={[{ required: true }]}><Select options={EXAM_TYPE_OPTS} /></Form.Item></Col>
            <Col span={12}><Form.Item name="unitId" label="शाळा" rules={[{ required: true }]}>
              <Select options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))} />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="academicYearId" label="शैक्षणिक वर्ष" rules={[{ required: true }]}>
              <Select options={(academicYears as any[]).map(y => ({ value: y.id, label: y.labelMr }))} />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="startDate" label="सुरुवात"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
            <Col span={12}><Form.Item name="endDate" label="शेवट"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
          </Row>
          <Space>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>जतन करा</Button>
            <Button onClick={() => setCreateOpen(false)}>रद्द करा</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
