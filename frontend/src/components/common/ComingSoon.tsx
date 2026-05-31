import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Text } = Typography;

interface ComingSoonPageProps {
  title: string;
  icon?: React.ReactNode;
  features?: string[];
}

interface ComingSoonBannerProps {
  features?: string[];
  title?: string;
}

/** Full-page Coming Soon — replaces the entire page content */
export function ComingSoonPage({ title, icon, features = [] }: ComingSoonPageProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif',
    }}>
      {/* Header strip */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18, color: '#1A3A5C' }}>{icon}</span>
        <Text strong style={{ fontSize: 16, color: '#1A3A5C' }}>{title}</Text>
      </div>

      {/* Centered content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F4F7FB',
      }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '48px 56px',
          boxShadow: '0 4px 24px rgba(26,58,92,0.08)',
          border: '1px solid #E0EBF5',
          textAlign: 'center', maxWidth: 480,
        }}>
          {/* Clock icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #EEF4F9, #D6E8F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            border: '2px solid #BCD4E8',
          }}>
            <ClockCircleOutlined style={{ fontSize: 36, color: '#1A3A5C' }} />
          </div>

          <div style={{ fontSize: 22, fontWeight: 700, color: '#1A3A5C', marginBottom: 6 }}>
            लवकरच येत आहे
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
            <strong>{title}</strong> हे वैशिष्ट्य विकासाधीन आहे.
          </div>

          {features.length > 0 && (
            <div style={{
              background: '#F7FAFD', borderRadius: 10, padding: '16px 20px',
              border: '1px solid #DDE8F4', textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1A3A5C', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                येणाऱ्या सुविधा
              </div>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircleOutlined style={{ color: '#27AE60', fontSize: 13, flexShrink: 0 }} />
                  <Text style={{ fontSize: 13, color: '#333' }}>{f}</Text>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 24, fontSize: 11, color: '#aaa' }}>
            VidyaSetu v1.0.0 · अधिक माहितीसाठी प्रशासकाशी संपर्क करा
          </div>
        </div>
      </div>
    </div>
  );
}

/** Inline banner — placed below existing content to show upcoming features */
export function ComingSoonBanner({ features = [], title = 'आगामी सुविधा' }: ComingSoonBannerProps) {
  if (!features.length) return null;
  return (
    <div style={{
      margin: '16px 0',
      background: 'linear-gradient(135deg, #EEF4F9 0%, #F7FAFD 100%)',
      border: '1px dashed #BCD4E8',
      borderRadius: 10, padding: '14px 18px',
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <ClockCircleOutlined style={{ fontSize: 20, color: '#1A3A5C', marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1A3A5C', marginBottom: 6 }}>
          {title} — लवकरच येत आहे
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
          {features.map((f, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
              <CheckCircleOutlined style={{ color: '#27AE60', fontSize: 11 }} />
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
