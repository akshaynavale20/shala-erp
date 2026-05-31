import { Card, Col, Row, Statistic, Progress, Skeleton, Typography } from 'antd';
import {
  BankOutlined, CheckCircleOutlined, WarningOutlined,
  RiseOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { feeApi } from '../../api/client';

const { Text } = Typography;

function fmt(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface Props { unitId?: string; academicYearId?: string; }

export default function FeeMetricsBar({ unitId, academicYearId }: Props) {
  const { data: m, isLoading } = useQuery({
    queryKey: ['fee-metrics', unitId, academicYearId],
    queryFn: () => feeApi.feeMetrics(unitId!, academicYearId!),
    enabled: !!unitId && !!academicYearId,
    staleTime: 2 * 60 * 1000,
  });

  if (!unitId || !academicYearId) return null;

  if (isLoading) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
    );
  }

  const pct = m?.collectionPercent ?? 0;

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, background: 'linear-gradient(135deg,#EBF5FB 0%,#EAFAF1 100%)', border: '1px solid #AED6F1' }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <Row gutter={[24, 0]} align="middle" wrap={false}>
        {/* Total demanded */}
        <Col flex="auto">
          <Statistic
            title={<Text type="secondary" style={{ fontSize: 11 }}><BankOutlined /> एकूण मागणी</Text>}
            value={fmt(m?.totalDemanded ?? 0)}
            valueStyle={{ fontSize: 18, color: '#1A5276', fontWeight: 700 }}
          />
        </Col>

        {/* Total collected */}
        <Col flex="auto">
          <Statistic
            title={<Text type="secondary" style={{ fontSize: 11 }}><CheckCircleOutlined /> एकूण संकलन</Text>}
            value={fmt(m?.totalCollected ?? 0)}
            valueStyle={{ fontSize: 18, color: '#27AE60', fontWeight: 700 }}
          />
        </Col>

        {/* Collection % */}
        <Col flex="160px">
          <Text type="secondary" style={{ fontSize: 11 }}><RiseOutlined /> संकलन टक्केवारी</Text>
          <div style={{ marginTop: 4 }}>
            <Progress
              percent={pct}
              size="small"
              strokeColor={pct >= 80 ? '#27AE60' : pct >= 50 ? '#F39C12' : '#E74C3C'}
              format={p => <span style={{ fontSize: 13, fontWeight: 700 }}>{p}%</span>}
            />
          </div>
        </Col>

        {/* Defaulters */}
        <Col flex="auto">
          <Statistic
            title={<Text type="secondary" style={{ fontSize: 11 }}><WarningOutlined /> थकबाकीदार</Text>}
            value={m?.defaultersCount ?? 0}
            suffix="विद्यार्थी"
            valueStyle={{ fontSize: 18, color: m?.defaultersCount ? '#E74C3C' : '#27AE60', fontWeight: 700 }}
          />
        </Col>

        {/* Today's collection */}
        <Col flex="auto">
          <Statistic
            title={<Text type="secondary" style={{ fontSize: 11 }}><ClockCircleOutlined /> आजचे संकलन</Text>}
            value={fmt(m?.todayCollected ?? 0)}
            valueStyle={{ fontSize: 18, color: '#2980B9', fontWeight: 700 }}
          />
        </Col>
      </Row>
    </Card>
  );
}
