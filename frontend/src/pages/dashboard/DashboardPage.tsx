import {
  Card, Col, Row, Table, Typography, Spin, Progress, Button,
} from 'antd';
import {
  UserOutlined, TeamOutlined, DollarOutlined, ApartmentOutlined,
  CalendarOutlined, CreditCardOutlined, FileProtectOutlined, UserAddOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { reportApi, sansthaApi } from '../../api/client';

const { Title, Text } = Typography;

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }: { label: string; value: any; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <Card size="small" style={{ borderTop: `3px solid ${color}`, borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: '#999' }}>{sub}</div>}
        </div>
      </div>
    </Card>
  );
}

// ── Quick Action Button ────────────────────────────────────────────────────────
function QuickAction({ label, icon, color, onClick }: { label: string; icon: React.ReactNode; color: string; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      style={{
        height: 72, width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, border: `1.5px solid ${color}20`, borderRadius: 10,
        background: color + '0A',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 22, color }}>{icon}</div>
      <div style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>{label}</div>
    </Button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user: me } = useAuthStore();
  const navigate = useNavigate();
  const sansthaId = me?.sansthaId;

  const { data: sanstha } = useQuery({
    queryKey: ['sanstha', sansthaId],
    queryFn: () => sansthaApi.findOne(sansthaId!),
    enabled: !!sansthaId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['sanstha-summary', sansthaId],
    queryFn: () => reportApi.sansthaSummary(sansthaId!),
    enabled: !!sansthaId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: fees } = useQuery({
    queryKey: ['fee-collection', sansthaId],
    queryFn: () => reportApi.feeCollection(sansthaId!),
    enabled: !!sansthaId,
    staleTime: 5 * 60 * 1000,
  });

  const feeCollectPct = (fees as any)?.totalDemanded > 0
    ? Math.round(((fees as any).totalCollected / (fees as any).totalDemanded) * 100) : 0;

  const unitColumns = [
    { title: 'घटक / शाळा', dataIndex: 'nameMr', key: 'nameMr', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'विद्यार्थी', dataIndex: 'students', key: 'students', align: 'right' as const, render: (v: number) => v || 0 },
    { title: 'कर्मचारी', dataIndex: 'staff', key: 'staff', align: 'right' as const, render: (v: number) => v || 0 },
    {
      title: 'संकलन %', key: 'feePercent', align: 'right' as const,
      render: (_: any, rec: any) => {
        const pct = rec.collected && rec.demanded ? Math.round((rec.collected / rec.demanded) * 100) : 0;
        return pct > 0 ? <Progress percent={pct} size="small" style={{ width: 90, margin: 0 }} /> : <Text type="secondary">—</Text>;
      },
    },
  ];

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्कार' : 'शुभ संध्या';

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Mukta, sans-serif' }}>

      {/* ── Welcome strip ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1A3A5C 0%, #2E86C1 100%)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
            {greeting}, {me?.nameMr || me?.email} 👋
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            {sanstha?.nameMr || 'आपल्या शाळेत स्वागत आहे'} · शाळा व्यवस्थापन प्रणाली
          </Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>आजची तारीख</Text>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
            {new Date().toLocaleDateString('mr-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {summaryLoading ? (
        <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <KpiCard
                label="एकूण विद्यार्थी"
                value={(summary as any)?.totalStudents || 0}
                sub={`मुले: ${(summary as any)?.maleStudents || 0} | मुली: ${(summary as any)?.femaleStudents || 0}`}
                color="#1A3A5C"
                icon={<UserOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <KpiCard
                label="एकूण कर्मचारी"
                value={(summary as any)?.totalStaff || 0}
                sub="सक्रिय कर्मचारी"
                color="#27AE60"
                icon={<TeamOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <KpiCard
                label="घटक / शाळा"
                value={(summary as any)?.totalUnits || 0}
                sub="नोंदणीकृत शाळा"
                color="#8E44AD"
                icon={<ApartmentOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <KpiCard
                label="एकूण संकलन"
                value={`₹${((fees as any)?.totalCollected || 0).toLocaleString('mr-IN')}`}
                sub="चालू शैक्षणिक वर्ष"
                color="#E67E22"
                icon={<DollarOutlined />}
              />
            </Col>
          </Row>

          {/* ── Quick Actions ── */}
          <Card
            size="small"
            title={<Text strong style={{ color: '#1A3A5C' }}>त्वरित कृती</Text>}
            style={{ marginBottom: 24, borderRadius: 8 }}
          >
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={6}>
                <QuickAction label="आजची हजेरी" icon={<CalendarOutlined />} color="#1A3A5C" onClick={() => navigate('/attendance')} />
              </Col>
              <Col xs={12} sm={6}>
                <QuickAction label="शुल्क जमा" icon={<CreditCardOutlined />} color="#27AE60" onClick={() => navigate('/fees')} />
              </Col>
              <Col xs={12} sm={6}>
                <QuickAction label="प्रमाणपत्र द्या" icon={<FileProtectOutlined />} color="#E67E22" onClick={() => navigate('/certificates')} />
              </Col>
              <Col xs={12} sm={6}>
                <QuickAction label="नवीन विद्यार्थी" icon={<UserAddOutlined />} color="#8E44AD" onClick={() => navigate('/students')} />
              </Col>
            </Row>
          </Card>

          {/* ── Fee progress ── */}
          {feeCollectPct > 0 && (
            <Card
              size="small"
              title={<Text strong style={{ color: '#1A3A5C' }}>शुल्क संकलन प्रगती</Text>}
              style={{ marginBottom: 24, borderRadius: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Progress
                  percent={feeCollectPct}
                  strokeColor="#27AE60"
                  trailColor="#E8F1F9"
                  style={{ flex: 1, margin: 0 }}
                />
                <Text style={{ fontSize: 13, color: '#555', whiteSpace: 'nowrap' }}>
                  ₹{((fees as any)?.totalCollected || 0).toLocaleString('mr-IN')} / ₹{((fees as any)?.totalDemanded || 0).toLocaleString('mr-IN')}
                </Text>
              </div>
            </Card>
          )}

          {/* ── Unit summary table ── */}
          {(summary as any)?.byUnit?.length > 0 && (
            <Card
              title={<Text strong style={{ color: '#1A3A5C' }}>घटकवार विद्यार्थी संख्या</Text>}
              size="small"
              style={{ borderRadius: 8 }}
            >
              <Table
                dataSource={(summary as any).byUnit}
                columns={unitColumns}
                rowKey="unitId"
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
