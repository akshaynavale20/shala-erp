/**
 * ContactPage — VidyaSetu ERP · Developed by Akshay Navale
 * Branding + contact information page
 */
import { Card, Row, Col, Typography, Space, Divider, Tag, Avatar } from 'antd';
import {
  MailOutlined, PhoneOutlined, GlobalOutlined, GithubOutlined,
  WhatsAppOutlined, EnvironmentOutlined, CodeOutlined,
  HeartOutlined, LinkedinOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const BRAND_BLUE  = '#1A3A5C';
const BRAND_GOLD  = '#C8922A';
const BRAND_LIGHT = '#E8F0F8';

export default function ContactPage() {
  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Hero Brand Card ────────────────────────────────────────────── */}
      <Card
        style={{
          background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #2D5986 100%)`,
          borderRadius: 12,
          marginBottom: 24,
          border: 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
        bodyStyle={{ padding: '40px 36px' }}
      >
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: 80,
          width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(200,146,42,0.12)',
        }} />

        <Row align="middle" gutter={24}>
          <Col>
            <Avatar
              size={80}
              style={{
                background: BRAND_GOLD,
                fontSize: 32,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              AN
            </Avatar>
          </Col>
          <Col flex={1}>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>
              Akshay Navale
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
              Full Stack Developer · VidyaSetu ERP Creator
            </Text>
            <div style={{ marginTop: 10 }}>
              <Tag color={BRAND_GOLD} style={{ borderRadius: 20, fontSize: 12, padding: '2px 12px' }}>
                School ERP
              </Tag>
              <Tag
                style={{
                  borderRadius: 20, fontSize: 12, padding: '2px 12px',
                  background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
                  marginLeft: 6,
                }}
              >
                React · NestJS · TypeScript
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[20, 20]}>

        {/* ── About VidyaSetu ─────────────────────────────────────────── */}
        <Col xs={24} md={14}>
          <Card
            title={
              <Space>
                <CodeOutlined style={{ color: BRAND_BLUE }} />
                <span>VidyaSetu बद्दल</span>
              </Space>
            }
            style={{ borderRadius: 10, height: '100%' }}
            headStyle={{ borderBottom: `2px solid ${BRAND_GOLD}`, color: BRAND_BLUE }}
          >
            <Paragraph style={{ fontSize: 14, lineHeight: 1.8, color: '#333' }}>
              <strong>VidyaSetu</strong> हे शाळांसाठी तयार केलेले संपूर्ण ERP सॉफ्टवेअर आहे.
              विद्यार्थी नोंदणी, शुल्क संकलन, पगार व्यवस्थापन, उपस्थिती, प्रमाणपत्रे, अहवाल —
              सर्व एकाच ठिकाणी.
            </Paragraph>
            <Paragraph style={{ fontSize: 14, lineHeight: 1.8, color: '#333', marginBottom: 0 }}>
              Marathi-first design, government-compliant formats, and branded PDFs — built for
              aided & unaided schools.
            </Paragraph>

            <Divider style={{ borderColor: BRAND_LIGHT }} />

            <Row gutter={[12, 12]}>
              {[
                { label: 'विद्यार्थी व्यवस्थापन', desc: 'नोंदणी, GR, TC, ID Card' },
                { label: 'शुल्क संकलन', desc: 'पावती, थकबाकी, सवलत' },
                { label: 'पगार व्यवस्थापन', desc: 'Salary Slip, जमा-खर्च' },
                { label: 'प्रमाणपत्रे', desc: 'TC, Bonafide, Character' },
                { label: 'अहवाल', desc: '14+ report types, PDF' },
                { label: 'उपस्थिती', desc: 'दैनिक, मासिक विश्लेषण' },
              ].map(f => (
                <Col xs={12} key={f.label}>
                  <div style={{
                    background: BRAND_LIGHT, borderRadius: 8,
                    padding: '8px 12px', borderLeft: `3px solid ${BRAND_BLUE}`,
                  }}>
                    <Text strong style={{ fontSize: 12, color: BRAND_BLUE, display: 'block' }}>{f.label}</Text>
                    <Text style={{ fontSize: 11, color: '#666' }}>{f.desc}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* ── Contact Info ─────────────────────────────────────────────── */}
        <Col xs={24} md={10}>
          <Card
            title={
              <Space>
                <PhoneOutlined style={{ color: BRAND_BLUE }} />
                <span>Contact करा</span>
              </Space>
            }
            style={{ borderRadius: 10, height: '100%' }}
            headStyle={{ borderBottom: `2px solid ${BRAND_GOLD}`, color: BRAND_BLUE }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>

              <ContactRow
                icon={<WhatsAppOutlined style={{ color: '#25D366', fontSize: 20 }} />}
                label="WhatsApp"
                value="+91 98765 43210"
                href="https://wa.me/919876543210"
              />

              <ContactRow
                icon={<MailOutlined style={{ color: BRAND_BLUE, fontSize: 20 }} />}
                label="Email"
                value="akshay@vidyasetu.in"
                href="mailto:akshay@vidyasetu.in"
              />

              <ContactRow
                icon={<GlobalOutlined style={{ color: BRAND_GOLD, fontSize: 20 }} />}
                label="Website"
                value="www.vidyasetu.in"
                href="https://vidyasetu.in"
              />

              <ContactRow
                icon={<LinkedinOutlined style={{ color: '#0A66C2', fontSize: 20 }} />}
                label="LinkedIn"
                value="Akshay Navale"
                href="https://linkedin.com/in/akshaynavale"
              />

              <ContactRow
                icon={<GithubOutlined style={{ color: '#333', fontSize: 20 }} />}
                label="GitHub"
                value="github.com/akshaynavale"
                href="https://github.com/akshaynavale"
              />

              <ContactRow
                icon={<EnvironmentOutlined style={{ color: '#e74c3c', fontSize: 20 }} />}
                label="Location"
                value="India"
              />

            </Space>
          </Card>
        </Col>

        {/* ── Copyright / Legal ────────────────────────────────────────── */}
        <Col xs={24}>
          <Card
            style={{
              borderRadius: 10,
              background: BRAND_LIGHT,
              border: `1px solid ${BRAND_BLUE}22`,
              textAlign: 'center',
            }}
            bodyStyle={{ padding: '18px 24px' }}
          >
            <Space split={<Divider type="vertical" />} wrap style={{ justifyContent: 'center' }}>
              <Text style={{ color: BRAND_BLUE }}>
                <HeartOutlined style={{ color: '#e74c3c', marginRight: 4 }} />
                Made with love for schools
              </Text>
              <Text style={{ color: '#555' }}>
                © {new Date().getFullYear()} Akshay Navale · All Rights Reserved
              </Text>
              <Text style={{ color: '#555' }}>
                VidyaSetu ERP v1.0.0
              </Text>
              <Text style={{ color: '#555', fontSize: 12 }}>
                Unauthorized use or resale is prohibited
              </Text>
            </Space>
          </Card>
        </Col>

      </Row>
    </div>
  );
}

// ── Helper component ──────────────────────────────────────────────────────────
function ContactRow({
  icon, label, value, href,
}: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 12px', borderRadius: 8,
      background: '#fff', border: '1px solid #eee',
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 11, color: '#888', display: 'block' }}>{label}</Text>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600 }}>
            {value}
          </a>
        ) : (
          <Text strong style={{ fontSize: 13 }}>{value}</Text>
        )}
      </div>
    </div>
  );
}
