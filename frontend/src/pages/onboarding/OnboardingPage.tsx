import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Steps, Form, Input, Select, Button, message, Card, Typography, Row, Col } from 'antd';
import {
  BankOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { MrInput, MrTextArea } from '../../components/common/MrInput';
import { sansthaApi, unitApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const UNIT_TYPES = [
  { value: 'school',         label: 'प्राथमिक / माध्यमिक शाळा' },
  { value: 'jr_college',     label: 'कनिष्ठ महाविद्यालय (Jr. College)' },
  { value: 'pre_primary',    label: 'पूर्व प्राथमिक (Pre-Primary)' },
  { value: 'degree_college', label: 'पदवी महाविद्यालय' },
  { value: 'other',          label: 'इतर' },
];

const BOARDS = [
  { value: 'pune',       label: 'पुणे विभागीय मंडळ' },
  { value: 'mumbai',     label: 'मुंबई विभागीय मंडळ' },
  { value: 'nagpur',     label: 'नागपूर विभागीय मंडळ' },
  { value: 'aurangabad', label: 'छत्रपती संभाजीनगर विभागीय मंडळ' },
  { value: 'kolhapur',   label: 'कोल्हापूर विभागीय मंडळ' },
  { value: 'amravati',   label: 'अमरावती विभागीय मंडळ' },
  { value: 'nashik',     label: 'नाशिक विभागीय मंडळ' },
  { value: 'latur',      label: 'लातूर विभागीय मंडळ' },
  { value: 'konkan',     label: 'कोकण विभागीय मंडळ' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sansthaForm] = Form.useForm();
  const [unitForm] = Form.useForm();

  const handleSansthaNext = async () => {
    try {
      await sansthaForm.validateFields();
      setStep(1);
    } catch { /* validation shown inline */ }
  };

  const handleFinish = async () => {
    try {
      await unitForm.validateFields();
    } catch { return; }

    setLoading(true);
    try {
      const s = sansthaForm.getFieldsValue();
      const u = unitForm.getFieldsValue();

      await sansthaApi.update(user!.sansthaId, {
        nameMr:    s.nameMr,
        nameEn:    s.nameEn   || null,
        phone:     s.phone    || null,
        email:     s.email    || null,
        ptrNumber: s.ptrNumber|| null,
        pan:       s.pan      || null,
        addressMr: s.addressMr|| null,
      });

      await unitApi.create({
        sansthaId:       user!.sansthaId,
        nameMr:          u.nameMr,
        nameEn:          u.nameEn         || null,
        unitType:        u.unitType,
        divisionalBoard: u.divisionalBoard|| null,
        udiseCode:       u.udiseCode      || null,
        phone:           u.phone          || null,
        addressMr:       u.addressMr      || null,
      });

      message.success('सेटअप पूर्ण झाला! डॅशबोर्डवर स्वागत आहे।');
      navigate('/dashboard');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'सेटअप जतन करताना चूक झाली');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A3A5C 0%, #2563a8 50%, #1e4d8c 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 32,
          }}>🏫</div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>
            विद्यासेतू ERP सेटअप
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8, fontSize: 15 }}>
            डॅशबोर्ड सुरू करण्यापूर्वी संस्था व शाळेची माहिती भरा
          </Paragraph>
        </div>

        {/* Steps */}
        <Steps
          current={step}
          style={{ marginBottom: 24 }}
          items={[
            {
              title: <span style={{ color: '#fff', fontSize: 13 }}>संस्था माहिती</span>,
              icon: <BankOutlined style={{ color: step >= 0 ? '#52c41a' : 'rgba(255,255,255,0.5)' }} />,
            },
            {
              title: <span style={{ color: '#fff', fontSize: 13 }}>शाळा माहिती</span>,
              icon: <HomeOutlined style={{ color: step >= 1 ? '#52c41a' : 'rgba(255,255,255,0.5)' }} />,
            },
          ]}
        />

        <Card
          style={{ borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
          styles={{ body: { padding: '32px 40px' } }}
        >
          {/* ── Step 0: Sanstha ── */}
          {step === 0 && (
            <>
              <Title level={4} style={{ color: '#1A3A5C', marginBottom: 4 }}>
                <BankOutlined style={{ marginRight: 8 }} />संस्थेची माहिती
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                ट्रस्ट / संस्थेचे अधिकृत नाव भरा &nbsp;•&nbsp; <span style={{ color: '#1A3A5C', fontWeight: 500 }}>English type करा — Marathi आपोआप होईल</span>
              </Text>

              <Form form={sansthaForm} layout="vertical" requiredMark>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="nameMr"
                      label="संस्थेचे नाव (मराठी) *"
                      rules={[
                        { required: true, message: 'संस्थेचे मराठी नाव आवश्यक आहे' },
                        { min: 3, message: 'किमान ३ अक्षरे आवश्यक' },
                      ]}
                    >
                      <MrInput size="large" placeholder="lokavikas shikshan sanstha" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="nameEn"
                      label="संस्थेचे नाव (English)"
                      rules={[{ min: 3, message: 'किमान ३ अक्षरे' }]}
                    >
                      <Input size="large" placeholder="e.g. Lokvikas Education Trust" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="phone"
                      label="फोन नंबर"
                      rules={[{ pattern: /^[6-9]\d{9}$/, message: '१० अंकी वैध नंबर द्या' }]}
                    >
                      <Input size="large" placeholder="9876543210" maxLength={10} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label="ईमेल"
                      rules={[{ type: 'email', message: 'वैध ईमेल द्या' }]}
                    >
                      <Input size="large" placeholder="sanstha@example.com" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ptrNumber" label="PTR क्रमांक">
                      <Input size="large" placeholder="PTR नंबर" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="pan"
                      label="PAN"
                      rules={[{ pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'वैध PAN: AABCT1234D' }]}
                    >
                      <Input
                        size="large"
                        placeholder="AABCT1234D"
                        maxLength={10}
                        style={{ textTransform: 'uppercase' }}
                        onChange={e => sansthaForm.setFieldValue('pan', e.target.value.toUpperCase())}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="addressMr"
                      label="पत्ता (मराठी)"
                      rules={[{ min: 5, message: 'पूर्ण पत्ता द्या' }]}
                    >
                      <MrTextArea rows={2} placeholder="gava / taluka / jilha" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button
                  type="primary" size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={handleSansthaNext}
                  style={{ background: '#1A3A5C', borderColor: '#1A3A5C', minWidth: 150 }}
                >
                  पुढे जा
                </Button>
              </div>
            </>
          )}

          {/* ── Step 1: Unit / School ── */}
          {step === 1 && (
            <>
              <Title level={4} style={{ color: '#1A3A5C', marginBottom: 4 }}>
                <HomeOutlined style={{ marginRight: 8 }} />शाळेची माहिती
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                पहिल्या शाळेची माहिती भरा &nbsp;•&nbsp; <span style={{ color: '#1A3A5C', fontWeight: 500 }}>English type करा — Marathi आपोआप होईल</span>
              </Text>

              <Form form={unitForm} layout="vertical" requiredMark>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="nameMr"
                      label="शाळेचे नाव (मराठी) *"
                      rules={[
                        { required: true, message: 'शाळेचे मराठी नाव आवश्यक आहे' },
                        { min: 3, message: 'किमान ३ अक्षरे आवश्यक' },
                      ]}
                    >
                      <MrInput size="large" placeholder="lokavikas prathamik shala" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="nameEn"
                      label="शाळेचे नाव (English)"
                      rules={[{ min: 3, message: 'किमान ३ अक्षरे' }]}
                    >
                      <Input size="large" placeholder="e.g. Lokvikas Primary School" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="unitType"
                      label="शाळेचा प्रकार *"
                      rules={[{ required: true, message: 'शाळेचा प्रकार निवडा' }]}
                    >
                      <Select size="large" placeholder="प्रकार निवडा">
                        {UNIT_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="divisionalBoard" label="विभागीय मंडळ">
                      <Select size="large" placeholder="मंडळ निवडा" allowClear>
                        {BOARDS.map(b => <Option key={b.value} value={b.value}>{b.label}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="udiseCode"
                      label="UDISE क्रमांक"
                      rules={[{ pattern: /^\d{11}$/, message: '११ अंकी UDISE कोड द्या' }]}
                    >
                      <Input size="large" placeholder="12345678901" maxLength={11} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="phone"
                      label="शाळेचा फोन"
                      rules={[{ pattern: /^[6-9]\d{9}$/, message: '१० अंकी वैध नंबर द्या' }]}
                    >
                      <Input size="large" placeholder="9876543210" maxLength={10} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="addressMr"
                      label="शाळेचा पत्ता (मराठी)"
                      rules={[{ min: 5, message: 'पूर्ण पत्ता द्या' }]}
                    >
                      <MrTextArea rows={2} placeholder="gava / taluka / jilha" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => setStep(0)}>
                  मागे जा
                </Button>
                <Button
                  type="primary" size="large"
                  icon={<CheckCircleOutlined />}
                  loading={loading}
                  onClick={handleFinish}
                  style={{ background: '#52c41a', borderColor: '#52c41a', minWidth: 160 }}
                >
                  सेटअप पूर्ण करा
                </Button>
              </div>
            </>
          )}
        </Card>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            विद्यासेतू ERP • महाराष्ट्र शाळा व्यवस्थापन प्रणाली
          </Text>
        </div>
      </div>
    </div>
  );
}
