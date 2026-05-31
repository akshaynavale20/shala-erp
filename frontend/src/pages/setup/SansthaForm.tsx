import { Form, Input, Button, Row, Col, message, Spin, Upload, Avatar, Typography } from 'antd';
import { MrInput, MrTextArea } from '../../components/common/MrInput';
import { UploadOutlined, BankOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sansthaApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useEffect, useState } from 'react';

const { Text } = Typography;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function SansthaForm() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: sanstha, isLoading } = useQuery({
    queryKey: ['sanstha', user?.sansthaId],
    queryFn: () => sansthaApi.findOne(user!.sansthaId),
    enabled: !!user?.sansthaId,
  });

  useEffect(() => {
    if (sanstha) {
      form.setFieldsValue(sanstha);
      if (sanstha.logoUrl) setLogoUrl(sanstha.logoUrl);
    }
  }, [sanstha, form]);

  const mutation = useMutation({
    mutationFn: (values: any) =>
      sanstha
        ? sansthaApi.update(sanstha.id, values)
        : sansthaApi.create(values),
    onSuccess: () => {
      message.success(t('setup.sanstha.saved'));
      qc.invalidateQueries({ queryKey: ['sanstha'] });
    },
    onError: () => message.error(t('errors.serverError')),
  });

  const uploadProps: UploadProps = {
    accept: '.png,.jpg,.jpeg,.svg',
    showUploadList: false,
    beforeUpload: async (file) => {
      if (file.size > 2 * 1024 * 1024) {
        message.error('लोगो फाईल २ MB पेक्षा कमी असणे आवश्यक');
        return false;
      }
      setUploading(true);
      try {
        const updated = await sansthaApi.uploadLogo(sanstha!.id, file);
        setLogoUrl(updated.logoUrl);
        qc.invalidateQueries({ queryKey: ['sanstha'] });
        message.success('लोगो अपलोड झाला');
      } catch {
        message.error(t('errors.serverError'));
      } finally {
        setUploading(false);
      }
      return false; // prevent default upload
    },
  };

  if (isLoading) return <Spin />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={mutation.mutate}
      style={{ maxWidth: 760 }}
    >
      {/* Logo section */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        {logoUrl ? (
          <img
            src={`${API_BASE}${logoUrl}`}
            alt="संस्था लोगो"
            style={{ width: 80, height: 80, objectFit: 'contain', border: '1px solid #eee', borderRadius: 8, padding: 4 }}
          />
        ) : (
          <Avatar size={80} icon={<BankOutlined />} style={{ backgroundColor: '#1A5276' }} />
        )}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t('setup.sanstha.logo')}
          </Text>
          <Upload {...uploadProps} disabled={!sanstha || uploading}>
            <Button icon={<UploadOutlined />} loading={uploading} disabled={!sanstha}>
              {t('setup.sanstha.uploadLogo')}
            </Button>
          </Upload>
          {!sanstha && (
            <Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              आधी संस्था जतन करा, मग लोगो अपलोड करा
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            PNG / JPEG / SVG · जास्तीत जास्त २ MB
          </Text>
        </div>
      </div>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="nameMr"
            label={t('setup.sanstha.nameMr')}
            rules={[{ required: true, message: t('validation.required', { field: t('setup.sanstha.nameMr') }) }]}
          >
            <MrInput size="large" placeholder="e.g. shri gyandeep shikshan sanstha" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="nameEn" label={t('setup.sanstha.nameEn')}>
            <Input size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="ptrNumber" label={t('setup.sanstha.ptrNumber')}>
            <Input size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="pan" label={t('setup.sanstha.pan')}>
            <Input size="large" placeholder="AAAAA0000A" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="phone" label={t('setup.sanstha.phone')}>
            <Input size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="email"
            label={t('setup.sanstha.email')}
            rules={[{ type: 'email', message: t('validation.email') }]}
          >
            <Input size="large" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="addressMr" label={t('setup.sanstha.addressMr')}>
            <MrTextArea rows={3} placeholder="e.g. pune" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={mutation.isPending}
          size="large"
          style={{}}
        >
          {t('app.save')}
        </Button>
      </Form.Item>
    </Form>
  );
}
