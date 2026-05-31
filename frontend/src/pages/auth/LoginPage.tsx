import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';

const { Text } = Typography;

const APP_VERSION = '1.0.0';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setSelectedUnitId } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(values.email, values.password);
      setAuth(data.user, data.accessToken);
      if (!data.user.isSansthaDirector && data.user.unitIds?.length === 1) {
        setSelectedUnitId(data.user.unitIds[0]);
      }
      const needsChange = data.user.mustChangePassword || data.user.forcePasswordChange;
      navigate(needsChange ? '/change-password' : '/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A3A5C 0%, #2E86C1 100%)',
      fontFamily: 'Mukta, sans-serif',
    }}>
      <div style={{ width: 420 }}>
        {/* Brand header above card */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            border: '2px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(8px)',
          }}>
            <BankOutlined style={{ color: '#fff', fontSize: 30 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
              शाळा ERP
            </Text>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 10, fontWeight: 600,
              padding: '2px 7px', borderRadius: 4,
              letterSpacing: 0.5,
            }}>
              v{APP_VERSION}
            </span>
          </div>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, display: 'block', marginTop: 4 }}>
            शाळा व्यवस्थापन प्रणाली
          </Text>
        </div>

        {/* Login card */}
        <Card
          style={{ borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', border: 'none' }}
          bodyStyle={{ padding: 36 }}
        >
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ fontSize: 18, color: '#1A3A5C', display: 'block' }}>
              स्वागत आहे!
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              आपले खाते वापरून प्रवेश करा
            </Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
            />
          )}

          <Form layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item
              name="email"
              label={t('auth.email')}
              rules={[{ required: true, message: t('validation.required', { field: t('auth.email') }) }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#1A3A5C' }} />}
                type="email"
                size="large"
                placeholder="admin@sanstha.edu"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('auth.password')}
              rules={[{ required: true, message: t('validation.required', { field: t('auth.password') }) }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#1A3A5C' }} />}
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                style={{
                  height: 46,
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {t('auth.loginBtn')}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
            VidyaSetu v{APP_VERSION} · Developed by Akshay Navale · © 2025
          </Text>
        </div>
      </div>
    </div>
  );
}
