/**
 * ClassViewTab — fee overview for an entire division
 * Shows all students with their demand totals; "संकलन" switches to collection tab.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Table, Button, Tag, Typography, Row, Col, Space,
  Statistic, Tooltip, message,
} from 'antd';
import {
  DownloadOutlined, WalletOutlined, CheckCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { feeApi, studentApi } from '../../api/client';
import ClassDivisionSelect from '../../components/common/ClassDivisionSelect';

const { Text } = Typography;

function fmt(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface Props {
  me: any;
  units: any[];
  academicYears: any[];
  pageUnit?: string;
  pageYear?: string;
  onStudentSelect: (studentId: string, studentObj: any) => void;
}

export default function ClassViewTab({ me, units: _units, academicYears: _academicYears, pageUnit, pageYear, onStudentSelect }: Props) {
  const { t } = useTranslation();
  const [divisionId, setDivisionId] = useState<string>();
  const [gradeId, setGradeId] = useState<string>();

  // Parallel queries: demands + students for the selected division
  const { data: demands = [], isFetching: demandsFetching } = useQuery({
    queryKey: ['division-demands', divisionId, pageUnit, pageYear],
    queryFn: () => feeApi.divisionDemands(divisionId!, pageUnit!, pageYear!),
    enabled: !!divisionId && !!pageUnit && !!pageYear,
  });

  const { data: students = [], isFetching: studentsFetching } = useQuery({
    queryKey: ['students-division', me?.sansthaId, pageUnit, divisionId],
    queryFn: () => studentApi.findBySanstha(me!.sansthaId, { unitId: pageUnit, divisionId } as any),
    enabled: !!divisionId && !!pageUnit && !!me?.sansthaId,
  });

  const loading = demandsFetching || studentsFetching;

  // Client-side merge per studentId
  const rows = useMemo(() => {
    const studentMap = new Map<string, any>();
    (students as any[]).forEach(s => studentMap.set(s.id, s));

    const demandByStudent = new Map<string, any[]>();
    (demands as any[]).forEach(d => {
      const arr = demandByStudent.get(d.studentId) || [];
      arr.push(d);
      demandByStudent.set(d.studentId, arr);
    });

    // Include all students in division, even those with no demands
    const allStudentIds = new Set([
      ...Array.from(studentMap.keys()),
      ...Array.from(demandByStudent.keys()),
    ]);

    return Array.from(allStudentIds).map((sid, idx) => {
      const student = studentMap.get(sid) || { id: sid, nameMr: '—', fatherNameMr: '—', grNo: '—', rollNo: '—' };
      const sdemands = demandByStudent.get(sid) || [];
      const totalDemand = sdemands.reduce((s, d) => s + Number(d.netAmount || 0), 0);
      const totalPaid = sdemands.reduce((s, d) => s + Number(d.paidAmount || 0), 0);
      const outstanding = totalDemand - totalPaid;

      let statusKey: string;
      if (sdemands.length === 0) statusKey = 'noDemand';
      else if (outstanding <= 0) statusKey = 'full';
      else if (totalPaid > 0) statusKey = 'partial';
      else statusKey = 'defaulter';

      return { key: sid, idx: idx + 1, student, totalDemand, totalPaid, outstanding, statusKey, demandCount: sdemands.length };
    }).sort((a, b) => (a.student.rollNo || 0) - (b.student.rollNo || 0) || a.student.nameMr?.localeCompare?.(b.student.nameMr) || 0);
  }, [students, demands]);

  // Division totals
  const totals = useMemo(() => ({
    demand: rows.reduce((s, r) => s + r.totalDemand, 0),
    paid: rows.reduce((s, r) => s + r.totalPaid, 0),
    outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
    defaulters: rows.filter(r => r.outstanding > 0).length,
  }), [rows]);

  const statusColorMap: Record<string, string> = {
    full: 'success',
    partial: 'warning',
    defaulter: 'error',
    noDemand: 'default',
  };

  // Excel export
  const exportExcel = () => {
    if (!rows.length) { message.warning(t('fees.classView.noDataExport')); return; }
    const wsData = [
      [
        t('fees.classView.columns.no'),
        t('fees.classView.columns.student'),
        t('fees.classView.columns.fatherName'),
        'GR',
        t('fees.classView.columns.roll'),
        t('fees.classView.columns.totalDue'),
        t('fees.classView.columns.paid'),
        t('fees.classView.columns.balance'),
        t('fees.classView.columns.status'),
      ],
      ...rows.map(r => [
        r.idx,
        r.student.nameMr,
        r.student.fatherNameMr,
        r.student.grNo,
        r.student.rollNo,
        r.totalDemand,
        r.totalPaid,
        r.outstanding,
        t(`fees.classView.status.${r.statusKey}`),
      ]),
      [t('app.total'), '', '', '', '', totals.demand, totals.paid, totals.outstanding, ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('fees.classView.sheetName'));
    XLSX.writeFile(wb, `fee-list-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns = [
    { title: t('fees.classView.columns.no'), dataIndex: 'idx', key: 'idx', width: 50 },
    {
      title: t('fees.classView.columns.student'),
      key: 'student',
      render: (_: any, r: any) => (
        <div>
          <Text strong>{r.student.nameMr}</Text>
          {r.student.fatherNameMr && <Text type="secondary" style={{ fontSize: 12 }}> / {r.student.fatherNameMr}</Text>}
        </div>
      ),
    },
    {
      title: 'GR / ' + t('fees.classView.columns.roll'),
      key: 'gr',
      width: 110,
      render: (_: any, r: any) => (
        <Space size={4}>
          {r.student.grNo && <Tag style={{ fontSize: 11 }}>{r.student.grNo}</Tag>}
          {r.student.rollNo && <Tag color="blue" style={{ fontSize: 11 }}>#{r.student.rollNo}</Tag>}
        </Space>
      ),
    },
    {
      title: t('fees.classView.columns.totalDue'),
      dataIndex: 'totalDemand',
      key: 'demand',
      width: 110,
      align: 'right' as const,
      render: (v: number) => <Text>{fmt(v)}</Text>,
    },
    {
      title: t('fees.classView.columns.paid'),
      dataIndex: 'totalPaid',
      key: 'paid',
      width: 110,
      align: 'right' as const,
      render: (v: number) => <Text style={{ color: '#27AE60' }}>{fmt(v)}</Text>,
    },
    {
      title: t('fees.classView.columns.balance'),
      dataIndex: 'outstanding',
      key: 'outstanding',
      width: 110,
      align: 'right' as const,
      render: (v: number) => (
        <Text strong style={{ color: v > 0 ? '#E74C3C' : '#27AE60' }}>
          {fmt(v)}
        </Text>
      ),
    },
    {
      title: t('fees.classView.columns.status'),
      dataIndex: 'statusKey',
      key: 'status',
      width: 120,
      render: (v: string) => <Tag color={statusColorMap[v] || 'default'}>{t(`fees.classView.status.${v}`)}</Tag>,
    },
    {
      title: t('app.actions'),
      key: 'action',
      width: 100,
      render: (_: any, r: any) => (
        <Tooltip title={t('fees.classView.collectTooltip')}>
          <Button
            size="small"
            type="primary"
            style={{ fontSize: 12 }}
            onClick={() => onStudentSelect(r.student.id, r.student)}
          >
            {t('fees.classView.collect')}
          </Button>
        </Tooltip>
      ),
    },
  ];

  const noUnitYear = !pageUnit || !pageYear;
  const noDivision = !divisionId;

  return (
    <div>
      {/* Selector bar */}
      <Card size="small" style={{ marginBottom: 12, background: '#EBF5FB', border: '1px solid #AED6F1' }}>
        <Row gutter={12} align="middle" wrap>
          <Col flex="none">
            <Text strong>{t('fees.classView.gradeLabel')}</Text>
          </Col>
          <Col>
            <ClassDivisionSelect
              unitId={pageUnit}
              academicYearId={pageYear}
              gradeValue={gradeId}
              divisionValue={divisionId}
              onGradeChange={v => { setGradeId(v); setDivisionId(undefined); }}
              onDivisionChange={v => setDivisionId(v || undefined)}
              disabled={noUnitYear}
            />
          </Col>
          {!!rows.length && (
            <Col flex="none" style={{ marginLeft: 'auto' }}>
              <Button icon={<DownloadOutlined />} onClick={exportExcel} size="small">
                {t('fees.classView.exportExcel')}
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Summary metrics when division selected */}
      {!noDivision && !loading && rows.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col flex="auto">
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 11 }}><WalletOutlined /> {t('fees.classView.totalDue')}</Text>}
                value={fmt(totals.demand)}
                valueStyle={{ fontSize: 16, color: '#1A5276', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col flex="auto">
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 11 }}><CheckCircleOutlined /> {t('fees.classView.totalPaid')}</Text>}
                value={fmt(totals.paid)}
                valueStyle={{ fontSize: 16, color: '#27AE60', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col flex="auto">
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 11 }}><WarningOutlined /> {t('fees.classView.totalOutstanding')}</Text>}
                value={fmt(totals.outstanding)}
                valueStyle={{ fontSize: 16, color: totals.outstanding > 0 ? '#E74C3C' : '#27AE60', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col flex="auto">
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 11 }}>{t('fees.classView.defaulters')}</Text>}
                value={totals.defaulters}
                suffix={t('fees.classView.students')}
                valueStyle={{ fontSize: 16, color: totals.defaulters > 0 ? '#E74C3C' : '#27AE60', fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main table */}
      {noUnitYear ? (
        <Card>
          <Text type="secondary">{t('fees.classView.selectSchoolYear')}</Text>
        </Card>
      ) : noDivision ? (
        <Card>
          <Text type="secondary">{t('fees.classView.selectDivision')}</Text>
        </Card>
      ) : (
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="key"
          size="small"
          loading={loading}
          pagination={false}
          scroll={{ x: 700 }}
          summary={() =>
            rows.length > 0 ? (
              <Table.Summary.Row style={{ background: '#f0f7ff', fontWeight: 700 }}>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>{t('fees.classView.total', { count: rows.length })}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong>{fmt(totals.demand)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong style={{ color: '#27AE60' }}>{fmt(totals.paid)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <Text strong style={{ color: totals.outstanding > 0 ? '#E74C3C' : '#27AE60' }}>
                    {fmt(totals.outstanding)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} colSpan={2} />
              </Table.Summary.Row>
            ) : null
          }
        />
      )}
    </div>
  );
}
