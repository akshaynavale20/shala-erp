import { useState, useEffect } from 'react';
import {
  Select, DatePicker, Table, Button, Space, message,
  Typography, Radio, Statistic, Row, Col, Alert, Card,
} from 'antd';
import { CheckOutlined, SaveOutlined, CalendarOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { attendanceApi, unitApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { useUnitAccess } from '../../hooks/useUnitAccess';
import { useCurrentYear } from '../../hooks/useCurrentYear';
import { studentApi } from '../../api/client';
import { ComingSoonBanner } from '../../components/common/ComingSoon';

const { Text } = Typography;

const STATUS_OPTS = [
  { value: 'P', label: 'उपस्थित', color: '#27AE60' },
  { value: 'A', label: 'अनुपस्थित', color: '#E74C3C' },
  { value: 'H', label: 'अर्धदिवस', color: '#E67E22' },
  { value: 'L', label: 'उशिरा', color: '#F39C12' },
];


// ── Daily Attendance ──────────────────────────────────────────────────────────
function DailyAttendance() {
  const { user: me } = useAuthStore();
  const { unitId: lockedUnitId, canSwitch: canSwitchUnit } = useUnitAccess();
  const { currentYear } = useCurrentYear();
  const { selectedUnitId: globalUnit, setSelectedUnitId: setGlobalUnit } = useAppStore();
  const qc = useQueryClient();
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(lockedUnitId ?? globalUnit ?? undefined);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students', me?.sansthaId, selectedUnit],
    queryFn: () => studentApi.findBySanstha(me!.sansthaId, { unitId: selectedUnit }),
    enabled: !!selectedUnit,
  });

  const dateStr = selectedDate.format('YYYY-MM-DD');

  const { data: existingAtt = [] } = useQuery({
    queryKey: ['attendance-unit', selectedUnit, dateStr],
    queryFn: () => attendanceApi.getByUnit(selectedUnit!, dateStr),
    enabled: !!selectedUnit && !!dateStr,
  });

  useEffect(() => {
    if ((existingAtt as any[]).length > 0) {
      const map: Record<string, string> = {};
      (existingAtt as any[]).forEach((r: any) => { map[r.studentId] = r.status; });
      setAttendance(map);
    } else if ((students as any[]).length > 0) {
      const map: Record<string, string> = {};
      (students as any[]).forEach((s: any) => { map[s.id] = 'P'; });
      setAttendance(map);
    }
  }, [existingAtt, students, selectedUnit, dateStr]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!selectedUnit) throw new Error('शाळा निवडा');
      const records = (students as any[]).map((s: any) => ({
        studentId: s.id,
        status: attendance[s.id] || 'P',
      }));
      return attendanceApi.markBulk({
        sansthaId: me!.sansthaId,
        unitId: selectedUnit,
        academicYearId: currentYear?.id || (students as any[])[0]?.academicYearId || '',
        divisionId: (students as any[])[0]?.divisionId || 'default',
        date: dateStr,
        markedBy: me!.id,
        records,
      });
    },
    onSuccess: () => {
      message.success(`${dateStr} ची हजेरी जतन झाली`);
      qc.invalidateQueries({ queryKey: ['attendance-unit', selectedUnit, dateStr] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'त्रुटी'),
  });

  const markAll = (status: string) => {
    const all: Record<string, string> = {};
    (students as any[]).forEach((s: any) => { all[s.id] = status; });
    setAttendance(all);
  };

  const activeStudents = (students as any[]).filter((s: any) => s.status === 'active' || !s.status);
  const present = Object.values(attendance).filter(v => v === 'P').length;
  const absent = Object.values(attendance).filter(v => v === 'A').length;
  const total = activeStudents.length;

  const columns = [
    { title: 'क्र.', key: 'idx', width: 50, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'नाव', dataIndex: 'nameMr', key: 'nameMr', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'वडिलांचे नाव', dataIndex: 'fatherNameMr', key: 'father', render: (v: string) => v || '—' },
    {
      title: 'हजेरी', key: 'status', width: 320,
      render: (_: any, rec: any) => {
        const val = attendance[rec.id] || 'P';
        return (
          <Radio.Group value={val}
            onChange={(e) => setAttendance(prev => ({ ...prev, [rec.id]: e.target.value }))}
            optionType="button" buttonStyle="solid"
          >
            {STATUS_OPTS.map(opt => (
              <Radio.Button key={opt.value} value={opt.value}
                style={val === opt.value ? { backgroundColor: opt.color, borderColor: opt.color, color: '#fff' } : {}}>
                {opt.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        );
      },
    },
  ];

  return (
    <div>
      {/* Filter bar */}
      <div style={{ background: '#EEF4F9', border: '1px solid #BCD4E8', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
        <Space wrap>
          {canSwitchUnit && (
            <Select placeholder="शाळा निवडा" style={{ width: 220 }} value={selectedUnit}
              options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))}
              onChange={(val) => { setSelectedUnit(val); setGlobalUnit(val); setAttendance({}); }} />
          )}
          <DatePicker value={selectedDate} onChange={(d) => d && setSelectedDate(d)}
            format="DD/MM/YYYY" disabledDate={(d) => d.isAfter(dayjs())} />
          {selectedUnit && total > 0 && (
            <Space>
              <Button onClick={() => markAll('P')} icon={<CheckOutlined />} style={{ borderColor: '#27AE60', color: '#27AE60' }}>सर्व उपस्थित</Button>
              <Button onClick={() => markAll('A')} danger>सर्व अनुपस्थित</Button>
            </Space>
          )}
        </Space>
      </div>

      {!selectedUnit && (
        <Alert message="हजेरी नोंदवण्यासाठी शाळा आणि तारीख निवडा" type="info" showIcon style={{ marginBottom: 16 }} />
      )}

      {selectedUnit && total > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #1A3A5C' }}>
              <Statistic title="एकूण विद्यार्थी" value={total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #27AE60' }}>
              <Statistic title="उपस्थित" value={present} valueStyle={{ color: '#27AE60' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #E74C3C' }}>
              <Statistic title="अनुपस्थित" value={absent} valueStyle={{ color: '#E74C3C' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #E67E22' }}>
              <Statistic title="उपस्थिती %" value={total > 0 ? Math.round((present / total) * 100) : 0} suffix="%"
                valueStyle={{ color: present / total >= 0.75 ? '#27AE60' : '#E74C3C' }} />
            </Card>
          </Col>
        </Row>
      )}

      <Table dataSource={activeStudents} columns={columns} rowKey="id"
        loading={studentsLoading} pagination={false} size="small"
        locale={{ emptyText: selectedUnit ? 'या शाळेत विद्यार्थी नाहीत' : 'शाळा निवडा' }} />

      {selectedUnit && total > 0 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button type="primary" icon={<SaveOutlined />} size="large"
            loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}
           >
            हजेरी जतन करा ({dateStr})
          </Button>
        </div>
      )}
    </div>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <CalendarOutlined style={{ fontSize: 18, color: '#1A3A5C' }} />
        <Text strong style={{ fontSize: 16, color: '#1A3A5C' }}>दैनिक हजेरी</Text>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#fff' }}>
        <DailyAttendance />
        <ComingSoonBanner
          title="विस्तारित हजेरी सुविधा"
          features={['मासिक उपस्थिती अहवाल', 'वर्गनिहाय विश्लेषण', 'SMS / WhatsApp सूचना', 'उपस्थिती प्रमाणपत्र']}
        />
      </div>
    </div>
  );
}
