/**
 * ForcePasswordChangePage — shown when user.forcePasswordChange === true.
 * User must supply their current (temporary) password + new password.
 * Calls POST /api/v1/users/me/complete-forced-change
 */
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/client';

const { Title } = Typography;

export default function ForcePasswordChangePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      setError('नवीन पासवर्ड आणि पुनरावलोकन जुळत नाहीत');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/api/v1/users/me/complete-forced-change', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('पासवर्ड यशस्वीरित्या बदलला. कृपया पुन्हा लॉगिन करा.');
      logout();
      navigate('/login');
    } catch (e: any) {
      setError(e.response?.data?.message || 'पासवर्ड बदलता आला नाही');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1A5276 0%, #2E86C1 100%)',
      }}
    >
      <Card
        style={{ width: 440, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ color: '#1A5276', marginBottom: 4 }}>
            पासवर्ड बदलणे आवश्यक
          </Title>
          <Typography.Text type="secondary">
            {user?.nameMr} — {user?.email}
          </Typography.Text>
        </div>

        <Alert
          type="warning"
          showIcon
          message="संस्था संचालकाने आपला पासवर्ड रिसेट केला आहे. सुरक्षिततेसाठी नवीन पासवर्ड सेट करा."
          style={{ marginBottom: 20 }}
        />

        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="currentPassword"
            label="सध्याचा (तात्पुरता) पासवर्ड"
            rules={[{ required: true, message: 'सध्याचा पासवर्ड टाका' }]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="नवीन पासवर्ड"
            rules={[
              { required: true, message: 'नवीन पासवर्ड टाका' },
              { min: 8, message: 'किमान ८ अक्षरे' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" placeholder="किमान ८ अक्षरे" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="पासवर्ड पुन्हा टाका"
            rules={[{ required: true, message: 'पासवर्ड पुन्हा टाका' }]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
            style={{ height: 44, marginTop: 8 }}
          >
            पासवर्ड बदला व लॉगिन करा
          </Button>
        </Form>
      </Card>
    </div>
  );
}
